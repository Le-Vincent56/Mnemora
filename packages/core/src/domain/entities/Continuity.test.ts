import { describe, it, expect } from 'vitest';
import { Continuity } from './Continuity';
import { EntityID } from '../value-objects/EntityID';

describe('Continuity', () => {
    const worldID = EntityID.generate();

    describe('create', () => {
        it('should create a continuity with required fields', () => {
            const result = Continuity.create({
                name: 'Default Timeline',
                worldID,
            });

            expect(result.isSuccess).toBe(true);
            expect(result.value.name.toString()).toBe('Default Timeline');
            expect(result.value.worldID.equals(worldID)).toBe(true);
            expect(result.value.description.isEmpty).toBe(true);
            expect(result.value.branchedFromID).toBeNull();
            expect(result.value.branchPointEventID).toBeNull();
        });

        it('should create a continuity with description', () => {
            const result = Continuity.create({
                name: 'Alternate Timeline',
                worldID,
                description: 'What if the Dark Lord had won?',
            });

            expect(result.isSuccess).toBe(true);
            expect(result.value.description.toString()).toBe('What if the Dark Lord had won?');
        });

        it('should create a continuity with branch references', () => {
            const branchedFromID = EntityID.generate();
            const branchPointEventID = EntityID.generate();

            const result = Continuity.create({
                name: 'Branch Timeline',
                worldID,
                branchedFromID,
                branchPointEventID,
            });

            expect(result.isSuccess).toBe(true);
            expect(result.value.branchedFromID!.equals(branchedFromID)).toBe(true);
            expect(result.value.branchPointEventID!.equals(branchPointEventID)).toBe(true);
        });

        it('should reject empty name', () => {
            const result = Continuity.create({
                name: '',
                worldID,
            });

            expect(result.isFailure).toBe(true);
        });

        it('should reject whitespace-only name', () => {
            const result = Continuity.create({
                name: '   ',
                worldID,
            });

            expect(result.isFailure).toBe(true);
        });

        it('should generate unique IDs', () => {
            const c1 = Continuity.create({ name: 'C1', worldID }).value;
            const c2 = Continuity.create({ name: 'C2', worldID }).value;

            expect(c1.id.equals(c2.id)).toBe(false);
        });

        it('should set timestamps on creation', () => {
            const continuity = Continuity.create({ name: 'Test', worldID }).value;

            expect(continuity.createdAt).toBeInstanceOf(Date);
            expect(continuity.modifiedAt).toBeInstanceOf(Date);
            expect(continuity.createdAt.getTime()).toBeLessThanOrEqual(Date.now());
        });
    });

    describe('rename', () => {
        it('should update name and modifiedAt', () => {
            const continuity = Continuity.create({ name: 'Original', worldID }).value;
            const originalModified = continuity.modifiedAt;

            const result = continuity.rename('Updated');

            expect(result.isSuccess).toBe(true);
            expect(continuity.name.toString()).toBe('Updated');
            expect(continuity.modifiedAt.getTime()).toBeGreaterThanOrEqual(originalModified.getTime());
        });

        it('should reject empty name', () => {
            const continuity = Continuity.create({ name: 'Original', worldID }).value;

            const result = continuity.rename('');

            expect(result.isFailure).toBe(true);
            expect(continuity.name.toString()).toBe('Original');
        });
    });

    describe('updateDescription', () => {
        it('should update description', () => {
            const continuity = Continuity.create({ name: 'Test', worldID }).value;

            continuity.updateDescription('New description');

            expect(continuity.description.toString()).toBe('New description');
        });

        it('should update modifiedAt', () => {
            const continuity = Continuity.create({ name: 'Test', worldID }).value;
            const originalModified = continuity.modifiedAt;

            continuity.updateDescription('Updated');

            expect(continuity.modifiedAt.getTime()).toBeGreaterThanOrEqual(originalModified.getTime());
        });
    });

    describe('worldID immutability', () => {
        it('should have immutable worldID (no setter)', () => {
            const continuity = Continuity.create({ name: 'Test', worldID }).value;

            expect(continuity.worldID.equals(worldID)).toBe(true);
        });
    });

    describe('equals', () => {
        it('should compare by ID', () => {
            const c1 = Continuity.create({ name: 'C1', worldID }).value;
            const c2 = Continuity.create({ name: 'C2', worldID }).value;

            expect(c1.equals(c1)).toBe(true);
            expect(c1.equals(c2)).toBe(false);
        });

        it('should return false for null/undefined', () => {
            const c = Continuity.create({ name: 'Test', worldID }).value;

            expect(c.equals(null as unknown as Continuity)).toBe(false);
            expect(c.equals(undefined as unknown as Continuity)).toBe(false);
        });
    });

    describe('fromProps', () => {
        it('should reconstruct from props', () => {
            const original = Continuity.create({
                name: 'Original',
                worldID,
                description: 'A description',
            }).value;

            const reconstructed = Continuity.fromProps({
                id: original.id,
                name: original.name,
                description: original.description,
                worldID: original.worldID,
                branchedFromID: original.branchedFromID,
                branchPointEventID: original.branchPointEventID,
                timestamps: original.timestamps,
            });

            expect(reconstructed.equals(original)).toBe(true);
            expect(reconstructed.name.toString()).toBe('Original');
            expect(reconstructed.description.toString()).toBe('A description');
        });
    });
});