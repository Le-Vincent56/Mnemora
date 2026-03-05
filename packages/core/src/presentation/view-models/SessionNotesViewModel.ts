import { CommandHistory } from '../../application/commands/CommandHistory';
import { AddQuickNoteCommand } from '../../application/commands/AddQuickNoteCommand';
import { RemoveQuickNoteCommand } from '../../application/commands/RemoveQuickNoteCommand';
import { SetSessionFeedbackCommand } from '../../application/commands/SetSessionFeedbackCommand';
import { UpdateQuickNoteCommand } from '../../application/commands/UpdateQuickNoteCommand';
import type { QuickNoteDTO, StarsAndWishesDTO } from '../../application/dtos/SessionNotesDTOs';
import { Result } from '../../domain/core/Result';
import { RepositoryError, ValidationError } from '../../domain/core/errors';
import type { IEntityRepository } from '../../domain/repositories/IEntityRepository';
import type { IQuickNoteRepository } from '../../domain/repositories/IQuickNoteRepository';
import type { QuickNoteVisibility } from '../../domain/value-objects/QuickNote';
import type { StarsAndWishes } from '../../domain/value-objects/StarsAndWishes';
import type { QuickNote } from '../../domain/value-objects/QuickNote';
import type { CommandError } from '../../application/commands/ICommand';
import type { IViewModel, ViewModelError } from './types';
import { ViewModelError as VMError } from './types';

