import { Result } from '../../domain/core/Result';
import type { IQuickNoteRepository } from '../../domain/repositories/IQuickNoteRepository';
import { StarsAndWishes } from '../../domain/value-objects/StarsAndWishes';
import { BaseCommand, CommandError } from './ICommand';

/**
 * Command: Set Stars & Wishes feedback for a session.
 *
 * Uses write-through persistence via IQuickNoteRepository.
 * Undo behavior: Restores the previous feedback (or clears if none existed).
 */
export class SetSessionFeedbackCommand extends BaseCommand {
    private previousFeedback: StarsAndWishes | null = null;
    private nextFeedback: StarsAndWishes | null = null;

    constructor(
        private readonly sessionID: string,
        private readonly stars: readonly string[],
        private readonly wishes: readonly string[],
        private readonly collectedAt: Date,
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

            const prevResult = await this.quickNoteRepository.findFeedbackBySessionID(this.sessionID);
            
            // Exit case - could not retrieve the feedback for the session
            if (prevResult.isFailure) {
                return Result.fail(
                    CommandError.executionFailed('Failed to load session feedback', prevResult.error),
                );
            }

            this.previousFeedback = prevResult.value;

            if (this.nextFeedback === null) {
                // Build the next feedback once so redo is deterministic.
                let draft = StarsAndWishes.fromProps({
                    stars: [],
                    wishes: [],
                    collectedAt: this.collectedAt,
                });

                for (const s of this.stars) {
                    const r = draft.addStar(s);

                    // Exit case - could not add add the star
                    if (r.isFailure) {
                        return Result.fail(
                            CommandError.executionFailed(r.error.message, r.error),
                        );
                    }

                    draft = r.value;
                }

                for (const w of this.wishes) {
                    const r = draft.addWish(w);

                    // Exit case - could not add the wish
                    if (r.isFailure) {
                        return Result.fail(
                            CommandError.executionFailed(r.error.message, r.error),
                        );
                    }

                    draft = r.value;
                }

                this.nextFeedback = draft.isEmpty ? null : draft;
            }

            const writeResult = this.nextFeedback
                ? await this.quickNoteRepository.saveFeedback(this.sessionID, this.nextFeedback)
                : await this.quickNoteRepository.deleteFeedbackForSession(this.sessionID);

            // Exit case - could not save the feedback
            if (writeResult.isFailure) {
                return Result.fail(
                    CommandError.executionFailed('Failed to save session feedback', writeResult.error),
                );
            }

            this.markExecuted();
            return Result.okVoid();
        } catch (error) {
            return Result.fail(CommandError.executionFailed('Failed to set session feedback', error));
        }
    }

    async undo(): Promise<Result<void, CommandError>> {
        try {
            const restoreResult = this.previousFeedback
                ? await this.quickNoteRepository.saveFeedback(this.sessionID, this.previousFeedback)
                : await this.quickNoteRepository.deleteFeedbackForSession(this.sessionID);

            // Exit case - could not restore the feedback
            if (restoreResult.isFailure) {
                return Result.fail(
                    CommandError.undoFailed('Failed to restore session feedback during undo', restoreResult.error),
                );
            }

            return Result.okVoid();
        } catch (error) {
            return Result.fail(CommandError.undoFailed('Failed to undo session feedback update', error));
        }
    }

    describe(): string {
        const hasStars = this.stars.length > 0;
        const hasWishes = this.wishes.length > 0;
        if (hasStars && hasWishes) return 'Update session reflection (stars + wishes)';
        if (hasStars) return 'Update session reflection (stars)';
        if (hasWishes) return 'Update session reflection (wishes)';
        return 'Clear session reflection';
    }
}
