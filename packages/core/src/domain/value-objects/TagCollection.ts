import { Result } from "../core/Result";
import { ValidationError } from "../core/errors";

/**
 * TagCollection: Value Object for a set of tags.
 * Immutable collection of unique, normalized tag strings.
 * Tags are lowercased and trimmed for consistency/sanitization.
 */
export class TagCollection {
    static readonly MAX_TAG_LENGTH = 50;
    static readonly MAX_TAGS = 20;

    private readonly _tags: ReadonlyArray<string>;

    /**
     * Returns the tags as an array.
     */
    get count(): number {
        return this._tags.length;
    }

    /**
     * Returns true if the collection is empty.
     */
    get isEmpty(): boolean {
        return this._tags.length === 0;
    }

    private constructor(tags: string[]) {
        this._tags = Object.freeze([...tags]);
        Object.freeze(this);
    }

    /**
     * Creates an empty TagCollection.
     */
    static empty(): TagCollection {
        return new TagCollection([]);
    }

    /**
     * Creates a TagCollection from an array of tag strings.
     * Normalizes, deduplicates, and validates tags.
     */
    static fromArray(tags: string[]): Result<TagCollection, ValidationError> {
        const normalized = new Set<string>();

        for(const tag of tags) {
            const trimmed = tag.trim().toLowerCase();

            if(trimmed.length === 0) {
                continue;
            }

            if(trimmed.length > TagCollection.MAX_TAG_LENGTH) {
                return Result.fail(ValidationError.tooLong('Tag', TagCollection.MAX_TAG_LENGTH));
            }

            normalized.add(trimmed);
        }

        if(normalized.size > TagCollection.MAX_TAGS) {
            return Result.fail(ValidationError.invalid('Tags', `cannot have more than ${TagCollection.MAX_TAGS} tags`));
        }

        return Result.ok(new TagCollection([...normalized].sort()));
    }

    /**
     * Returns the tags as an array.
     */
    toArray(): string[] {
        return [...this._tags];
    }

    /**
     * Checks if the collection contains a specific tag.
     */
    has(tag: string): boolean {
        return this._tags.includes(tag.trim().toLowerCase())
    }

    /**
     * Returns a new TagCollection with an additional tag.
     */
    add(tag: string): Result<TagCollection, ValidationError> {
        const newTags = [...this._tags, tag];
        return TagCollection.fromArray(newTags);
    }

    /**
     * Returns a new TagCollection without the specified tag.
     */
    remove(tag: string): TagCollection {
        const normalized = tag.trim().toLowerCase();
        const filtered = this._tags.filter(t => t !== normalized);
        return new TagCollection(filtered);
    }

    /**
     * Returns a new TagCollection with all tags from both collections.
     */
    merge(other: TagCollection): Result<TagCollection, ValidationError> {
        const combined = [...this._tags, ...other._tags];
        return TagCollection.fromArray(combined);
    }

    /**
     * Creates a shallow clone of this collection.
     */
    clone(): TagCollection {
        return new TagCollection([...this._tags]);
    }

    /**
     * Checks equality with another TagCollection.
     */
    equals(other: TagCollection): boolean {
        if(this._tags.length !== other._tags.length) {
            return false;
        }
        return this._tags.every((tag, i) => tag === other._tags[i]);
    }
}