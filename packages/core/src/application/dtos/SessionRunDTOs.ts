/**
 * DTO for an active Session
 */
export interface ActiveSessionRunDTO {
    readonly campaignId: string;
    readonly sessionID: string;
    readonly sessionName: string;
    readonly startedAt: string; // ISO date string
}

/**
 * DTO for a request to start a Session
 */
export interface StartSessionRunRequest {
    readonly sessionID: string;
}

/**
 * DTO for a request to retrieve an active Session
 */
export interface GetActiveSessionRunRequest {
    readonly campaignID: string;
}

/**
 * DTO for a requestion to end an active session
 */
export interface EndSessionRunRequest {
    readonly sessionId: string;
    readonly durationSeconds: number;
}