import { describe, it, expect } from 'vitest';
import { parseEventOutcomes, serializeEventOutcomes, EventOutcome } from './EventOutcome';

describe('EventOutcome', () => {
    describe('parseEventOutcomes', () => {
        it('should parse valid JSON array', () => {
            const json = JSON.stringify([
                { entityID: 'abc-123', field: 'status', toValue: 'dead', fromValue: 'alive', description: 'Killed in battle' },
            ]);

            const outcomes = parseEventOutcomes(json);

            expect(outcomes).toHaveLength(1);
            expect(outcomes[0].entityID).toBe('abc-123');
            expect(outcomes[0].field).toBe('status');
            expect(outcomes[0].toValue).toBe('dead');
            expect(outcomes[0].fromValue).toBe('alive');
            expect(outcomes[0].description).toBe('Killed in battle');
        });

        it('should parse outcomes without optional fields', () => {
            const json = JSON.stringify([
                { entityID: 'abc', field: 'location', toValue: 'Mordor' },
            ]);

            const outcomes = parseEventOutcomes(json);

            expect(outcomes).toHaveLength(1);
            expect(outcomes[0].fromValue).toBeUndefined();
            expect(outcomes[0].description).toBeUndefined();
        });

        it('should return empty array for undefined input', () => {
            expect(parseEventOutcomes(undefined)).toEqual([]);
        });

        it('should return empty array for empty string', () => {
            expect(parseEventOutcomes('')).toEqual([]);
        });

        it('should return empty array for invalid JSON', () => {
            expect(parseEventOutcomes('not json')).toEqual([]);
        });

        it('should return empty array for non-array JSON', () => {
            expect(parseEventOutcomes(JSON.stringify({ entityId: 'abc' }))).toEqual([]);
        });

        it('should filter out invalid entries from array', () => {
            const json = JSON.stringify([
                { entityID: 'valid', field: 'status', toValue: 'alive' },
                { entityID: 123, field: 'status', toValue: 'dead' },  // entityId not string
                { entityID: 'valid2', toValue: 'value' },  // missing field
                { entityID: 'valid3', field: 'status' },   // missing toValue
                null,
                'string entry',
            ]);

            const outcomes = parseEventOutcomes(json);

            expect(outcomes).toHaveLength(1);
            expect(outcomes[0].entityID).toBe('valid');
        });

        it('should handle multiple valid outcomes', () => {
            const json = JSON.stringify([
                { entityID: 'a', field: 'status', toValue: 'dead' },
                { entityID: 'b', field: 'location', toValue: 'Mordor' },
                { entityID: 'c', field: 'loyalty', toValue: 'enemy', fromValue: 'ally' },
            ]);

            const outcomes = parseEventOutcomes(json);

            expect(outcomes).toHaveLength(3);
        });
    });

    describe('serializeEventOutcomes', () => {
        it('should serialize outcomes to JSON string', () => {
            const outcomes: EventOutcome[] = [
                { entityID: 'abc', field: 'status', toValue: 'dead' },
            ];

            const json = serializeEventOutcomes(outcomes);
            const parsed = JSON.parse(json);

            expect(parsed).toHaveLength(1);
            expect(parsed[0].entityID).toBe('abc');
        });

        it('should serialize empty array', () => {
            const json = serializeEventOutcomes([]);
            expect(json).toBe('[]');
        });
    });

    describe('roundtrip', () => {
        it('should survive serialize -> parse roundtrip', () => {
            const original: EventOutcome[] = [
                { entityID: 'abc-123', field: 'status', toValue: 'dead', fromValue: 'alive', description: 'Killed in battle' },
                { entityID: 'def-456', field: 'location', toValue: 'Mordor' },
            ];

            const json = serializeEventOutcomes(original);
            const parsed = parseEventOutcomes(json);

            expect(parsed).toHaveLength(2);
            expect(parsed[0].entityID).toBe('abc-123');
            expect(parsed[0].fromValue).toBe('alive');
            expect(parsed[0].description).toBe('Killed in battle');
            expect(parsed[1].entityID).toBe('def-456');
            expect(parsed[1].fromValue).toBeUndefined();
            expect(parsed[1].description).toBeUndefined();
        });

        it('should survive empty roundtrip', () => {
            const json = serializeEventOutcomes([]);
            const parsed = parseEventOutcomes(json);
            expect(parsed).toEqual([]);
        });
    });
});