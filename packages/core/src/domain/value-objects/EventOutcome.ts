/**
   * EventOutcome: Structured representation of a change caused by an Event.
   * Stored as JSON array string in Event's type_specific_fields.outcomes.
   * Used for drift detection: compare toValue against current entity state.
   */
export interface EventOutcome {
    readonly entityID: string;
    readonly field: string;
    readonly fromValue?: string;
    readonly toValue: string;
    readonly description?: string;
}

/**
 * Parses an outcomes JSON string into EventOutcome[].
 * Returns empty array on invalid input.
 */
export function parseEventOutcomes(json: string | undefined): EventOutcome[] {
    if (!json) return [];
    try {
        const parsed = JSON.parse(json);
        if (!Array.isArray(parsed)) return [];
        return parsed.filter(
            (o: unknown): o is EventOutcome =>
                typeof o === 'object' && o !== null &&
                typeof (o as Record<string, unknown>).entityID === 'string' &&
                typeof (o as Record<string, unknown>).field === 'string' &&
                typeof (o as Record<string, unknown>).toValue === 'string'
        );
    } catch {
        return [];
    }
}

/**
 * Serializes EventOutcome[] to a JSON string for storage.
 */
export function serializeEventOutcomes(outcomes: EventOutcome[]): string {
    return JSON.stringify(outcomes);
}