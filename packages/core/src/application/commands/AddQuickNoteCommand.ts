import { Result } from '../../domain/core/Result';
import { EntityType } from '../../domain/entities/EntityType';
import type { IEntityRepository } from '../../domain/repositories/IEntityRepository';
import type { IQuickNoteRepository } from '../../domain/repositories/IQuickNoteRepository';
import { QuickNote, type QuickNoteVisibility } from '../../domain/value-objects/QuickNote';
import { EntityID } from '../../domain/value-objects/EntityID';
import { BaseCommand, CommandError } from './ICommand';

/**
 * Command: Add a quick note to a Session.
 * Undo behavior: Deletes the created note.
 */
export class AddQuickNoteCommand extends BaseCommand {
    private note: QuickNote | null = null;

    constructor(
        private readonly sessionID: string,
        private readonly content: string,
        private readonly linkedEntityIDs: string[] | undefined,
        private readonly visibility: QuickNoteVisibility | undefined,
        private readonly entityRepository: IEntityRepository,
        private readonly quickNoteRepository: IQuickNoteRepository,
    ) {
        super(true);
    }

    getNoteID(): string | null {
        return this.note?.id ?? null;
    }

    async execute(): Promise<Result<void, CommandError>> {
        try {
            // Exit case - there is no session ID
            if (!this.sessionID.trim()) {
                return Result.fail(CommandError.executionFailed('Session ID is required'));
            }

            // Create and cache the note so redo keeps the same id/capturedAt.
            if (!this.note) {
                const noteResult = QuickNote.create(
                    this.content,
                    this.linkedEntityIDs,
                    this.visibility,
                );

                // Exit case - the note failed to create
                if (noteResult.isFailure) {
                    return Result.fail(
                        CommandError.executionFailed(noteResult.error.message, noteResult.error),
                    );
                }

                this.note = noteResult.value;
            }

            // Validate that the Session exists (and is a session entity)
            const sessionIDResult = EntityID.fromString(this.sessionID);
            
            // Exit case - the session ID could not be parsed
            if (sessionIDResult.isFailure) {
                return Result.fail(
                    CommandError.executionFailed(sessionIDResult.error.message, sessionIDResult.error),
                );
            }

            const sessionResult = await this.entityRepository.findByID(sessionIDResult.value);
            
            // Exit case - the session could not be retrieved
            if (sessionResult.isFailure) {
                return Result.fail(
                    CommandError.executionFailed('Failed to find session', sessionResult.error),
                );
            }

            const session = sessionResult.value;

            // Exit case - there is no session, or there was a type mismatch
            if (!session || session.type !== EntityType.SESSION) {
                return Result.fail(
                    CommandError.executionFailed(`Session not found: ${this.sessionID}`),
                );
            }

            // Persist note (write-through)
            const saveResult = await this.quickNoteRepository.saveQuickNote(this.sessionID, this.note);
            
            // Exit case - the note failed to save
            if (saveResult.isFailure) {
                return Result.fail(
                    CommandError.executionFailed('Failed to save quick note', saveResult.error),
                );
            }

            this.markExecuted();
            return Result.okVoid();
        } catch (error) {
            return Result.fail(CommandError.executionFailed('Failed to add quick note', error));
        }
    }

    async undo(): Promise<Result<void, CommandError>> {
        // Exit case - there is no note to undo
        if (!this.note) {
            return Result.fail(CommandError.noStateToRestore());
        }

        try {
            const deleteResult = await this.quickNoteRepository.deleteQuickNote(this.note.id);
            
            // Exit case - deleting the note failed
            if (deleteResult.isFailure) {
                return Result.fail(
                    CommandError.undoFailed('Failed to delete quick note during undo', deleteResult.error),
                );
            }

            return Result.okVoid();
        } catch (error) {
            return Result.fail(CommandError.undoFailed('Failed to undo quick note creation', error));
        }
    }

    describe(): string {
        const trimmed = this.content.trim();
        const preview = trimmed.length > 32 ? `${trimmed.slice(0, 29)}...` : trimmed;
        return preview ? `Add note '${preview}'` : 'Add note';
    }
}
