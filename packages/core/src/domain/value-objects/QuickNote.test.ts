import { describe, it, expect } from 'vitest';
import { QuickNote } from './QuickNote';

describe('QuickNote', () => {
    describe('create', () => {
        it('should create a valid quick note with defaults', () => {
            const result = QuickNote.create('Player mentioned the artifact');

            expect(result.isSuccess).toBe(true);
            expect(result.value.content).toBe('Player mentioned the artifact');
            expect(result.value.visibility).toBe('gm_only');
            expect(result.value.linkedEntityIds).toHaveLength(0);
            expect(result.value.id).toBeDefined();
            expect(result.value.capturedAt).toBeInstanceOf(Date);
        });

        it('should trim whitespace from content', () => {
            const result = QuickNote.create('  note with spaces  ');

            expect(result.isSuccess).toBe(true);
            expect(result.value.content).toBe('note with spaces');
        });

        it('should reject empty content', () => {
            const result = QuickNote.create('');

            expect(result.isFailure).toBe(true);
            expect(result.error.message).toContain('empty');
        });

        it('should reject whitespace-only content', () => {
            const result = QuickNote.create('   ');

            expect(result.isFailure).toBe(true);
            expect(result.error.message).toContain('empty');
        });

        it('should reject content exceeding 500 characters', () => {
            const longContent = 'a'.repeat(501);
            const result = QuickNote.create(longContent);

            expect(result.isFailure).toBe(true);
            expect(result.error.message).toContain('500');
        });

        it('should allow content at exactly 500 characters', () => {
            const maxContent = 'a'.repeat(500);
            const result = QuickNote.create(maxContent);

            expect(result.isSuccess).toBe(true);
        });

        it('should accept linked entity IDs', () => {
            const result = QuickNote.create('note', ['entity1', 'entity2']);

            expect(result.isSuccess).toBe(true);
            expect(result.value.linkedEntityIds).toEqual(['entity1', 'entity2']);
        });

        it('should accept players visibility', () => {
            const result = QuickNote.create('public note', [], 'players');

            expect(result.isSuccess).toBe(true);
            expect(result.value.visibility).toBe('players');
            expect(result.value.isGMOnly).toBe(false);
        });
    });

    describe('fromProps', () => {
        it('should reconstruct from props', () => {
            const props = {
                id: 'test-id',
                content: 'Test content',
                capturedAt: new Date('2024-01-01'),
                linkedEntityIds: ['e1'],
                visibility: 'gm_only' as const
            };

            const note = QuickNote.fromProps(props);

            expect(note.id).toBe('test-id');
            expect(note.content).toBe('Test content');
            expect(note.capturedAt).toEqual(new Date('2024-01-01'));
        });
    });

    describe('equals', () => {
        it('should return true for same ID', () => {
            const note1 = QuickNote.fromProps({
                id: 'same-id',
                content: 'Note 1',
                capturedAt: new Date(),
                linkedEntityIds: [],
                visibility: 'gm_only'
            });
            const note2 = QuickNote.fromProps({
                id: 'same-id',
                content: 'Note 2',
                capturedAt: new Date(),
                linkedEntityIds: [],
                visibility: 'gm_only'
            });

            expect(note1.equals(note2)).toBe(true);
        });

        it('should return false for different IDs', () => {
            const note1 = QuickNote.create('Note 1').value;
            const note2 = QuickNote.create('Note 2').value;

            expect(note1.equals(note2)).toBe(false);
        });
    });
});