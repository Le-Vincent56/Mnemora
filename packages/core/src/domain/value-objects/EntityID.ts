import { Result } from '../core/Result';
import { ValidationError } from '../core/errors';

/**
 * EntityID: Value Object for entity identifiers.
 * Wraps a string ID with validation and equality semantics.
 * Uses crypto.randomUUID() for generation.
 */
export class EntityID {
    private readonly _value: string;

    /**
     * Returns the underlying string value. Alias
     * for toString() for explicit access.
     */
    get value(): string {
        return this._value;
    }

    private constructor(value: string) {
        this._value = value;
        Object.freeze(this);
    }

    /**
     * Generates a new unique EntityID using crypto.randomUUID().
     */
    static generate(): EntityID {
        return new EntityID(crypto.randomUUID());
    }

    /**
     * Creates an EntityID from an existing string value.
     * Validates that the string is non-empty.
     */
    static fromString(value: string): Result<EntityID, ValidationError> {
        const trimmed = value.trim();

        if(trimmed.length === 0) {
            return Result.fail(ValidationError.required('EntityID'));
        }

        return Result.ok(new EntityID(trimmed));
    }

    /**
     * Creates an EntityID from a string, throwing if invalid.
     * Use only when you're certain the value is valid (e.g., from database).
     */
    static fromStringOrThrow(value: string): EntityID {
        const result = EntityID.fromString(value);
        if(result.isFailure) {
            throw result.error;
        }
        return result.value;
    }

    /**
     * Returns the underlying string value.
     */
    toString(): string {
        return this._value;
    }

    /**
     * Checks equality with another Entity ID
     */
    equals(other: EntityID): boolean {
        return this._value === other.value;
    }
}