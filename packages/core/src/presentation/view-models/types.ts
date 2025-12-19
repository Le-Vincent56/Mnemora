/**
 * Base types for ViewModels in the Presentation Layer.
 * ViewModels are platform-agnostic and sit between Use Cases and UI components.
 * They manage UI state, handle user interactions, and coordinate with the Application Layer.
 */

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

/**
 * Error representation for ViewModel operations.
 * More UI-friendly than domain errors.
 */
export interface ViewModelError {
    readonly message: string;
    readonly field?: string;
    readonly code?: string;
}

/**
 * Generic wrapper for async state.
 * Useful for tracking loading/error/success states with data.
 */
export interface AsyncState<T> {
    readonly data: T | null;
    readonly status: LoadingState;
    readonly error: ViewModelError | null;
}

/**
 * Interface for objects that need cleanup.
 * ViewModels should implement this to clean up timers,
 * subscriptions, etc.
 */
export interface IDisposable {
    dispose(): void;
}

/**
 * Base interface for all ViewModels.
 */
export interface IViewModel extends IDisposable {
    readonly isLoading: boolean;
    readonly error: ViewModelError | null;
}

/**
 * Factory function type for creating ViewModelErrors.
 */
export const ViewModelError = {
    validation(message: string, field: string): ViewModelError {
        return { message, field, code: 'VALIDATION_ERROR' };
    },
    notFound(entityType: string, id: string): ViewModelError {
        return {
            message: `${entityType} with ID '${id}' not found`,
            code: 'NOT_FOUND',
        };
    },
    fromUseCaseError(error: { message: string; field?: string }): ViewModelError {
        return {
            message: error.message,
            code: 'USE_CASE_ERROR',
            ...(error.field !== undefined && { field: error.field })
        };
    },
    operation(message: string): ViewModelError {
        return { message, code: 'OPERATION_ERROR' };
    },
};

/**
 * Helper to create an initial AsyncState.
 */
export function createAsyncState<T>(initialData: T | null = null): AsyncState<T> {
    return {
        data: initialData,
        status: 'idle',
        error: null,
    };
}

/**
 * Helper to create a loading AsyncState.
 */
export function loadingState<T>(currentData: T | null = null):
    AsyncState<T> {
    return {
        data: currentData,
        status: 'loading',
        error: null,
    };
}

/**
 * Helper to create a success AsyncState.
 */
export function successState<T>(data: T): AsyncState<T> {
    return {
        data,
        status: 'success',
        error: null,
    };
}

/**
 * Helper to create an error AsyncState.
 */
export function errorState<T>(error: ViewModelError,
    currentData: T | null = null): AsyncState<T> {
    return {
        data: currentData,
        status: 'error',
        error,
    };
}