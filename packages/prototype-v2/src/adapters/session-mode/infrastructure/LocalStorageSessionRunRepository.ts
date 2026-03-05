import { Result } from '@mnemora/core/src/domain/core/Result';
import { RepositoryError } from '@mnemora/core/src/domain/core/errors';
import { EntityID } from '@mnemora/core/src/domain/value-objects/EntityID';
import type {
    ActiveSessionRun,
    EndSessionRunResult,
    ISessionRunRepository,
    StartSessionRunResult,
} from '@mnemora/core/src/domain/repositories/ISessionRunRepository';

import { SESSION_RUN_STORAGE_KEY } from '../constants';
import {
    getOrCreateCampaignRecord,
    getOrCreateSessionRecord,
    mutateSessionRunState,
} from './SessionRunLocalStorage';

function parseISODate(value: string | null): Date | null {
    // Exit case - no value to parse
    if(!value) return null;

    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
}

export class LocalStorageSessionRunRepository implements ISessionRunRepository {
    constructor(
        private readonly lookupSessionName: (sessionID: string) => string | null,
        private readonly storageKey: string = SESSION_RUN_STORAGE_KEY,
    ) { }

    async getActiveSessionRun(campaignID: EntityID): Promise<Result<ActiveSessionRun | null, RepositoryError>> {
        try {
            const campaignIDStr = campaignID.toString();
            const mutation = mutateSessionRunState(this.storageKey, (state) => {
                const campaign = getOrCreateCampaignRecord(state, campaignIDStr);
                const activeSessionID = campaign.activeSessionID;

                // Exit case - no active session ID
                if(!activeSessionID) return null;

                const session = state.sessions[activeSessionID];
                
                // Exit case - there is no session
                if(!session || !session.name) {
                    campaign.activeSessionID = null;
                    return null;
                }

                // Exit case - if the session has ended
                if(session.endedAt || session.durationSeconds !== null) {
                    campaign.activeSessionID = null;
                    return null;
                }

                // Create the startedAt date
                let startedAt = parseISODate(session.startedAt);
                if(!startedAt) {
                    startedAt = new Date();
                    session.startedAt = startedAt.toISOString();
                }

                return {
                    sessionID: EntityID.fromStringOrThrow(activeSessionID),
                    sessionName: session.name,
                    startedAt,
                };
            });

            // Exit case - the mutation failed
            if(mutation.isFailure) return Result.fail(mutation.error);

            const active = mutation.value.value;

            // Exit case - if there is no active session
            if(!active) return Result.ok(null);

            return Result.ok({
                campaignID,
                sessionID: active.sessionID,
                sessionName: active.sessionName,
                startedAt: active.startedAt,
            });
        } catch (error) {
            return Result.fail(new RepositoryError('Failed to get active session run', error));
        }
    }

    async startSessionRun(
        campaignID: EntityID,
        sessionID: EntityID,
        startedAt: Date,
    ): Promise<Result<StartSessionRunResult, RepositoryError>> {
        try {
            const campaignIDStr = campaignID.toString();
            const sessionIDStr = sessionID.toString();
            const startedAtISO = startedAt.toISOString();

            const mutation = mutateSessionRunState<StartSessionRunResult>(this.storageKey, (state): StartSessionRunResult => {
                const campaign = getOrCreateCampaignRecord(state, campaignIDStr);
                let activeSessionID = campaign.activeSessionID;

                if(activeSessionID) {
                    // Exit case - the active session is the given one
                    if(activeSessionID === sessionIDStr) {
                        const session = getOrCreateSessionRecord(state, sessionIDStr);
                        let actualStartedAt = parseISODate(session.startedAt);

                        if(!actualStartedAt) {
                            actualStartedAt = startedAt;
                            session.startedAt = startedAtISO;
                        }

                        session.endedAt = null;
                        session.durationSeconds = null;

                        const name = this.lookupSessionName(sessionIDStr);
                        if(name) session.name = name;

                        return { kind: 'already_active', startedAt: actualStartedAt };
                    }

                    const activeSession = state.sessions[activeSessionID];
                    const isStale = !activeSession || activeSession.endedAt !== null || activeSession.durationSeconds !== null;

                    if(isStale) {
                        campaign.activeSessionID = null;
                        activeSessionID = null;
                    } else {
                        return {
                            kind: 'conflict',
                            activeSessionID: EntityID.fromStringOrThrow(activeSessionID),
                        };
                    }
                }

                const session = getOrCreateSessionRecord(state, sessionIDStr);

                // Prevent restarting a session that has already ended
                if(session.endedAt !== null || session.durationSeconds !== null) {
                    throw new Error('Failed to start session run (session already ended)');
                }

                campaign.activeSessionID = sessionIDStr;

                const existingStartedAt = parseISODate(session.startedAt);
                session.startedAt = existingStartedAt ? session.startedAt : startedAtISO;
                session.endedAt = null;
                session.durationSeconds = null;

                const name = this.lookupSessionName(sessionIDStr);
                if(name) session.name = name;

                return { kind: 'started', startedAt };
            });

            return mutation.map((m) => m.value);
        } catch (error) {
            return Result.fail(new RepositoryError('Failed to start session run', error));
        }
    }

    async endSessionRun(
        campaignID: EntityID,
        sessionID: EntityID,
        endedAt: Date,
        durationSeconds: number,
    ): Promise<Result<EndSessionRunResult, RepositoryError>> {
        try {
            const campaignIdStr = campaignID.toString();
            const sessionIDStr = sessionID.toString();
            const endedAtISO = endedAt.toISOString();

            const mutation = mutateSessionRunState<EndSessionRunResult>(this.storageKey, (state): EndSessionRunResult => {
                const campaign = getOrCreateCampaignRecord(state, campaignIdStr);
                const activeSessionID = campaign.activeSessionID;
                
                // Exit case - the active session ID is the given ID str
                if (activeSessionID === sessionIDStr) {
                    campaign.activeSessionID = null;
                    const session = getOrCreateSessionRecord(state, sessionIDStr);
                    
                    if (session.endedAt === null) {
                        session.endedAt = endedAtISO;
                    }
                    if (session.durationSeconds === null) {
                        session.durationSeconds = durationSeconds;
                    }

                    return { kind: 'ended', endedAt };
                }

                // Exit case - there is no active session
                if (activeSessionID === null) {
                    const session = state.sessions[sessionIDStr];
                    
                    // Exit case - the session already ended and is not active
                    if (session && (session.endedAt !== null || session.durationSeconds !== null)) {
                        const parsedEndedAt = parseISODate(session.endedAt);
                        return {
                            kind: 'already_ended',
                            endedAt: parsedEndedAt,
                            durationSeconds: session.durationSeconds ?? null,
                        };
                    }

                    return { kind: 'not_active' };
                }

                return {
                    kind: 'conflict',
                    activeSessionID: EntityID.fromStringOrThrow(activeSessionID),
                };
            });
            
            return mutation.map((m) => m.value);
        } catch (error) {
            return Result.fail(new RepositoryError('Failed to end session run', error));
        }
    }
}