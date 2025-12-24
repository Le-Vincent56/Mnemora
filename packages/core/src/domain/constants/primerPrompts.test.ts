import { describe, it, expect, vi } from 'vitest';
import {
    PRIMER_PROMPTS,
    getPrimerPrompt,
    getRandomPrimerPrompt,
    getAllPrimerPrompts,
    getPrimerPromptsForType,
    getPrimerPromptCount,
} from './primerPrompts';
import { EntityType } from '../entities/EntityType';
import { TYPE_SPECIFIC_FIELD_NAMES } from '../value-objects/TypeSpecificFields';

describe('PRIMER_PROMPTS', () => {
    it('should have prompts for all entity types', () => {
        expect(PRIMER_PROMPTS[EntityType.CHARACTER]).toBeDefined();
        expect(PRIMER_PROMPTS[EntityType.LOCATION]).toBeDefined();
        expect(PRIMER_PROMPTS[EntityType.FACTION]).toBeDefined();
        expect(PRIMER_PROMPTS[EntityType.NOTE]).toBeDefined();
        expect(PRIMER_PROMPTS[EntityType.SESSION]).toBeDefined();
    });

    it('should have prompts for all type-specific fields', () => {
        // Character fields
        for (const field of TYPE_SPECIFIC_FIELD_NAMES[EntityType.CHARACTER]) {
            expect(PRIMER_PROMPTS[EntityType.CHARACTER][field]).toBeDefined();
            expect(PRIMER_PROMPTS[EntityType.CHARACTER][field].length).toBeGreaterThan(0);
        }

        // Location fields
        for (const field of TYPE_SPECIFIC_FIELD_NAMES[EntityType.LOCATION]) {
            expect(PRIMER_PROMPTS[EntityType.LOCATION][field]).toBeDefined();
            expect(PRIMER_PROMPTS[EntityType.LOCATION][field].length).toBeGreaterThan(0);
        }

        // Faction fields
        for (const field of TYPE_SPECIFIC_FIELD_NAMES[EntityType.FACTION]) {
            expect(PRIMER_PROMPTS[EntityType.FACTION][field]).toBeDefined();
            expect(PRIMER_PROMPTS[EntityType.FACTION][field].length).toBeGreaterThan(0);
        }

        // Note fields
        for (const field of TYPE_SPECIFIC_FIELD_NAMES[EntityType.NOTE]) {
            expect(PRIMER_PROMPTS[EntityType.NOTE][field]).toBeDefined();
            expect(PRIMER_PROMPTS[EntityType.NOTE][field].length).toBeGreaterThan(0);
        }

        // Session fields
        for (const field of TYPE_SPECIFIC_FIELD_NAMES[EntityType.SESSION]) {
            expect(PRIMER_PROMPTS[EntityType.SESSION][field]).toBeDefined();
            expect(PRIMER_PROMPTS[EntityType.SESSION][field].length).toBeGreaterThan(0);
        }
    });

    it('should also have description prompts for main entity types', () => {
        expect(PRIMER_PROMPTS[EntityType.CHARACTER]['description']).toBeDefined();
        expect(PRIMER_PROMPTS[EntityType.LOCATION]['description']).toBeDefined();
        expect(PRIMER_PROMPTS[EntityType.FACTION]['description']).toBeDefined();
    });

    it('should have multiple prompts per field', () => {
        // Spot check that we have variety
        expect(PRIMER_PROMPTS[EntityType.CHARACTER]['appearance'].length).toBeGreaterThanOrEqual(3);
        expect(PRIMER_PROMPTS[EntityType.LOCATION]['atmosphere'].length).toBeGreaterThanOrEqual(3);
        expect(PRIMER_PROMPTS[EntityType.FACTION]['ideology'].length).toBeGreaterThanOrEqual(3);
    });

    it('should have non-empty prompt strings', () => {
        for (const entityType of Object.values(EntityType)) {
            const prompts = PRIMER_PROMPTS[entityType];
            for (const [field, fieldPrompts] of Object.entries(prompts)) {
                for (const prompt of fieldPrompts) {
                    expect(prompt.trim().length).toBeGreaterThan(0);
                }
            }
        }
    });
});

