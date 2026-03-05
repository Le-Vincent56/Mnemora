import { Result } from '../../domain/core/Result';
import type { IQuickNoteRepository } from '../../domain/repositories/IQuickNoteRepository';
import type { QuickNote } from '../../domain/value-objects/QuickNote';
import { BaseCommand, CommandError } from './ICommand';

/**
 * Command: Update a quick note's content.
 * Undo behavior: Restores the previous note content.
 */
export class UpdateQuickNoteCommand extends BaseCommand {
    private previousNote: QuickNote | null = null;
    private updatedNote: QuickNote | null = null;

    constructor(
        private readonly sessionID: string,
        private readonly noteID: string,
        private readonly nextContent: string,
        private readonly quickNoteRepository: IQuickNoteRepository,
    ) {
        super(true);
    }

    async execute(): Promise<Result<void, CommandError>> {
        try {
            // Exit case - no session ID given
            if (!this.sessionID.trim()) {
                return Result.fail(CommandError.executionFailed('Session ID is required'));
            }

            // Exit case - no note ID given
            if (!this.noteID.trim()) {
                return Result.fail(CommandError.executionFailed('Note ID is required'));
            }

            const notesResult = await this.quickNoteRepository.findBySessionID(this.sessionID);
            
            // Exit case - the notes-by-session could not be found
            if (notesResult.isFailure) {
                return Result.fail(
                    CommandError.executionFailed('Failed to load quick notes', notesResult.error),
                );
            }

            const current = notesResult.value.find((n) => n.id === this.noteID);
            
            // Exit case - the current note could not be found
            if (!current) {
                return Result.fail(
                    CommandError.executionFailed(`Quick note not found: ${this.noteID}`),
                );
            }

            this.previousNote = current;
            const updatedResult = current.withContent(this.nextContent);
            
            // Exit case - the note failed to update
            if (updatedResult.isFailure) {
                return Result.fail(
                    CommandError.executionFailed(updatedResult.error.message, updatedResult.error),
                );
            }

            this.updatedNote = updatedResult.value;

            const saveResult = await this.quickNoteRepository.saveQuickNote(this.sessionID, this.updatedNote);
            
            // Exit case - the note failed to save
            if (saveResult.isFailure) {
                return Result.fail(
                    CommandError.executionFailed('Failed to save quick note', saveResult.error),
                );
            }

            this.markExecuted();
            return Result.okVoid();
        } catch (error) {
            return Result.fail(CommandError.executionFailed('Failed to update quick note', error));
        }
    }

    async undo(): Promise<Result<void, CommandError>> {
        // Exit case - there is no previous note to undo
        if (!this.previousNote) {
            return Result.fail(CommandError.noStateToRestore());
        }

        try {
            const saveResult = await this.quickNoteRepository.saveQuickNote(this.sessionID, this.previousNote);
            
            // Exit case - the note failed to save
            if (saveResult.isFailure) {
                return Result.fail(
                    CommandError.undoFailed('Failed to restore quick note during undo', saveResult.error),
                );
            }

            return Result.okVoid();
        } catch (error) {
            return Result.fail(CommandError.undoFailed('Failed to undo quick note update', error));
        }
    }

    describe(): string {
        const trimmed = this.nextContent.trim();
        const preview = trimmed.length > 32 ? `${trimmed.slice(0, 29)}...` : trimmed;
        return preview ? `Edit note '${preview}'` : 'Edit note';
    }
}
