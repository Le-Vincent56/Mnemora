import { Result } from '../core/Result';
import { RepositoryError } from '../core/errors';
import { EntityID } from '../value-objects/EntityID';

/**
 * Represents session data during an active session
 */
export interface ActiveSessionRun {
    readonly campaignID: EntityID;
    readonly sessionID: EntityID;
    readonly sessionName: string;
    readonly startedAt: Date;
}

/**
 * Represents the resulting data at the beginning of a session
 */
export type StartSessionRunResult =
    | { readonly kind: 'started'; readonly startedAt: Date }
    | { readonly kind: 'already_active'; readonly startedAt: Date }
    | { readonly kind: 'conflict'; readonly activeSessionID: EntityID };

/**
 * Represents the resulting data at the end of a session
 */
export type EndSessionRunResult =
    | { readonly kind: 'ended'; readonly endedAt: Date }
    | { readonly kind: 'already_ended'; readonly endedAt: Date | null; readonly durationSeconds: number | null }
    | { readonly kind: 'not_active' }
    | { readonly kind: 'conflict'; readonly activeSessionID: EntityID };

export interface ISessionRunRepository {
    /**
     * Gets an active session run
     */
    getActiveSessionRun(campaignID: EntityID): Promise<Result<ActiveSessionRun | null, RepositoryError>>;

    /**
     * Starts a session run
     */
    startSessionRun(
        campaignID: EntityID,
        sessionID: EntityID,
        startedAt: Date
    ): Promise<Result<StartSessionRunResult, RepositoryError>>;

    /**
     * Ends a session run
     */
    endSessionRun(
        campaignID: EntityID,
        sessionID: EntityID,
        endedAt: Date,
        durationSeconds: number
    ): Promise<Result<EndSessionRunResult, RepositoryError>>;
}