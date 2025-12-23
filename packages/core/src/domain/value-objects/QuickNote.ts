import { Result } from '../core/Result';
import { ValidationError } from '../core/errors';

/**
 * Maximum length for quick note content.
 */
const MAX_CONTENT_LENGTH = 500;

/**
 * Visibility levels for quick notes.
 */
export type QuickNoteVisibility = 'gm_only' | 'players';

/**
 * Props for reconstructing a QuickNote from persistence.
 */
export interface QuickNoteProps {
    readonly id: string;
    readonly content: string;
    readonly capturedAt: Date;
    readonly linkedEntityIds: readonly string[];
    readonly visibility: QuickNoteVisibility;
}

/**
 * QuickNote: Value Object representing a friction-free note captured during play.
 * Immutable — notes cannot be edited, only added or removed.
 */
export class QuickNote {
    private readonly props: QuickNoteProps;

    private constructor(props: QuickNoteProps) {
        this.props = props;
        Object.freeze(this);
    }

    /**
     * Creates a new QuickNote with validation.
     * Generates a unique ID and sets capturedAt to now.
     */
    static create(
        content: string,
        linkedEntityIds?: string[],
        visibility: QuickNoteVisibility = 'gm_only'
    ): Result<QuickNote, ValidationError> {
        const trimmed = content.trim();

        if (trimmed.length === 0) {
            return Result.fail(
                new ValidationError('Note cannot be empty', 'content')
            );
        }

        if (trimmed.length > MAX_CONTENT_LENGTH) {
            return Result.fail(
                ValidationError.tooLong('Note', MAX_CONTENT_LENGTH)
            );
        }

        return Result.ok(new QuickNote({
            id: crypto.randomUUID(),
            content: trimmed,
            capturedAt: new Date(),
            linkedEntityIds: linkedEntityIds ?? [],
            visibility
        }));
    }

    /**
     * Reconstructs a QuickNote from persistence data.
     * Use when hydrating from database — assumes data is already valid.
     */
    static fromProps(props: QuickNoteProps): QuickNote {
        return new QuickNote(props);
    }

    // Getters
    get id(): string { return this.props.id; }
    get content(): string { return this.props.content; }
    get capturedAt(): Date { return this.props.capturedAt; }
    get linkedEntityIds(): readonly string[] { return this.props.linkedEntityIds; }
    get visibility(): QuickNoteVisibility { return this.props.visibility; }
    get isGMOnly(): boolean { return this.props.visibility === 'gm_only'; }

    /**
     * Checks equality with another QuickNote by ID.
     */
    equals(other: QuickNote): boolean {
        return this.id === other.id;
    }
}