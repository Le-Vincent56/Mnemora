import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SQLiteContinuityRepository } from './SQLiteContinuityRepository';
import { DatabaseManager } from '../database/DatabaseManager';
import { Continuity } from '../../domain/entities/Continuity';
import { World } from '../../domain/entities/World';
import { SQLiteWorldRepository } from './SQLiteWorldRepository';
import { EntityID } from '../../domain/value-objects/EntityID';

describe('SQLiteContinuityRepository', () => {
    let dbManager: DatabaseManager;
    let continuityRepository: SQLiteContinuityRepository;
    let worldRepository: SQLiteWorldRepository;
    let testWorld: World;

    beforeEach(async () => {
        dbManager = new DatabaseManager({ filepath: ':memory:' });
        dbManager.initialize();
        const db = dbManager.getDatabase();
        continuityRepository = new SQLiteContinuityRepository(db);
        worldRepository = new SQLiteWorldRepository(db);

        testWorld = World.create({ name: 'Test World' }).value;
        await worldRepository.save(testWorld);
    });

    afterEach(() => {
        dbManager.close();
    });

    describe('save and findById', () => {
        it('should save and retrieve a continuity', async () => {
            const continuity = Continuity.create({
                name: 'Main Timeline',
                worldID: testWorld.id,
                description: 'The primary timeline',
            }).value;

            await continuityRepository.save(continuity);
            const result = await continuityRepository.findById(continuity.id);

            expect(result.isSuccess).toBe(true);
            expect(result.value).not.toBeNull();
            expect(result.value!.name.toString()).toBe('Main Timeline');
            expect(result.value!.description.toString()).toBe('The primary timeline');
            expect(result.value!.worldID.equals(testWorld.id)).toBe(true);
        });

        it('should return null for non-existent ID', async () => {
            const result = await continuityRepository.findById(EntityID.generate());

            expect(result.isSuccess).toBe(true);
            expect(result.value).toBeNull();
        });

        it('should upsert on save (idempotent)', async () => {
            const continuity = Continuity.create({
                name: 'Timeline',
                worldID: testWorld.id,
            }).value;

            await continuityRepository.save(continuity);
            continuity.rename('Updated Timeline');
            await continuityRepository.save(continuity);

            const result = await continuityRepository.findById(continuity.id);
            expect(result.value!.name.toString()).toBe('Updated Timeline');
        });
    });

    describe('findByWorld', () => {
        it('should return all continuities for a world', async () => {
            const c1 = Continuity.create({ name: 'Timeline A', worldID: testWorld.id }).value;
            const c2 = Continuity.create({ name: 'Timeline B', worldID: testWorld.id }).value;

            await continuityRepository.save(c1);
            await continuityRepository.save(c2);

            const result = await continuityRepository.findByWorld(testWorld.id);

            expect(result.isSuccess).toBe(true);
            expect(result.value).toHaveLength(2);
        });

        it('should return empty array for world with no continuities', async () => {
            const otherWorld = World.create({ name: 'Other World' }).value;
            await worldRepository.save(otherWorld);

            const result = await continuityRepository.findByWorld(otherWorld.id);

            expect(result.isSuccess).toBe(true);
            expect(result.value).toHaveLength(0);
        });

        it('should not return continuities from other worlds', async () => {
            const otherWorld = World.create({ name: 'Other World' }).value;
            await worldRepository.save(otherWorld);

            const c1 = Continuity.create({ name: 'World 1 Timeline', worldID: testWorld.id }).value;
            const c2 = Continuity.create({ name: 'World 2 Timeline', worldID: otherWorld.id }).value;

            await continuityRepository.save(c1);
            await continuityRepository.save(c2);

            const result = await continuityRepository.findByWorld(testWorld.id);

            expect(result.value).toHaveLength(1);
            expect(result.value[0].name.toString()).toBe('World 1 Timeline');
        });
    });

    describe('delete', () => {
        it('should remove a continuity', async () => {
            const continuity = Continuity.create({
                name: 'To Delete',
                worldID: testWorld.id,
            }).value;

            await continuityRepository.save(continuity);
            await continuityRepository.delete(continuity.id);

            const result = await continuityRepository.findById(continuity.id);
            expect(result.value).toBeNull();
        });

        it('should be idempotent (no error for non-existent)', async () => {
            const result = await continuityRepository.delete(EntityID.generate());
            expect(result.isSuccess).toBe(true);
        });
    });

    describe('exists', () => {
        it('should return true for existing continuity', async () => {
            const continuity = Continuity.create({
                name: 'Exists',
                worldID: testWorld.id,
            }).value;

            await continuityRepository.save(continuity);
            const result = await continuityRepository.exists(continuity.id);

            expect(result.value).toBe(true);
        });

        it('should return false for non-existent continuity', async () => {
            const result = await continuityRepository.exists(EntityID.generate());
            expect(result.value).toBe(false);
        });
    });
});