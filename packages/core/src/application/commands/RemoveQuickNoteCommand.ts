import { Result } from '../../domain/core/Result';
import type { IQuickNoteRepository } from '../../domain/repositories/IQuickNoteRepository';
import type { QuickNote } from '../../domain/value-objects/QuickNote';
import { BaseCommand, CommandError } from './ICommand';

/**
 * Command: Remove a quick note from a Session.
 * Undo behavior: Restores the removed note (if it existed).
 */
export class RemoveQuickNoteCommand extends BaseCommand {
    private deletedNote: QuickNote | null = null;

    constructor(
        private readonly sessionID: string,
        private readonly noteID: string,
        private readonly quickNoteRepository: IQuickNoteRepository,
    ) {
        super(true);
    }

    async execute(): Promise<Result<void, CommandError>> {
        try {
            // Exit case - there is no session ID
            if (!this.sessionID.trim()) {
                return Result.fail(CommandError.executionFailed('Session ID is required'));
            }

            // Exit case - there is no note ID
            if (!this.noteID.trim()) {
                return Result.fail(CommandError.executionFailed('Note ID is required'));
            }

            const notesResult = await this.quickNoteRepository.findBySessionID(this.sessionID);
            
            // Exit case - could not get the notes by session
            if (notesResult.isFailure) {
                return Result.fail(
                    CommandError.executionFailed('Failed to load quick notes', notesResult.error),
                );
            }

            this.deletedNote = notesResult.value.find((n) => n.id === this.noteID) ?? null;

            const deleteResult = await this.quickNoteRepository.deleteQuickNote(this.noteID);
            
            // Exit case - failed to delete the note
            if (deleteResult.isFailure) {
                return Result.fail(
                    CommandError.executionFailed('Failed to delete quick note', deleteResult.error),
                );
            }

            this.markExecuted();
            return Result.okVoid();
        } catch (error) {
            return Result.fail(CommandError.executionFailed('Failed to remove quick note', error));
        }
    }

    async undo(): Promise<Result<void, CommandError>> {
        try {
            // Exit case - there is no note to delete
            if (!this.deletedNote) {
                // Deleting a missing note is effectively a no-op.
                return Result.okVoid();
            }

            const saveResult = await this.quickNoteRepository.saveQuickNote(this.sessionID, this.deletedNote);
            
            // Exit case - failed to save the results
            if (saveResult.isFailure) {
                return Result.fail(
                    CommandError.undoFailed('Failed to restore quick note during undo', saveResult.error),
                );
            }

            return Result.okVoid();
        } catch (error) {
            return Result.fail(CommandError.undoFailed('Failed to undo quick note removal', error));
        }
    }

    describe(): string {
        const preview = this.deletedNote?.content
            ? (this.deletedNote.content.length > 32
                ? `${this.deletedNote.content.slice(0, 29)}...`
                : this.deletedNote.content)
            : this.noteID;
        return `Delete note '${preview}'`;
    }
}
