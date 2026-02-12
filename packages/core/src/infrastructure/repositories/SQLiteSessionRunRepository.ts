import Database from 'better-sqlite3';
import { Result } from '../../domain/core/Result';
import { RepositoryError } from '../../domain/core/errors';
import { EntityID } from '../../domain/value-objects/EntityID';
import type {
    ActiveSessionRun,
    EndSessionRunResult,
    ISessionRunRepository,
    StartSessionRunResult,
} from '../../domain/repositories/ISessionRunRepository';

type ActiveSessionRunRow = {
    active_session_id: string | null;
    session_id: string | null;
    session_name: string | null;
    started_at: string | null;
    ended_at: string | null;
    duration: number | null;
};

export class SQLiteSessionRunRepository implements ISessionRunRepository {
    constructor(private readonly db: Database.Database) { }

    async getActiveSessionRun(
        campaignID: EntityID
    ): Promise<Result<ActiveSessionRun | null, RepositoryError>> {
        try {
            const row = this.db.prepare(`
                SELECT
                    c.active_session_id AS active_session_id,
                    e.id AS session_id,
                    e.name AS session_name,
                    e.started_at AS started_at,
                    e.ended_at AS ended_at,
                    e.duration AS duration
                FROM campaigns c
                LEFT JOIN entities e
                    ON e.id = c.active_session_id
                    AND e.type = 'session'
                    AND e.campaign_id = c.id
                WHERE c.id = ?
            `).get(campaignID.toString()) as ActiveSessionRunRow | undefined;

            if (!row || !row.active_session_id) {
                return Result.ok(null);
            }

            // Pointer exists but session missing/mismatched -> clear and treat as no active session
            if (!row.session_id || !row.session_name) {
                this.clearActivePointer(campaignID, row.active_session_id);
                return Result.ok(null);
            }

            // Session ended but pointer still set -> clear and treat as no active session
            if (row.ended_at || row.duration !== null) {
                this.clearActivePointer(campaignID, row.active_session_id);
                return Result.ok(null);
            }

            // started_at is expected for an active run; repair if missing/invalid
            let startedAt = row.started_at ? new Date(row.started_at) : null;
            if (!startedAt || isNaN(startedAt.getTime())) {
                startedAt = new Date();
                const nowISO = new Date().toISOString();
                this.db.prepare(`
                    UPDATE entities
                    SET started_at = ?, modified_at = ?
                    WHERE id = ? AND type = 'session'
                `).run(startedAt.toISOString(), nowISO, row.session_id);
            }

            return Result.ok({
                campaignID,
                sessionID: EntityID.fromStringOrThrow(row.session_id),
                sessionName: row.session_name,
                startedAt,
            });
        } catch (error) {
            return Result.fail(new RepositoryError('Failed to get active session run', error));
        }
    }
    async startSessionRun(
        campaignID: EntityID,
        sessionID: EntityID,
        startedAt: Date
    ): Promise<Result<StartSessionRunResult, RepositoryError>> {
        try {
            const startedAtISO = startedAt.toISOString();
            const nowISO = new Date().toISOString();

            const tx = this.db.transaction((): StartSessionRunResult => {
                const current = this.db.prepare(
                    'SELECT active_session_id FROM campaigns WHERE id = ?'
                ).get(campaignID.toString()) as { active_session_id: string | null } | undefined;

                if (!current) {
                    throw new Error(`Campaign not found: ${campaignID.toString()}`);
                }

                let activeSessionId = current.active_session_id;

                // If something is already active, either idempotent success or conflict.
                if (activeSessionId) {
                    if (activeSessionId === sessionID.toString()) {
                        const row = this.db.prepare(
                            "SELECT started_at FROM entities WHERE id = ? AND type = 'session'"
                        ).get(sessionID.toString()) as { started_at: string | null } | undefined;
                        let actualStartedAt = row?.started_at ? new Date(row.started_at) : null;
                        if (!actualStartedAt || isNaN(actualStartedAt.getTime())) {
                            actualStartedAt = startedAt;
                            this.db.prepare(`
                                UPDATE entities
                                SET started_at = ?, modified_at = ?
                                WHERE id = ? AND type = 'session'
                            `).run(startedAtISO, nowISO, sessionID.toString());
                        }
                        return { kind: 'already_active', startedAt: actualStartedAt };
                    }

                    // Self-heal stale pointers (missing or ended)
                    const activeRow = this.db.prepare(`
                        SELECT ended_at, duration
                        FROM entities
                        WHERE id = ? AND type = 'session' AND campaign_id = ?
                    `).get(activeSessionId, campaignID.toString()) as { ended_at: string | null; duration: number | null } | undefined;

                    if (!activeRow || activeRow.ended_at || activeRow.duration !== null) {
                        this.clearActivePointer(campaignID, activeSessionId);
                        activeSessionId = null;
                    } else {
                        return {
                            kind: 'conflict',
                            activeSessionID: EntityID.fromStringOrThrow(activeSessionId),
                        };
                    }
                }

                // Claim active slot (race-safe)
                const claim = this.db.prepare(
                    'UPDATE campaigns SET active_session_id = ? WHERE id = ? AND active_session_id IS NULL'
                ).run(sessionID.toString(), campaignID.toString());

                if (claim.changes !== 1) {
                    const after = this.db.prepare(
                        'SELECT active_session_id FROM campaigns WHERE id = ?'
                    ).get(campaignID.toString()) as { active_session_id: string | null } | undefined;

                    if (after?.active_session_id === sessionID.toString()) {
                        return { kind: 'already_active', startedAt };
                    }

                    if (after?.active_session_id) {
                        return {
                            kind: 'conflict',
                            activeSessionID: EntityID.fromStringOrThrow(after.active_session_id),
                        };
                    }

                    throw new Error('Failed to start session run (unknown state)');
                }
                // Update session run fields (and prevent restarting an already-ended session)
                const updateSession = this.db.prepare(`
                    UPDATE entities
                    SET started_at = ?,
                        ended_at = NULL,
                        duration = NULL,
                        modified_at = ?
                    WHERE id = ?
                      AND type = 'session'
                      AND campaign_id = ?
                      AND ended_at IS NULL
                      AND duration IS NULL
                `).run(startedAtISO, nowISO, sessionID.toString(), campaignID.toString());

                if (updateSession.changes !== 1) {
                    throw new Error('Failed to start session run (session not found, campaign mismatch, or already ended)');
                }

                return { kind: 'started', startedAt };
            });

            return Result.ok(tx());
        } catch (error) {
            return Result.fail(new RepositoryError('Failed to start session run', error));
        }
    }
    async endSessionRun(
        campaignID: EntityID,
        sessionID: EntityID,
        endedAt: Date,
        durationSeconds: number
    ): Promise<Result<EndSessionRunResult, RepositoryError>> {
        try {
            const endedAtISO = endedAt.toISOString();
            const nowISO = new Date().toISOString();

            const tx = this.db.transaction((): EndSessionRunResult => {
                const current = this.db.prepare(
                    'SELECT active_session_id FROM campaigns WHERE id = ?'
                ).get(campaignID.toString()) as { active_session_id: string | null } | undefined;

                if (!current) {
                    throw new Error(`Campaign not found: ${campaignID.toString()}`);
                }

                if (current.active_session_id === sessionID.toString()) {
                    // Clear pointer first; transaction ensures atomicity
                    this.db.prepare(
                        'UPDATE campaigns SET active_session_id = NULL WHERE id = ? AND active_session_id = ?'
                    ).run(campaignID.toString(), sessionID.toString());
                    
                    const updateSession = this.db.prepare(`
                        UPDATE entities
                        SET ended_at = COALESCE(ended_at, ?),
                            duration = COALESCE(duration, ?),
                            modified_at = ?
                        WHERE id = ?
                          AND type = 'session'
                          AND campaign_id = ?
                    `).run(endedAtISO, durationSeconds, nowISO, sessionID.toString(), campaignID.toString());

                    if (updateSession.changes !== 1) {
                        throw new Error('Failed to end session run (session not found or campaign mismatch)');
                    }

                    return { kind: 'ended', endedAt };
                }
                if (current.active_session_id === null) {
                    const row = this.db.prepare(`
                        SELECT ended_at, duration
                        FROM entities
                        WHERE id = ? AND type = 'session' AND campaign_id = ?
                    `).get(sessionID.toString(), campaignID.toString()) as { ended_at: string | null; duration: number | null } | undefined;

                    if (row && (row.ended_at || row.duration !== null)) {
                        const parsedEndedAt = row.ended_at ? new Date(row.ended_at) : null;

                        return {
                            kind: 'already_ended',
                            endedAt: parsedEndedAt && !isNaN(parsedEndedAt.getTime()) ? parsedEndedAt : null,
                            durationSeconds: row.duration ?? null,
                        };
                    }

                    return { kind: 'not_active' };
                }

                return {
                    kind: 'conflict',
                    activeSessionID: EntityID.fromStringOrThrow(current.active_session_id),
                };
            });
            
            return Result.ok(tx());
        } catch (error) {
            return Result.fail(new RepositoryError('Failed to end session run', error));
        }
    }

    private clearActivePointer(campaignID: EntityID, activeSessionID: string): void {
        this.db.prepare(
            'UPDATE campaigns SET active_session_id = NULL WHERE id = ? AND active_session_id = ?'
        ).run(campaignID.toString(), activeSessionID);
    }
}