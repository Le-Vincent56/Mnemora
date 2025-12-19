import type { ICommand } from '../../application/commands/ICommand';
import type {
    CommandHistory,
    CommandSnapshot,
} from '../../application/commands/CommandHistory';
import type { IViewModel, ViewModelError } from './types';
import { ViewModelError as VMError } from './types';

/**
 * ViewModel for command history.
 */
export class CommandHistoryViewModel implements IViewModel {
    private _canUndo: boolean = false;
    private _canRedo: boolean = false;
    private _nextUndoDescription: string | null = null;
    private _nextRedoDescription: string | null = null;
    private _undoHistory: CommandSnapshot[] = [];
    private _redoHistory: CommandSnapshot[] = [];
    private _isExecuting: boolean = false;
    private _error: ViewModelError | null = null;

    get canUndo(): boolean {
        return this._canUndo;
    }

    get canRedo(): boolean {
        return this._canRedo;
    }

    get nextUndoDescription(): string | null {
        return this._nextUndoDescription;
    }

    get nextRedoDescription(): string | null {
        return this._nextRedoDescription;
    }

    get undoHistory(): readonly CommandSnapshot[] {
        return this._undoHistory;
    }

    get redoHistory(): readonly CommandSnapshot[] {
        return this._redoHistory;
    }

    get undoCount(): number {
        return this._undoHistory.length;
    }

    get redoCount(): number {
        return this._redoHistory.length;
    }

    get isExecuting(): boolean {
        return this._isExecuting;
    }

    get isLoading(): boolean {
        return this._isExecuting;
    }

    get error(): ViewModelError | null {
        return this._error;
    }

    constructor(private readonly _commandHistory: CommandHistory) {
        this.syncState();
    }

    /**
     * Execute a command and add it to history.
     * @returns true if execution succeeded, false otherwise
     */
    async execute(command: ICommand): Promise<boolean> {
        this._isExecuting = true;
        this._error = null;

        const result = await this._commandHistory.execute(command);

        if (result.isSuccess) {
            this.syncState();
            this._isExecuting = false;
            return true;
        } else {
            this._error = VMError.operation(result.error.message);
            this._isExecuting = false;
            return false;
        }
    }

    /**
     * Undo the most recent command.
     * @returns true if undo succeeded, false otherwise
     */
    async undo(): Promise<boolean> {
        if (!this._canUndo) {
            return false;
        }

        this._isExecuting = true;
        this._error = null;

        const result = await this._commandHistory.undo();

        if (result.isSuccess) {
            this.syncState();
            this._isExecuting = false;
            return true;
        } else {
            this._error = VMError.operation(result.error.message);
            this._isExecuting = false;
            return false;
        }
    }

    /**
     * Redo the most recently undone command.
     * @returns true if redo succeeded, false otherwise
     */
    async redo(): Promise<boolean> {
        if (!this._canRedo) {
            return false;
        }

        this._isExecuting = true;
        this._error = null;

        const result = await this._commandHistory.redo();

        if (result.isSuccess) {
            this.syncState();
            this._isExecuting = false;
            return true;
        } else {
            this._error = VMError.operation(result.error.message);
            this._isExecuting = false;
            return false;
        }
    }

    /**
     * Clear error state.
     */
    clearError(): void {
        this._error = null;
    }

    /**
     * Refresh state from the underlying CommandHistory.
     * Useful if commands were executed outside of this ViewModel.
     */
    refresh(): void {
        this.syncState();
    }

    /**
     * Clean up resources.
     */
    dispose(): void {
        // No timers or subscriptions to clean up
    }

    /**
     * Synchronize state from the underlying CommandHistory.
     */
    private syncState(): void {
        this._canUndo = this._commandHistory.canUndo;
        this._canRedo = this._commandHistory.canRedo;
        this._nextUndoDescription = this._commandHistory.nextUndoDescription;
        this._nextRedoDescription = this._commandHistory.nextRedoDescription;
        this._undoHistory = [...this._commandHistory.getUndoHistory()];
        this._redoHistory = [...this._commandHistory.getRedoHistory()];
    }
}