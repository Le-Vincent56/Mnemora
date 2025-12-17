
/**
 * Error type for use case failures.
 */
export class UseCaseError extends Error {
    constructor(
        message: string,
        readonly code: string = 'USE_CASE_ERROR',
        readonly cause?: unknown
    ) {
        super(message);
        this.name = 'UseCaseError';
        Object.freeze(this);
    }

    static validation(message: string, field?: string): UseCaseError {
        const code = field 
            ? `VALIDATION_${field.toUpperCase()}`
            : 'VALIDATION_ERROR';

        return new UseCaseError(message, code);
    }

    static notFound(entityType: string, id: string): UseCaseError {
        return new UseCaseError(
            `${entityType} with ID '${id}' not found`,
            'NOT_FOUND'
        );
    }

    static conflict(message: string): UseCaseError {
        return new UseCaseError(message, 'CONFLICT');
    }

    static repositoryError(message: string, cause?: unknown): UseCaseError {
        return new UseCaseError(message, 'REPOSITORY_ERROR', cause);
    }

    static unauthorized(message: string = 'Unauthorized'): UseCaseError {

        return new UseCaseError(message, 'UNAUTHORIZED');
    }

    static invalidOperation(message: string): UseCaseError {
        return new UseCaseError(message, 'INVALID_OPERATION');
    }
}