import { QuickNoteVisibility } from '../../domain/value-objects/QuickNote';

/**
 * DTO for a quick note.
 */
export interface QuickNoteDTO {
    readonly id: string;
    readonly content: string;
    readonly capturedAt: string;         // ISO date string
    readonly linkedEntityIds: readonly string[];
    readonly visibility: QuickNoteVisibility;
}

/**
 * DTO for Stars & Wishes feedback.
 */
export interface StarsAndWishesDTO {
    readonly stars: readonly string[];
    readonly wishes: readonly string[];
    readonly collectedAt: string;        // ISO date string
}

/**
 * Request DTO for adding a quick note.
 */
export interface AddQuickNoteRequest {
    readonly sessionId: string;
    readonly content: string;
    readonly linkedEntityIds?: string[];
    readonly visibility?: QuickNoteVisibility;
}

/**
 * Response DTO for adding a quick note.
 */
export interface AddQuickNoteResponse {
    readonly note: QuickNoteDTO;
}

/**
 * Request DTO for removing a quick note.
 */
export interface RemoveQuickNoteRequest {
    readonly sessionId: string;
    readonly noteId: string;
}

/**
 * Request DTO for ending a session with summary.
 */
export interface EndSessionRequest {
    readonly sessionId: string;
    readonly durationSeconds: number;
    readonly starsAndWishes?: {
        readonly stars: readonly string[];
        readonly wishes: readonly string[];
    };
}

/**
 * Response DTO for session summary.
 */
export interface SessionSummaryDTO {
    readonly sessionId: string;
    readonly sessionName: string;
    readonly durationSeconds: number;
    readonly durationFormatted: string;  // e.g., "2h 34m"
    readonly quickNotes: readonly QuickNoteDTO[];
    readonly starsAndWishes: StarsAndWishesDTO | null;
    readonly referencedEntityCount: number;
}

/**
 * Request DTO for getting quick notes.
 */
export interface GetQuickNotesRequest {
    readonly sessionId: string;
}