function parseISODate(value: string): Date | null {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * ViewModel for Session quick notes + end-of-session reflection (Stars & Wishes).
 *
 * - Write-through persistence via IQuickNoteRepository
 * - Undo/redo via CommandHistory
 * - Exposes DTO-only state to UI
 */
export class SessionNotesViewModel implements IViewModel {
    private _sessionID: string | null = null;
    private _quickNotes: QuickNoteDTO[] = [];
    private _starsAndWishes: StarsAndWishesDTO | null = null;
    private _isLoading: boolean = false;
    private _error: ViewModelError | null = null;

    private readonly _commandHistory: CommandHistory;
    private readonly _ownsCommandHistory: boolean;

    get isLoading(): boolean {
        return this._isLoading;
    }

    get error(): ViewModelError | null {
        return this._error;
    }

    get sessionID(): string | null {
        return this._sessionID;
    }

    get quickNotes(): readonly QuickNoteDTO[] {
        return this._quickNotes;
    }

    get starsAndWishes(): StarsAndWishesDTO | null {
        return this._starsAndWishes;
    }

    get canUndo(): boolean {
        return this._commandHistory.canUndo;
    }

    get canRedo(): boolean {
        return this._commandHistory.canRedo;
    }

    get undoCount(): number {
        return this._commandHistory.undoCount;
    }

    get redoCount(): number {
        return this._commandHistory.redoCount;
    }

    get nextUndoDescription(): string | null {
        return this._commandHistory.nextUndoDescription;
    }

    get nextRedoDescription(): string | null {
        return this._commandHistory.nextRedoDescription;
    }

    constructor(
        private readonly _entityRepository: IEntityRepository,
        private readonly _quickNoteRepository: IQuickNoteRepository,
        commandHistory: CommandHistory | null = null,
    ) {
        this._ownsCommandHistory = commandHistory === null;
        this._commandHistory = commandHistory ?? new CommandHistory();
    }

    async load(sessionID: string): Promise<void> {
        if (this._sessionID !== sessionID && this._ownsCommandHistory) {
            this._commandHistory.clear();
        }

        this._sessionID = sessionID;
        await this.refresh();
    }

    async refresh(): Promise<void> {
        if (!this._sessionID) {
            this._quickNotes = [];
            this._starsAndWishes = null;
            return;
        }

        this._isLoading = true;
        this._error = null;

        const notesResult = await this._quickNoteRepository.findBySessionID(this._sessionID);
        
        // Exit case - could not get the session's quick notes
        if (notesResult.isFailure) {
            this._error = VMError.operation(notesResult.error.message);
            this._isLoading = false;
            return;
        }

        // Exit case - could not get the session's feedback notes
        const feedbackResult = await this._quickNoteRepository.findFeedbackBySessionID(this._sessionID);
        if (feedbackResult.isFailure) {
            this._error = VMError.operation(feedbackResult.error.message);
            this._isLoading = false;
            return;
        }

        this._quickNotes = notesResult.value.map((n) => this.toQuickNoteDTO(n));
        this._starsAndWishes = feedbackResult.value ? this.toStarsAndWishesDTO(feedbackResult.value) : null;
        this._isLoading = false;
    }

    async addQuickNote(
        content: string,
        linkedEntityIDs?: string[],
        visibility?: QuickNoteVisibility,
    ): Promise<Result<void, ViewModelError>> {
        if (!this._sessionID) {
            const e = VMError.operation('No active session');
            this._error = e;
            return Result.fail(e);
        }

        this._isLoading = true;
        this._error = null;

        const command = new AddQuickNoteCommand(
            this._sessionID,
            content,
            linkedEntityIDs,
            visibility,
            this._entityRepository,
            this._quickNoteRepository,
        );

        const result = await this._commandHistory.execute(command);
        
        // Exit case - failed to add the quick note
        if (result.isFailure) {
            const mapped = this.mapCommandError(result.error);
            this._error = mapped;
            this._isLoading = false;
            return Result.fail(mapped);
        }

        await this.refresh();

        this._isLoading = false;
        return Result.okVoid();
    }

    async updateQuickNote(noteID: string, content: string): Promise<Result<void, ViewModelError>> {
        // Exit case - no session ID
        if (!this._sessionID) {
            const e = VMError.operation('No active session');
            this._error = e;
            return Result.fail(e);
        }

        this._isLoading = true;
        this._error = null;

        const command = new UpdateQuickNoteCommand(
            this._sessionID,
            noteID,
            content,
            this._quickNoteRepository,
        );

        const result = await this._commandHistory.execute(command);
        
        // Exit case - failed to update the quick note
        if (result.isFailure) {
            const mapped = this.mapCommandError(result.error);
            this._error = mapped;
            this._isLoading = false;
            return Result.fail(mapped);
        }

        await this.refresh();

        this._isLoading = false;
        return Result.okVoid();
    }

    async removeQuickNote(noteID: string): Promise<Result<void, ViewModelError>> {
        // Exit case - no session ID
        if (!this._sessionID) {
            const e = VMError.operation('No active session');
            this._error = e;
            return Result.fail(e);
        }

        this._isLoading = true;
        this._error = null;

        const command = new RemoveQuickNoteCommand(
            this._sessionID,
            noteID,
            this._quickNoteRepository,
        );

        const result = await this._commandHistory.execute(command);
        
        // Exit case - failed to remove the quick note
        if (result.isFailure) {
            const mapped = this.mapCommandError(result.error);
            this._error = mapped;
            this._isLoading = false;
            return Result.fail(mapped);
        }

        await this.refresh();

        this._isLoading = false;
        return Result.okVoid();
    }

    async setSessionFeedback(
        stars: readonly string[],
        wishes: readonly string[],
    ): Promise<Result<void, ViewModelError>> {
        // Exit case - no session ID
        if (!this._sessionID) {
            const e = VMError.operation('No active session');
            this._error = e;
            return Result.fail(e);
        }

        const collectedAt = this._starsAndWishes?.collectedAt
            ? (parseISODate(this._starsAndWishes.collectedAt) ?? new Date())
            : new Date();

        this._isLoading = true;
        this._error = null;

        const command = new SetSessionFeedbackCommand(
            this._sessionID,
            stars,
            wishes,
            collectedAt,
            this._quickNoteRepository,
        );

        const result = await this._commandHistory.execute(command);
        
        // Exit case - failed to set the session feedback
        if (result.isFailure) {
            const mapped = this.mapCommandError(result.error);
            this._error = mapped;
            this._isLoading = false;
            return Result.fail(mapped);
        }

        await this.refresh();

        this._isLoading = false;
        return Result.okVoid();
    }

    async undo(): Promise<Result<void, ViewModelError>> {
        this._isLoading = true;
        this._error = null;

        const result = await this._commandHistory.undo();
        
        // Exit case - failed to undo
        if (result.isFailure) {
            const mapped = this.mapCommandError(result.error);
            this._error = mapped;
            this._isLoading = false;
            return Result.fail(mapped);
        }

        await this.refresh();

        this._isLoading = false;
        return Result.okVoid();
    }

    async redo(): Promise<Result<void, ViewModelError>> {
        this._isLoading = true;
        this._error = null;

        const result = await this._commandHistory.redo();
        
        // Exit case - failed to redo
        if (result.isFailure) {
            const mapped = this.mapCommandError(result.error);
            this._error = mapped;
            this._isLoading = false;
            return Result.fail(mapped);
        }

        await this.refresh();

        this._isLoading = false;
        return Result.okVoid();
    }

    clearError(): void {
        this._error = null;
    }

    reset(): void {
        if (this._ownsCommandHistory) {
            this._commandHistory.clear();
        }
        
        this._sessionID = null;
        this._quickNotes = [];
        this._starsAndWishes = null;
        this._error = null;
        this._isLoading = false;
    }

    dispose(): void {
        // No timers/subscriptions
    }

    private toQuickNoteDTO(note: QuickNote): QuickNoteDTO {
        return {
            id: note.id,
            content: note.content,
            capturedAt: note.capturedAt.toISOString(),
            linkedEntityIds: [...note.linkedEntityIDs],
            visibility: note.visibility,
        };
    }

    private toStarsAndWishesDTO(feedback: StarsAndWishes): StarsAndWishesDTO {
        return {
            stars: [...feedback.stars],
            wishes: [...feedback.wishes],
            collectedAt: feedback.collectedAt.toISOString(),
        };
    }

    private mapCommandError(error: CommandError): ViewModelError {
        const cause = error.cause;

        if (cause instanceof ValidationError) {
            return VMError.validation(cause.message, cause.field ?? 'unknown');
        }

        if (cause instanceof RepositoryError) {
            return VMError.operation(cause.message);
        }

        return VMError.operation(error.message);
    }
}