describe('getPrimerPrompt', () => {
    it('should return the first prompt for valid type and field', () => {
        const prompt = getPrimerPrompt(EntityType.CHARACTER, 'appearance');

        expect(prompt).toBe(PRIMER_PROMPTS[EntityType.CHARACTER]['appearance'][0]);
    });

    it('should return empty string for invalid entity type', () => {
        const prompt = getPrimerPrompt('invalid', 'appearance');

        expect(prompt).toBe('');
    });

    it('should return empty string for invalid field', () => {
        const prompt = getPrimerPrompt(EntityType.CHARACTER, 'invalidField');

        expect(prompt).toBe('');
    });

    it('should work with string entity types', () => {
        const prompt = getPrimerPrompt('character', 'personality');

        expect(prompt).toBe(PRIMER_PROMPTS[EntityType.CHARACTER]['personality'][0]);
    });
});

describe('getRandomPrimerPrompt', () => {
    it('should return a prompt from the available prompts', () => {
        const prompts = PRIMER_PROMPTS[EntityType.CHARACTER]['motivation'];
        const randomPrompt = getRandomPrimerPrompt(EntityType.CHARACTER, 'motivation');

        expect(prompts).toContain(randomPrompt);
    });

    it('should return empty string for invalid type', () => {
        const prompt = getRandomPrimerPrompt('invalid', 'motivation');

        expect(prompt).toBe('');
    });

    it('should return empty string for invalid field', () => {
        const prompt = getRandomPrimerPrompt(EntityType.CHARACTER, 'invalidField');

        expect(prompt).toBe('');
    });

    it('should return different prompts over multiple calls (probabilistically)', () => {
        // Run multiple times and check we get some variety
        const results = new Set<string>();
        for (let i = 0; i < 50; i++) {
            results.add(getRandomPrimerPrompt(EntityType.CHARACTER, 'personality'));
        }

        // With 6 prompts and 50 tries, we should see at least 2 different ones
        expect(results.size).toBeGreaterThan(1);
    });
});

describe('getAllPrimerPrompts', () => {
    it('should return all prompts for a valid type and field', () => {
        const prompts = getAllPrimerPrompts(EntityType.LOCATION, 'atmosphere');

        expect(prompts).toEqual(PRIMER_PROMPTS[EntityType.LOCATION]['atmosphere']);
    });

    it('should return empty array for invalid type', () => {
        const prompts = getAllPrimerPrompts('invalid', 'atmosphere');

        expect(prompts).toEqual([]);
    });

    it('should return empty array for invalid field', () => {
        const prompts = getAllPrimerPrompts(EntityType.LOCATION, 'invalidField');

        expect(prompts).toEqual([]);
    });

    it('should return readonly array', () => {
        const prompts = getAllPrimerPrompts(EntityType.FACTION, 'goals');

        // TypeScript would catch mutations at compile time, but at runtime
        // we can verify it's the same reference as the original
        expect(prompts).toBe(PRIMER_PROMPTS[EntityType.FACTION]['goals']);
    });
});

describe('getPrimerPromptsForType', () => {
    it('should return all prompts for a valid entity type', () => {
        const prompts = getPrimerPromptsForType(EntityType.CHARACTER);

        expect(prompts).toBe(PRIMER_PROMPTS[EntityType.CHARACTER]);
        expect(prompts['appearance']).toBeDefined();
        expect(prompts['personality']).toBeDefined();
    });

    it('should return empty object for invalid type', () => {
        const prompts = getPrimerPromptsForType('invalid');

        expect(prompts).toEqual({});
    });

    it('should work with string entity types', () => {
        const prompts = getPrimerPromptsForType('session');

        expect(prompts['prepNotes']).toBeDefined();
    });
});

describe('getPrimerPromptCount', () => {
    it('should return correct count for valid type and field', () => {
        const count = getPrimerPromptCount(EntityType.CHARACTER, 'personality');

        expect(count).toBe(PRIMER_PROMPTS[EntityType.CHARACTER]['personality'].length);
    });

    it('should return 0 for invalid type', () => {
        const count = getPrimerPromptCount('invalid', 'personality');

        expect(count).toBe(0);
    });

    it('should return 0 for invalid field', () => {
        const count = getPrimerPromptCount(EntityType.CHARACTER, 'invalidField');

        expect(count).toBe(0);
    });
});
