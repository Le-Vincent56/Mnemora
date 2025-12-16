/**
 * RichText: Value Object for markdown/rich text content.
 * Wraps text content that may contain markdown formatting.
 * For now, stores raw markdown string. Future: could parse to AST.
 */
export class RichText {
    private readonly _value: string;

    /**
     * Returns the raw content.
     */
    get value(): string {
        return this._value;
    }

    /**
     * Returns true if the content is empty or whitespace-only.
     */
    get isEmpty(): boolean {
        return this._value.trim().length === 0;
    }

    /**
     * Returns the character count.
     */
    get length(): number {
        return this._value.length;
    }

    private constructor(value: string) {
        this._value = value;
        Object.freeze(this);
    }

    /**
     * Creates an empty RichText.
     */
    static empty(): RichText {
        return new RichText('');
    }

    /**
     * Creates RichText from a string.
     * No validation - any string is valid content.
     */
    static fromString(value: string): RichText {
        return new RichText(value);
    }

    /**
     * Returns the raw markdown/text content.
     */
    toString(): string {
        return this._value;
    }

    /**
     * Returns a plain text version with markdown stripped.
     * Simple implementation - removes common markdown syntax.
     */
    toPlainText(): string {
        return this.value
            .replace(/#{1,6}\s?/g, '')          // Headers
            .replace(/\*\*(.+?)\*\*/g, '$1')    // Bold
            .replace(/\*(.+?)\*/g, '$1')        // Italic
            .replace(/_(.+?)_/g, '$1')          // Italic alt
            .replace(/`(.+?)`/g, '$1')          // Inline code
            .replace(/\[(.+?)\]\(.+?\)/g, '$1') // Links
            .trim();
    }

    /**
     * Checks if content contains a substring (case-insensitive).
     * Searches plain text version for better matching.
     */
    contains(substring: string): boolean {
        return this.toPlainText().toLowerCase().includes(substring.toLowerCase());
    }

    /**
     * Checks equality with another RichText.
     */
    equals(other: RichText): boolean {
        return this._value === other._value;
    }
}