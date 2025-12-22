import { describe, it, expect } from 'vitest';
import { World } from './World';

describe('World', () => {
    describe('create', () => {
        it('should create a world with name only', () => {
            const result = World.create({ name: 'The Outer Rim' });

            expect(result.isSuccess).toBe(true);
            expect(result.value.name.toString()).toBe('The Outer Rim');
            expect(result.value.tagline).toBeNull();
        });

        it('should create a world with name and tagline', () => {
            const result = World.create({
                name: 'The Outer Rim',
                tagline: 'In a galaxy, far, far away'
            });

            expect(result.isSuccess).toBe(true);
            expect(result.value.name.toString()).toBe('The Outer Rim');
            expect(result.value.tagline).toBe('In a galaxy, far, far away');
        });

        it('should reject empty name', () => {
            const result = World.create({ name: '' });

            expect(result.isFailure).toBe(true);
        });

        it('should reject tagline longer than 200 characters', () => {
            const longTagline = 'a'.repeat(201);
            const result = World.create({
                name: 'Test World',
                tagline: longTagline
            });

            expect(result.isFailure).toBe(true);
            expect(result.error.message).toContain('Tagline');
        });
    });

    describe('rename', () => {
        it('should update name and modifiedAt', () => {
            const world = World.create({ name: 'Original' }).value;
            const originalModified = world.modifiedAt;

            // Small delay to ensure timestamp difference
            const result = world.rename('Updated');

            expect(result.isSuccess).toBe(true);
            expect(world.name.toString()).toBe('Updated');
            expect(world.modifiedAt.getTime()).toBeGreaterThanOrEqual(originalModified.getTime());
        });
    });

    describe('updateTagline', () => {
        it('should update tagline and modifiedAt', () => {
            const world = World.create({ name: 'Test' }).value;

            const result = world.updateTagline('New tagline');

            expect(result.isSuccess).toBe(true);
            expect(world.tagline).toBe('New tagline');
        });

        it('should clear tagline when passed null', () => {
            const world = World.create({
                name: 'Test',
                tagline: 'Original tagline'
            }).value;

            const result = world.updateTagline(null);

            expect(result.isSuccess).toBe(true);
            expect(world.tagline).toBeNull();
        });

        it('should reject tagline longer than 200 characters', () => {
            const world = World.create({ name: 'Test' }).value;
            const longTagline = 'a'.repeat(201);

            const result = world.updateTagline(longTagline);

            expect(result.isFailure).toBe(true);
        });
    });

    describe('equals', () => {
        it('should compare by ID', () => {
            const world1 = World.create({ name: 'World 1' }).value;
            const world2 = World.create({ name: 'World 2' }).value;

            expect(world1.equals(world1)).toBe(true);
            expect(world1.equals(world2)).toBe(false);
        });
    });
});