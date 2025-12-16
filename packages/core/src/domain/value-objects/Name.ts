import { Result } from '../core/Result';
import { ValidationError } from '../core/errors';

/**
 * Name: Value Object for entity names.
 * Validates that names are non-empty and within length limits.
 * Automatically trims whitespace.
 */
export class Name {
    static readonly MIN_LENGTH = 1;
    static readonly MAX_LENGTH = 200;

    private readonly _value: string;

    /**
     * Returns the underlying string value.
     * Alias for toString() for explicit access.
     */
    get value(): string {
        return this._value;
    }

    /**
     * Returns the length of the name.
     */
    get length(): number {
        return this._value.length;
    }

    private constructor(value: string) {
        this._value = value;
        Object.freeze(this);
    }

    /**
     * Creates a name from a string value.
     * Trims whitespace and validates length constraints.
     */
    static create(value: string): Result<Name, ValidationError> {
        const trimmed = value.trim();

        if(trimmed.length < Name.MIN_LENGTH) {
            return Result.fail(ValidationError.tooShort('Name', Name.MIN_LENGTH));
        }

        if(trimmed.length > Name.MAX_LENGTH) {
            return Result.fail(ValidationError.tooLong('Name', Name.MAX_LENGTH));
        }

        return Result.ok(new Name(trimmed))
    }

    /**
     * Returns the underlying string value.
     */
    toString(): string {
        return this._value;
    }

    /**
     * Checks equality with another Name.
     */
    equals(other: Name): boolean {
        return this._value === other._value;
    }

    /**
     * Checks if this name contains the given substring (case-insensitive).
     * Useful for search functionality.
     */
    contains(substring: string): boolean {
        return this._value.toLowerCase().includes(substring.toLowerCase());
    }
}