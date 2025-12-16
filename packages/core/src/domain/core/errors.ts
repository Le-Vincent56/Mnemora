/**
 * Base class for all domain errors.
 * Extends Error for stack traces but is designed to be used with Result<T, E>.
 */
export abstract class DomainError extends Error {
    abstract readonly code: string;

    constructor(message: string) {
        super(message);
        this.name = this.constructor.name;

        // Maintains proper stack trace in V8 environments
        if('captureStackTrace' in Error && typeof Error.captureStackTrace === 'function') {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

/**
 * Error thrown when validation of a value object or entity fails.
 */
export class ValidationError extends DomainError {
    readonly code = 'VALIDATION_ERROR';
    readonly field: string | undefined;

    constructor(message:string, field?: string) {
        super(message);
        this.field = field;
    }

    static required(field: string): ValidationError {
        return new ValidationError(`${field} is required`, field);
    }

    static tooLong(field: string, maxLength: number): ValidationError {
        return new ValidationError(`${field} cannot exceed ${maxLength} characters`, field);
    }

    static tooShort(field: string, minLength: number): ValidationError {
        return new ValidationError(`${field} must be at least ${minLength} characters`, field);
    }

    static invalid(field: string, reason?: string): ValidationError {
        const message = reason
            ? `${field} is invalid: ${reason}`
            : `${field} is invalid`;

        return new ValidationError(message, field);
    }
}

/**
 * Error thrown when an entity is not found.
 */
export class NotFoundError extends DomainError {
    readonly code = 'NOT_FOUND';
    readonly entityType: string;
    readonly entityID: string;

    constructor(entityType: string, entityID: string) {
        super(`${entityType} with id '${entityID}' not found`);
        this.entityType = entityType;
        this.entityID = entityID;
    }
}

/**
 * Error thrown when an operation conflcits with existing state.
 */
export class ConflictError extends DomainError {
    readonly code = 'CONFLICT';

    constructor(message: string) {
        super(message);
    }

    static duplicate(entityType: string, field: string, value: string): ConflictError {
        return new ConflictError(`${entityType} with ${field} '${value}' already exists`);
    }
}

/**
 * Error thrown when a domain invariant is violated.
 * These represent programming errors or impossible states.
 */
export class InvariantError extends DomainError {
    readonly code = 'INVARIANT_VIOLATION';

    constructor(message: string) {
        super(`Invariant violation: ${message}`);
    }
}