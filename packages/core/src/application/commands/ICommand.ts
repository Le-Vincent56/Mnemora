import { Result } from "../../domain/core/Result";

/**
 * Command interface for reversible operations.
 * The Command pattern encapsulates an action as an object, allowing:
 * - Undo/Redo functionality
 * - Action history and audit trails
 * - Macro recording (sequences of commands)
 */

/**
 * Error type for command failures.
 */
export class CommandError extends Error {
    constructor(
        message: string,
        readonly code: string = 'COMMAND_ERROR',
        readonly cause?: unknown
    ) {
        super(message);
        this.name = 'CommandError';
        Object.freeze(this);
    }

    static executionFailed(message: string, cause?: unknown): CommandError {
        return new CommandError(message, 'EXECUTION_FAILED', cause);
    }

    static undoFailed(message: string, cause?: unknown): CommandError {
        return new CommandError(message, 'UNDO_FAILED', cause);
    }

    static notUndoable(): CommandError {
        return new CommandError('This command cannot be undone', 'NOT_UNDOABLE');
    }

    static noStateToRestore(): CommandError {
        return new CommandError(
            'No previous state captured; was execute() called?',
            'NO_STATE'
        );
    }
}

/**
 * Interface for all commands.
 */
export interface ICommand {
    readonly id: string;
    readonly canUndo: boolean;

    /**
     * Execute the command.
     * This should:
     * 1. Capture any state needed for undo (before making changes)
     * 2. Perform the operation
     * 3. Return success or failure
     * @returns A Result indicating success or failure
     */
    execute(): Promise<Result<void, CommandError>>;

    /**
     * Reverse the command (undo).
     * This should restore the state to what it was before execute().
     * Only valid if `canUndo` is true and `execute()` was called
     * @returns A Result indicating success or failure.
     */
    undo(): Promise<Result<void, CommandError>>;

    /**
     * Human-readable description of what this command does.
     * Used for history display and debugging.
     * @example "Create character 'Hugo'"
     * @example "Update location 'Tavern' (name, description)"
     */
    describe(): string;

    /**
     * When this command was executed (set after execute() completes).
     */
    readonly executedAt: Date | null;
}

/**
 * Base class for commands with common functionality.
 */
export abstract class BaseCommand implements ICommand {
    readonly id: string;
    readonly canUndo: boolean;
    private _executedAt: Date | null = null;

    get executedAt(): Date | null {
        return this._executedAt;
    }

    constructor(canUndo: boolean = true) {
        this.id = crypto.randomUUID();
        this.canUndo = canUndo;
    }

    protected markExecuted(): void {
        this._executedAt = new Date();
    }

    abstract execute(): Promise<Result<void, CommandError>>;
    abstract undo(): Promise<Result<void, CommandError>>;
    abstract describe(): string;
}