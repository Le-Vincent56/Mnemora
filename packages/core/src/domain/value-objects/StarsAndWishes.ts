import { Result } from '../core/Result';
import { ValidationError } from '../core/errors';

/**
 * Maximum length for individual star/wish entries.
 */
const MAX_ENTRY_LENGTH = 200;

/**
 * Props for reconstructing StarsAndWishes from persistence.
 */
export interface StarsAndWishesProps {
    readonly stars: readonly string[];
    readonly wishes: readonly string[];
    readonly collectedAt: Date;
}

/**
 * StarsAndWishes: Value Object representing session-end feedback.
 * Immutable — all modification methods return new instances.
 */
export class StarsAndWishes {
    private readonly props: StarsAndWishesProps;

    private constructor(props: StarsAndWishesProps) {
        this.props = props;
        Object.freeze(this);
    }

    /**
     * Creates an empty StarsAndWishes with current timestamp.
     */
    static empty(): StarsAndWishes {
        return new StarsAndWishes({
            stars: [],
            wishes: [],
            collectedAt: new Date()
        });
    }

    /**
     * Reconstructs StarsAndWishes from persistence data.
     */
    static fromProps(props: StarsAndWishesProps): StarsAndWishes {
        return new StarsAndWishes(props);
    }

    // Getters
    get stars(): readonly string[] { return this.props.stars; }
    get wishes(): readonly string[] { return this.props.wishes; }
    get collectedAt(): Date { return this.props.collectedAt; }

    /**
     * Returns true if no stars or wishes have been added.
     */
    get isEmpty(): boolean {
        return this.props.stars.length === 0 && this.props.wishes.length === 0;
    }

    /**
     * Returns a new StarsAndWishes with the star added.
     */
    addStar(star: string): Result<StarsAndWishes, ValidationError> {
        const trimmed = star.trim();

        if (trimmed.length === 0) {
            return Result.fail(
                new ValidationError('Star cannot be empty', 'star')
            );
        }

        if (trimmed.length > MAX_ENTRY_LENGTH) {
            return Result.fail(
                ValidationError.tooLong('Star', MAX_ENTRY_LENGTH)
            );
        }

        return Result.ok(new StarsAndWishes({
            ...this.props,
            stars: [...this.props.stars, trimmed]
        }));
    }

    /**
     * Returns a new StarsAndWishes with the wish added.
     */
    addWish(wish: string): Result<StarsAndWishes, ValidationError> {
        const trimmed = wish.trim();

        if (trimmed.length === 0) {
            return Result.fail(
                new ValidationError('Wish cannot be empty', 'wish')
            );
        }

        if (trimmed.length > MAX_ENTRY_LENGTH) {
            return Result.fail(
                ValidationError.tooLong('Wish', MAX_ENTRY_LENGTH)
            );
        }

        return Result.ok(new StarsAndWishes({
            ...this.props,
            wishes: [...this.props.wishes, trimmed]
        }));
    }

    /**
     * Returns a new StarsAndWishes with the star at the given index removed.
     */
    removeStar(index: number): StarsAndWishes {
        return new StarsAndWishes({
            ...this.props,
            stars: this.props.stars.filter((_, i) => i !== index)
        });
    }

    /**
     * Returns a new StarsAndWishes with the wish at the given index removed.
     */
    removeWish(index: number): StarsAndWishes {
        return new StarsAndWishes({
            ...this.props,
            wishes: this.props.wishes.filter((_, i) => i !== index)
        });
    }
}