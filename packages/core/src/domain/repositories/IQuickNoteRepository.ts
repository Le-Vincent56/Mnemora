import { Result } from '../core/Result';
import { RepositoryError } from '../core/errors';
import { QuickNote } from '../value-objects/QuickNote';
import { StarsAndWishes } from '../value-objects/StarsAndWishes';

/**
 * IQuickNoteRepository: Interface for quick note and session feedback persistence.
 * Handles both QuickNotes and StarsAndWishes for sessions.
 */
export interface IQuickNoteRepository {
    // Quick Notes

    /**
     * Finds all quick notes for a session.
     */
    findBySessionId(sessionId: string): Promise<Result<QuickNote[], RepositoryError>>;

    /**
     * Saves a quick note for a session.
     */
    saveQuickNote(sessionId: string, note: QuickNote): Promise<Result<void, RepositoryError>>;

    /**
     * Deletes a quick note by ID.
     */
    deleteQuickNote(noteId: string): Promise<Result<void, RepositoryError>>;

    /**
     * Deletes all quick notes for a session.
     */
    deleteAllForSession(sessionId: string): Promise<Result<void, RepositoryError>>;

    // Stars & Wishes (Session Feedback)

    /**
     * Finds Stars & Wishes feedback for a session.
     * Returns null if no feedback has been collected.
     */
    findFeedbackBySessionId(sessionId: string): Promise<Result<StarsAndWishes | null, RepositoryError>>;

    /**
     * Saves Stars & Wishes feedback for a session.
     * Replaces any existing feedback.
     */
    saveFeedback(sessionId: string, feedback: StarsAndWishes): Promise<Result<void, RepositoryError>>;

    /**
     * Deletes all feedback for a session.
     */
    deleteFeedbackForSession(sessionId: string): Promise<Result<void, RepositoryError>>;
}