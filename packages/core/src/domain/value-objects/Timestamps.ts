import { Result } from '../core/Result';
import { ValidationError } from '../core/errors';

/**
 * Timestamps: Value Object for entity creation and modification times.
 * Immutable container for createdAt and modifiedAt dates.
 * Provides a touch() method that returns a new Timestamps with updated modifiedAt.
 */
export class Timestamps {
    private readonly _createdAt: Date;
    private readonly _modifiedAt: Date;

    get createdAt(): Date {
        return new Date(this._createdAt.getTime());
    }

    get modifiedAt(): Date {
        return new Date(this._modifiedAt.getTime());
    }

    get wasModified(): boolean {
        return this._modifiedAt.getTime() > this._createdAt.getTime();
    }

    get ageMs(): number {
        return Date.now() - this._createdAt.getTime();
    }

    get timeSinceModificationMs(): number {
        return Date.now() - this._modifiedAt.getTime();
    }

    private constructor(createdAt: Date, modifiedAt: Date) {
        this._createdAt = createdAt;
        this._modifiedAt = modifiedAt;
        Object.freeze(this);
    }

    /**
     * Creates Timestamps for a newly created entity.
     * Both createdAt and modifiedAt are set to now.
     */
    static now(): Timestamps {
        const now = new Date();
        return new Timestamps(now, now);
    }

    /**
     * Reconstructs Timestamps from existing dates (e.g., from database).
     */
    static fromDates(createdAt: Date, modifiedAt: Date): Result<Timestamps, ValidationError> {
        if(!(createdAt instanceof Date) || isNaN(createdAt.getTime())) {
            return Result.fail(ValidationError.invalid('createdAt', 'must be a valid date'));
        }

        if(!(modifiedAt instanceof Date) || isNaN(modifiedAt.getTime())) {
            return Result.fail(ValidationError.invalid('modifiedAt', 'must be a valid date'));
        }

        if(modifiedAt < createdAt) {
            return Result.fail(ValidationError.invalid('modifiedAt', 'cannot be before createdAt'));
        }

        return Result.ok(new Timestamps(createdAt, modifiedAt));
    }

    /**
     * Reconstructs Timestamps from ISO strings (e.g., from JSON).
     */
    static fromStrings(createdAt: string, modifiedAt: string): Result<Timestamps, ValidationError> {
        const createdDate = new Date(createdAt);
        const modifiedDate = new Date(modifiedAt);

        return Timestamps.fromDates(createdDate, modifiedDate);
    }

    /**
     * Reconstructs Timestamps from ISO strings, throwing if invalid.
     * Use only whne you're certain the values are valid (e.g., from database).
     */
    static fromStringsOrThrow(createdAt: string, modifiedAt: string): Timestamps {
        const result = Timestamps.fromStrings(createdAt, modifiedAt);

        if(result.isFailure) {
            throw result.error;
        }

        return result.value;
    }

    /**
     * Returns a new Timestamps with modifiedAt set to now.
     * Used when an entity is updated.
     */
    touch(): Timestamps {
        return new Timestamps(this._createdAt, new Date());
    }

    /**
     * Checks equality with another Timestamps.
     */
    equals(other: Timestamps): boolean {
        return (
            this._createdAt.getTime() === other._createdAt.getTime()
            && this._modifiedAt.getTime() === other._modifiedAt.getTime()
        )
    }
}