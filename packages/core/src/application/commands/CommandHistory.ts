import { Result } from "../../domain/core/Result";
import { ICommand, CommandError } from "./ICommand";

/**
 * Command History: manages undo/redo stacks.
 * This is the "Invoker" in Command pattern terminology.
 * It executes commands and maintains history for undo/redo.
 */

/**
 * Snapshot of a command for history display.
 */
export interface CommandSnapshot {
    readonly id: string;
    readonly description: string;
    readonly executedAt: Date;
    readonly canUndo: boolean;
}

/**
 * Options for CommandHistory.
 */
export interface CommandHistoryOptions {
    maxHistorySize?: number;
}

/**
 * Manages command execution and undo/redo history.
 */
export class CommandHistory {
    private undoStack: ICommand[] = [];
    private redoStack: ICommand[] = [];
    private readonly maxHistorySize: number;

    /**
         * Whether there are commands that can be undone.
         */
    get canUndo(): boolean {
        return this.undoStack.length > 0;
    }

    /**
     * Whether there are commands that can be redone.
     */
    get canRedo(): boolean {
        return this.redoStack.length > 0;
    }

    /**
     * Number of commands in the undo stack.
     */
    get undoCount(): number {
        return this.undoStack.length;
    }

    /**
     * Number of commands in the redo stack.
     */
    get redoCount(): number {
        return this.redoStack.length;
    }

    /**
     * Get description of the next command to undo.
     */
    get nextUndoDescription(): string | null {
        const command = this.undoStack[this.undoStack.length - 1];
        return command?.describe() ?? null;
    }

    /**
     * Get description of the next command to redo.
     */
    get nextRedoDescription(): string | null {
        const command = this.redoStack[this.redoStack.length - 1];
        return command?.describe() ?? null;
    }

    /**
     * Get snapshots of the undo history (most recent first).
     */
    getUndoHistory(): readonly CommandSnapshot[] {
        return [...this.undoStack]
            .reverse()
            .map((cmd) => this.toSnapshot(cmd));
    }

    /**
     * Get snapshots of the redo history (next to redo first).
     */
    getRedoHistory(): readonly CommandSnapshot[] {
        return [...this.redoStack]
            .reverse()
            .map((cmd) => this.toSnapshot(cmd));
    }

    constructor(options: CommandHistoryOptions = {}) {
        this.maxHistorySize = options.maxHistorySize ?? 50;
    }

    /**
     * Execute a command and add it to history.
     * @param command - The command to execute
     * @returns Result from command execution
     */
    async execute(command: ICommand): Promise<Result<void, CommandError>> {
        const result = await command.execute();
        if (result.isFailure) {
            return result;
        }

        // Clear redo stack on new action
        this.redoStack = [];

        if (command.canUndo) {
            this.undoStack.push(command);
            this.trimHistory();
        } else {
            // Non-undoable commands break the undo chain
            // User can't undo past a non-undoable action
            this.undoStack = [];
        }

        return result;
    }

    /**
     * Undo the most recent command.
     * @returns A Result indicating success or failure
     */
    async undo(): Promise<Result<void, CommandError>> {
        const command = this.undoStack.pop();

        if (!command) {
            return Result.fail(new CommandError('Nothing to undo', 'NOTHING_TO_UNDO'));
        }

        if (!command.canUndo) {
            // This shouldn't happen if we're managing stacks correctly,
            // but handle it gracefully
            return Result.fail(CommandError.notUndoable());
        }

        const result = await command.undo();

        if (result.isSuccess) {
            this.redoStack.push(command);
        } else {
            // Undo failed - put command back on the undo stack
            this.undoStack.push(command);
        }

        return result;
    }

    /**
     * Redo the most recently undone command.
     * @returns Result indicating success or failure
     */
    async redo(): Promise<Result<void, CommandError>> {
        const command = this.redoStack.pop();

        if (!command) {
            return Result.fail(new CommandError('Nothing to redo', 'NOTHING_TO_REDO'));
        }

        const result = await command.execute();

        if (result.isSuccess) {
            this.undoStack.push(command);
        } else {
            // Redo failed - put command back on the redo stack
            this.redoStack.push(command);
        }

        return result;
    }

    /**
     * Trim the history down to the max history size.
     */
    private trimHistory(): void {
        while(this.undoStack.length > this.maxHistorySize) {
            this.undoStack.shift();
        }
    }

    /**
     * Convert a Command to a Command Snapshot
     * @param command - The command to convert to a Command Snapshot.
     * @returns A Command Snapshot with the command's data stored.
     */
    private toSnapshot(command: ICommand): CommandSnapshot {
        return {
            id: command.id,
            description: command.describe(),
            executedAt: command.executedAt ?? new Date(),
            canUndo: command.canUndo
        }
    }
}