import Database from 'better-sqlite3';
import { Result } from '../../domain/core/Result';
import { RepositoryError } from '../../domain/core/errors';
import type { IStagedProposalRepository } from '../../domain/repositories/IStagedProposalRepository';
import {
    StagedProposal,
    type MergeTarget,
    isStagedProposalKind,
    isStagedProposalStatus,
} from '../../domain/value-objects/StagedProposal';
import {
    StagedProposalAuditEvent,
    isStagedProposalAuditAction,
} from '../../domain/value-objects/StagedProposalAuditEvent';

interface StagedProposalRow {
    id: string;
    session_id: string;
    kind: string;
    title: string | null;
    content: string;
    status: string;
    merged_target: string | null;
    created_at: string;
    updated_at: string;
}

interface StagedProposalAuditEventRow {
    id: string;
    proposal_id: string;
    session_id: string;
    action: string;
    occurred_at: string;
    metadata_json: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseISODate(value: string | null): Date {
    // Exit case - if the value is null
    if (!value) return new Date();
    
    const d = new Date(value);
    
    return Number.isNaN(d.getTime()) ? new Date() : d;
}

function safeParseRecord(json: string | null): Record<string, unknown> {
    // Exit case - if the object is null
    if (!json) return {};
    
    try {
        const parsed = JSON.parse(json) as unknown;
        return isRecord(parsed) ? parsed : {};
    } catch {
        return {};
    }
}

function safeParseMergeTarget(json: string | null): MergeTarget | null {
    // Exit case - if the object is null
    if (!json) return null;
    
    try {
        const parsed = JSON.parse(json) as unknown;

        // Exit case - the target is not a record
        if (!isRecord(parsed)) return null;
        
        const type = parsed.type === 'canon' ? 'canon' : (parsed.type === 'proposal' ? 'proposal' : null);
        const targetID = typeof parsed.targetID === 'string' ? parsed.targetID : null;
        
        // Exit case - neither the type nor the target ID are correctly parsed
        if (!type || !targetID) return null;

        return { type, targetID };
    } catch {
        return null;
    }
}
export class SQLiteStagedProposalRepository implements IStagedProposalRepository {
    constructor(private readonly db: Database.Database) { }
    
    async listBySessionID(sessionId: string): Promise<Result<StagedProposal[], RepositoryError>> {
        try {
            const rows = this.db.prepare(
                'SELECT * FROM staged_proposals WHERE session_id = ? ORDER BY created_at ASC'
            ).all(sessionId) as StagedProposalRow[];

            return Result.ok(rows.map((r) => this.rowToProposal(r)));
        } catch (error) {
            return Result.fail(new RepositoryError('Failed to list staged proposals', error));
        }
    }

    async getByID(proposalId: string): Promise<Result<StagedProposal | null, RepositoryError>> {
        try {
            const row = this.db.prepare(
                'SELECT * FROM staged_proposals WHERE id = ?'
            ).get(proposalId) as StagedProposalRow | undefined;
            
            // Exit case - no row selected
            if (!row) return Result.ok(null);

            return Result.ok(this.rowToProposal(row));
        } catch (error) {
            return Result.fail(new RepositoryError('Failed to get staged proposal by ID', error));
        }
    }

    async listAuditEvents(proposalId: string): Promise<Result<StagedProposalAuditEvent[], RepositoryError>> {
        try {
            const rows = this.db.prepare(
                'SELECT * FROM staged_proposal_audit_events WHERE proposal_id = ? ORDER BY occurred_at ASC'
            ).all(proposalId) as StagedProposalAuditEventRow[];

            return Result.ok(rows.map((r) => this.rowToAuditEvent(r)));
        } catch (error) {
            return Result.fail(new RepositoryError('Failed to list staged proposal audit events', error));
        }
    }

    async saveProposalWithAuditEvent(
        proposal: StagedProposal,
        event: StagedProposalAuditEvent
    ): Promise<Result<void, RepositoryError>> {
        try {
            const tx = this.db.transaction(() => {
                this.db.prepare(`
                    INSERT INTO staged_proposals (
                        id,
                        session_id,
                        kind,
                        title,
                        content,
                        status,
                        merged_target,
                        created_at,
                        updated_at
                    ) VALUES (
                        @id,
                        @session_id,
                        @kind,
                        @title,
                        @content,
                        @status,
                        @merged_target,
                        @created_at,
                        @updated_at
                    )
                    ON CONFLICT(id) DO UPDATE SET
                        kind = excluded.kind,
                        title = excluded.title,
                        content = excluded.content,
                        status = excluded.status,
                        merged_target = excluded.merged_target,
                        updated_at = excluded.updated_at
                `).run({
                    id: proposal.id,
                    session_id: proposal.sessionID,
                    kind: proposal.kind,
                    title: proposal.title,
                    content: proposal.content,
                    status: proposal.status,
                    merged_target: proposal.mergedTarget ? JSON.stringify(proposal.mergedTarget) : null,
                    created_at: proposal.createdAt.toISOString(),
                    updated_at: proposal.updatedAt.toISOString(),
                });

                this.db.prepare(`
                    INSERT INTO staged_proposal_audit_events (
                        id,
                        proposal_id,
                        session_id,
                        action,
                        occurred_at,
                        metadata_json
                    ) VALUES (
                        @id,
                        @proposal_id,
                        @session_id,
                        @action,
                        @occurred_at,
                        @metadata_json
                    )
                `).run({
                    id: event.id,
                    proposal_id: event.proposalID,
                    session_id: event.sessionID,
                    action: event.action,
                    occurred_at: event.occurredAt.toISOString(),
                    metadata_json: JSON.stringify(event.metadata ?? {}),
                });
            });
            tx();

            return Result.okVoid();
        } catch (error) {
            return Result.fail(new RepositoryError('Failed to save staged proposal with audit event', error));
        }
    }

    private rowToProposal(row: StagedProposalRow): StagedProposal {
        const kind = isStagedProposalKind(row.kind) ? row.kind : 'other';
        const status = isStagedProposalStatus(row.status) ? row.status : 'open';
        const mergedTarget = safeParseMergeTarget(row.merged_target);
        
        return StagedProposal.fromProps({
            id: row.id,
            sessionID: row.session_id,
            kind,
            title: row.title,
            content: row.content,
            status,
            mergedTarget,
            createdAt: parseISODate(row.created_at),
            updatedAt: parseISODate(row.updated_at),
        });
    }

    private rowToAuditEvent(row: StagedProposalAuditEventRow): StagedProposalAuditEvent {
        const action = isStagedProposalAuditAction(row.action) ? row.action : 'created';
        const metadata = safeParseRecord(row.metadata_json);
        
        return StagedProposalAuditEvent.fromProps({
            id: row.id,
            proposalID: row.proposal_id,
            sessionID: row.session_id,
            action,
            occurredAt: parseISODate(row.occurred_at),
            metadata,
        });
    }
}