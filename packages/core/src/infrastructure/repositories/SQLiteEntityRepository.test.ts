import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SQLiteEntityRepository } from './SQLiteEntityRepository';
import { DatabaseManager } from '../database/DatabaseManager';
import { Character } from '../../domain/entities/Character';
import { Location } from '../../domain/entities/Location';
import { Session } from '../../domain/entities/Session';
import { Note } from '../../domain/entities/Note';
import { EntityID } from '../../domain/value-objects/EntityID';
import { EntityType } from '../../domain/entities/EntityType';

describe('SQLiteEntityRepository', () => {
    let dbManager: DatabaseManager;
    let repository: SQLiteEntityRepository;
    let worldID: EntityID;
    let campaignID: EntityID;

    beforeEach(() => {
        // Use in-memory database for tests
        dbManager = new DatabaseManager({ filepath: ':memory:' });
        dbManager.initialize();
        repository = new SQLiteEntityRepository(dbManager.getDatabase());
        worldID = EntityID.generate();
        campaignID = EntityID.generate();
    });

    afterEach(() => {
        dbManager.close();
    })

    describe('save and findByID', () => {
        it('should save and retrieve a Character', async () => {
            const character = Character.create({
                name: 'Test Character',
                worldID,
                campaignID,
            }).value;
            character.updateDescription('A test description');

            await repository.save(character);
            const result = await repository.findByID(character.id);

            expect(result.isSuccess).toBe(true);
            expect(result.value).not.toBeNull();
            const retrieved = result.value as Character;
            expect(retrieved.name.toString()).toBe('Test Character');
            expect(retrieved.description.toString()).toBe('A test description');
        });

        it('should return null for non-existent ID', async () => {
            const result = await repository.findByID(EntityID.generate());

            expect(result.isSuccess).toBe(true);
            expect(result.value).toBeNull();
        });

        it('should update existing entity on save', async () => {
            const character = Character.create({
                name: 'Original Name',
                worldID,
            }).value;

            await repository.save(character);
            character.rename('Updated Name');
            await repository.save(character);

            const result = await repository.findByID(character.id);
            expect((result.value as Character).name.toString()).toBe('Updated Name');
        });
    });

    describe('findByWorld', () => {
        it('should find all entities in a world', async () => {
            const char1 = Character.create({ name: 'Char 1', worldID }).value;
            const char2 = Character.create({ name: 'Char 2', worldID }).value;
            const location = Location.create({ name: 'Location 1', worldID }).value;

            // Different world - should not be returned
            const otherWorld = EntityID.generate();
            const otherChar = Character.create({ name: 'Other', worldID: otherWorld }).value;

            await repository.saveMany([char1, char2, location, otherChar]);

            const result = await repository.findByWorld(worldID);

            expect(result.isSuccess).toBe(true);
            expect(result.value.items).toHaveLength(3);
            expect(result.value.total).toBe(3);
        });

        it('should paginate results', async () => {
            // Create 5 characters
            for (let i = 0; i < 5; i++) {
                const char = Character.create({ name: `Char ${i}`, worldID }).value;
                await repository.save(char);
            }

            const page1 = await repository.findByWorld(worldID, { limit: 2, offset: 0 });
            const page2 = await repository.findByWorld(worldID, { limit: 2, offset: 2 });

            expect(page1.value.items).toHaveLength(2);
            expect(page1.value.hasMore).toBe(true);
            expect(page2.value.items).toHaveLength(2);
            expect(page2.value.hasMore).toBe(true);
        });
    });

    describe('findByCampaign', () => {
        it('should find only campaign-scoped entities', async () => {
            const worldChar = Character.create({ name: 'World Char', worldID }).value;
            const campaignChar = Character.create({ name: 'Campaign Char', worldID, campaignID }).value;
            const session = Session.create({ name: 'Session 1', worldID, campaignID }).value;

            await repository.saveMany([worldChar, campaignChar, session]);

            const result = await repository.findByCampaign(campaignID);

            expect(result.value.items).toHaveLength(2);
            expect(result.value.items.every(e =>
                (e as Character).campaignID?.toString() === campaignID.toString()
            )).toBe(true);
        });
    });

    describe('findByFilter', () => {
        it('should filter by entity type', async () => {
            const char = Character.create({ name: 'Char', worldID }).value;
            const location = Location.create({ name: 'Location', worldID }).value;

            await repository.saveMany([char, location]);

            const result = await repository.findByFilter({
                worldID,
                types: [EntityType.CHARACTER],
            });

            expect(result.value.items).toHaveLength(1);
            expect(result.value.items[0].type).toBe(EntityType.CHARACTER);
        });

        it('should filter by tags', async () => {
            const villain = Character.create({ name: 'Villain', worldID }).value;
            villain.setTags(['villain', 'npc']);

            const hero = Character.create({ name: 'Hero', worldID }).value;
            hero.setTags(['hero', 'npc']);

            await repository.saveMany([villain, hero]);

            const result = await repository.findByFilter({
                worldID,
                tags: ['villain'],
            });

            expect(result.value.items).toHaveLength(1);
            expect((result.value.items[0] as Character).name.toString()).toBe('Villain');
        });

        it('should filter by multiple tags (AND logic)', async () => {
            const char1 = Character.create({ name: 'Char1', worldID }).value;
            char1.setTags(['npc', 'villain']);

            const char2 = Character.create({ name: 'Char2', worldID }).value;
            char2.setTags(['npc', 'ally']);

            await repository.saveMany([char1, char2]);

            const result = await repository.findByFilter({
                worldID,
                tags: ['npc', 'villain'],
            });

            expect(result.value.items).toHaveLength(1);
            expect((result.value.items[0] as Character).name.toString()).toBe('Char1');
        });

        it('should exclude forked entities when includeForked is false', async () => {
            const original = Character.create({ name: 'Original', worldID }).value;
            await repository.save(original);

            const forked = original.fork(campaignID);
            await repository.save(forked);

            const result = await repository.findByFilter({
                worldID,
                includeForked: false,
            });

            expect(result.value.items).toHaveLength(1);
            expect((result.value.items[0] as Character).isForked).toBe(false);
        });
    });

    describe('delete', () => {
        it('should delete an entity', async () => {
            const character = Character.create({ name: 'To Delete', worldID }).value;
            await repository.save(character);

            await repository.delete(character.id);

            const result = await repository.findByID(character.id);
            expect(result.value).toBeNull();
        });

        it('should be idempotent (no error if entity does not exist)', async () => {
            const result = await repository.delete(EntityID.generate());
            expect(result.isSuccess).toBe(true);
        });
    });

    describe('deleteMany', () => {
        it('should delete multiple entities', async () => {
            const char1 = Character.create({ name: 'Char 1', worldID }).value;
            const char2 = Character.create({ name: 'Char 2', worldID }).value;
            await repository.saveMany([char1, char2]);

            await repository.deleteMany([char1.id, char2.id]);

            const result = await repository.findByWorld(worldID);
            expect(result.value.items).toHaveLength(0);
        });
    });

    describe('exists', () => {
        it('should return true for existing entity', async () => {
            const character = Character.create({ name: 'Exists', worldID }).value;
            await repository.save(character);

            const result = await repository.exists(character.id);

            expect(result.value).toBe(true);
        });

        it('should return false for non-existent entity', async () => {
            const result = await repository.exists(EntityID.generate());

            expect(result.value).toBe(false);
        });
    });

    describe('count', () => {
        it('should count entities matching filter', async () => {
            const char1 = Character.create({ name: 'Char 1', worldID }).value;
            const char2 = Character.create({ name: 'Char 2', worldID }).value;
            const location = Location.create({ name: 'Location', worldID }).value;
            await repository.saveMany([char1, char2, location]);

            const result = await repository.count({
                worldID,
                types: [EntityType.CHARACTER],
            });

            expect(result.value).toBe(2);
        });
    });
})