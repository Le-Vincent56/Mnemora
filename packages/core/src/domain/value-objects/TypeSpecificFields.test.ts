import { describe, it, expect } from 'vitest';
import { TypeSpecificFieldsWrapper, TYPE_SPECIFIC_FIELD_NAMES } from './TypeSpecificFields';
import { EntityType } from '../entities/EntityType';

describe('TypeSpecificFieldsWrapper', () => {
    describe('createForType', () => {
        it('should create empty fields for Character', () => {
            const wrapper = TypeSpecificFieldsWrapper.createForType(EntityType.CHARACTER);

            expect(wrapper.isEmpty()).toBe(true);
            expect(wrapper.getValidFieldNames()).toEqual([
                'appearance', 'personality', 'motivation', 'voiceMannerisms'
            ]);
        });

        it('should create empty fields for Location', () => {
            const wrapper = TypeSpecificFieldsWrapper.createForType(EntityType.LOCATION);

            expect(wrapper.isEmpty()).toBe(true);
            expect(wrapper.getValidFieldNames()).toEqual([
                'appearance', 'atmosphere', 'notableFeatures'
            ]);
        });

        it('should create empty fields for Faction', () => {
            const wrapper = TypeSpecificFieldsWrapper.createForType(EntityType.FACTION);

            expect(wrapper.isEmpty()).toBe(true);
            expect(wrapper.getValidFieldNames()).toEqual([
                'ideology', 'goals', 'resources', 'structure'
            ]);
        });

        it('should create empty fields for Note', () => {
            const wrapper = TypeSpecificFieldsWrapper.createForType(EntityType.NOTE);

            expect(wrapper.isEmpty()).toBe(true);
            expect(wrapper.getValidFieldNames()).toEqual(['content']);
        });

        it('should create empty fields for Session', () => {
            const wrapper = TypeSpecificFieldsWrapper.createForType(EntityType.SESSION);

            expect(wrapper.isEmpty()).toBe(true);
            expect(wrapper.getValidFieldNames()).toEqual(['prepNotes']);
        });
    });

    describe('fromJSON', () => {
        it('should parse valid JSON for Character', () => {
            const json = JSON.stringify({
                appearance: 'Tall and imposing',
                personality: 'Gruff but kind',
            });

            const wrapper = TypeSpecificFieldsWrapper.fromJSON(EntityType.CHARACTER, json);

            expect(wrapper.getField('appearance')).toBe('Tall and imposing');
            expect(wrapper.getField('personality')).toBe('Gruff but kind');
            expect(wrapper.getField('motivation')).toBeUndefined();
        });

        it('should return empty fields for null JSON', () => {
            const wrapper = TypeSpecificFieldsWrapper.fromJSON(EntityType.CHARACTER, null);

            expect(wrapper.isEmpty()).toBe(true);
        });

        it('should return empty fields for undefined JSON', () => {
            const wrapper = TypeSpecificFieldsWrapper.fromJSON(EntityType.CHARACTER, undefined);

            expect(wrapper.isEmpty()).toBe(true);
        });

        it('should return empty fields for empty string', () => {
            const wrapper = TypeSpecificFieldsWrapper.fromJSON(EntityType.CHARACTER, '');

            expect(wrapper.isEmpty()).toBe(true);
        });

        it('should return empty fields for empty object JSON', () => {
            const wrapper = TypeSpecificFieldsWrapper.fromJSON(EntityType.CHARACTER, '{}');

            expect(wrapper.isEmpty()).toBe(true);
        });

        it('should return empty fields for invalid JSON', () => {
            const wrapper = TypeSpecificFieldsWrapper.fromJSON(EntityType.CHARACTER, 'not valid json');

            expect(wrapper.isEmpty()).toBe(true);
        });

        it('should ignore fields not valid for the entity type', () => {
            const json = JSON.stringify({
                appearance: 'Valid field',
                invalidField: 'Should be ignored',
                ideology: 'Also invalid for character',
            });

            const wrapper = TypeSpecificFieldsWrapper.fromJSON(EntityType.CHARACTER, json);

            expect(wrapper.getField('appearance')).toBe('Valid field');
            expect(wrapper.getField('invalidField')).toBeUndefined();
            expect(wrapper.getField('ideology')).toBeUndefined();
        });

        it('should ignore non-string values', () => {
            const json = JSON.stringify({
                appearance: 'Valid string',
                personality: 123,
                motivation: { nested: 'object' },
                voiceMannerisms: ['array'],
            });

            const wrapper = TypeSpecificFieldsWrapper.fromJSON(EntityType.CHARACTER, json);

            expect(wrapper.getField('appearance')).toBe('Valid string');
            expect(wrapper.getField('personality')).toBeUndefined();
            expect(wrapper.getField('motivation')).toBeUndefined();
            expect(wrapper.getField('voiceMannerisms')).toBeUndefined();
        });
    });

    describe('toJSON', () => {
        it('should serialize fields to JSON', () => {
            const wrapper = TypeSpecificFieldsWrapper.createForType(EntityType.CHARACTER)
                .setField('appearance', 'Tall')!
                .setField('personality', 'Kind')!;

            const json = wrapper.toJSON();
            const parsed = JSON.parse(json);

            expect(parsed.appearance).toBe('Tall');
            expect(parsed.personality).toBe('Kind');
        });

        it('should produce empty object for empty fields', () => {
            const wrapper = TypeSpecificFieldsWrapper.createForType(EntityType.CHARACTER);

            expect(wrapper.toJSON()).toBe('{}');
        });

        it('should round-trip through JSON', () => {
            const original = TypeSpecificFieldsWrapper.createForType(EntityType.FACTION)
                .setField('ideology', 'Order above all')!
                .setField('goals', 'World domination')!
                .setField('resources', 'Vast armies')!;

            const json = original.toJSON();
            const restored = TypeSpecificFieldsWrapper.fromJSON(EntityType.FACTION, json);

            expect(restored.getField('ideology')).toBe('Order above all');
            expect(restored.getField('goals')).toBe('World domination');
            expect(restored.getField('resources')).toBe('Vast armies');
        });
    });

    describe('toFields', () => {
        it('should return discriminated union with type', () => {
            const wrapper = TypeSpecificFieldsWrapper.createForType(EntityType.CHARACTER)
                .setField('appearance', 'Scarred face')!;

            const fields = wrapper.toFields();

            expect(fields.type).toBe(EntityType.CHARACTER);
            expect(fields.appearance).toBe('Scarred face');
        });
    });

    describe('getField', () => {
        it('should return field value when set', () => {
            const wrapper = TypeSpecificFieldsWrapper.createForType(EntityType.LOCATION)
                .setField('atmosphere', 'Eerie and quiet')!;

            expect(wrapper.getField('atmosphere')).toBe('Eerie and quiet');
        });

        it('should return undefined for unset field', () => {
            const wrapper = TypeSpecificFieldsWrapper.createForType(EntityType.LOCATION);

            expect(wrapper.getField('atmosphere')).toBeUndefined();
        });

        it('should return undefined for invalid field name', () => {
            const wrapper = TypeSpecificFieldsWrapper.createForType(EntityType.LOCATION);

            expect(wrapper.getField('invalidField')).toBeUndefined();
            expect(wrapper.getField('ideology')).toBeUndefined(); // Valid for Faction, not Location
        });
    });

    describe('setField', () => {
        it('should return new wrapper with updated field', () => {
            const original = TypeSpecificFieldsWrapper.createForType(EntityType.CHARACTER);
            const updated = original.setField('appearance', 'New appearance');

            expect(updated).not.toBeNull();
            expect(updated!.getField('appearance')).toBe('New appearance');
            // Original should be unchanged (immutability)
            expect(original.getField('appearance')).toBeUndefined();
        });

        it('should return null for invalid field name', () => {
            const wrapper = TypeSpecificFieldsWrapper.createForType(EntityType.CHARACTER);

            expect(wrapper.setField('invalidField', 'value')).toBeNull();
            expect(wrapper.setField('ideology', 'value')).toBeNull(); // Valid for Faction, not Character
        });

        it('should allow clearing a field with undefined', () => {
            const wrapper = TypeSpecificFieldsWrapper.createForType(EntityType.CHARACTER)
                .setField('appearance', 'Tall')!;

            const cleared = wrapper.setField('appearance', undefined);

            expect(cleared).not.toBeNull();
            expect(cleared!.getField('appearance')).toBeUndefined();
            expect(cleared!.isEmpty()).toBe(true);
        });

        it('should preserve other fields when updating one', () => {
            const wrapper = TypeSpecificFieldsWrapper.createForType(EntityType.CHARACTER)
                .setField('appearance', 'Tall')!
                .setField('personality', 'Kind')!;

            const updated = wrapper.setField('motivation', 'Justice')!;

            expect(updated.getField('appearance')).toBe('Tall');
            expect(updated.getField('personality')).toBe('Kind');
            expect(updated.getField('motivation')).toBe('Justice');
        });
    });

    describe('isValidField', () => {
        it('should return true for valid Character fields', () => {
            const wrapper = TypeSpecificFieldsWrapper.createForType(EntityType.CHARACTER);

            expect(wrapper.isValidField('appearance')).toBe(true);
            expect(wrapper.isValidField('personality')).toBe(true);
            expect(wrapper.isValidField('motivation')).toBe(true);
            expect(wrapper.isValidField('voiceMannerisms')).toBe(true);
        });

        it('should return false for invalid fields', () => {
            const wrapper = TypeSpecificFieldsWrapper.createForType(EntityType.CHARACTER);

            expect(wrapper.isValidField('invalidField')).toBe(false);
            expect(wrapper.isValidField('ideology')).toBe(false); // Faction field
            expect(wrapper.isValidField('atmosphere')).toBe(false); // Location field
        });

        it('should be type-specific', () => {
            const charWrapper = TypeSpecificFieldsWrapper.createForType(EntityType.CHARACTER);
            const factionWrapper = TypeSpecificFieldsWrapper.createForType(EntityType.FACTION);

            expect(charWrapper.isValidField('ideology')).toBe(false);
            expect(factionWrapper.isValidField('ideology')).toBe(true);

            expect(charWrapper.isValidField('appearance')).toBe(true);
            expect(factionWrapper.isValidField('appearance')).toBe(false);
        });
    });

    describe('isEmpty', () => {
        it('should return true for newly created wrapper', () => {
            const wrapper = TypeSpecificFieldsWrapper.createForType(EntityType.CHARACTER);

            expect(wrapper.isEmpty()).toBe(true);
        });

        it('should return false when a field is set', () => {
            const wrapper = TypeSpecificFieldsWrapper.createForType(EntityType.CHARACTER)
                .setField('appearance', 'Tall')!;

            expect(wrapper.isEmpty()).toBe(false);
        });

        it('should return true when all fields are empty strings', () => {
            const wrapper = TypeSpecificFieldsWrapper.createForType(EntityType.CHARACTER)
                .setField('appearance', '')!
                .setField('personality', '')!;

            expect(wrapper.isEmpty()).toBe(true);
        });

        it('should return true after clearing all fields', () => {
            const wrapper = TypeSpecificFieldsWrapper.createForType(EntityType.CHARACTER)
                .setField('appearance', 'Tall')!
                .setField('appearance', undefined)!;

            expect(wrapper.isEmpty()).toBe(true);
        });
    });

    describe('TYPE_SPECIFIC_FIELD_NAMES constant', () => {
        it('should have entries for all entity types', () => {
            expect(TYPE_SPECIFIC_FIELD_NAMES[EntityType.CHARACTER]).toBeDefined();
            expect(TYPE_SPECIFIC_FIELD_NAMES[EntityType.LOCATION]).toBeDefined();
            expect(TYPE_SPECIFIC_FIELD_NAMES[EntityType.FACTION]).toBeDefined();
            expect(TYPE_SPECIFIC_FIELD_NAMES[EntityType.NOTE]).toBeDefined();
            expect(TYPE_SPECIFIC_FIELD_NAMES[EntityType.SESSION]).toBeDefined();
        });

        it('should have correct fields for each type', () => {
            expect(TYPE_SPECIFIC_FIELD_NAMES[EntityType.CHARACTER]).toContain('appearance');
            expect(TYPE_SPECIFIC_FIELD_NAMES[EntityType.LOCATION]).toContain('atmosphere');
            expect(TYPE_SPECIFIC_FIELD_NAMES[EntityType.FACTION]).toContain('ideology');
            expect(TYPE_SPECIFIC_FIELD_NAMES[EntityType.NOTE]).toContain('content');
            expect(TYPE_SPECIFIC_FIELD_NAMES[EntityType.SESSION]).toContain('prepNotes');
        });
    });
});
