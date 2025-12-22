import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SQLiteWorldRepository } from './SQLiteWorldRepository';
import { SQLiteCampaignRepository } from './SQLiteCampaignRepository';
import { DatabaseManager } from '../database/DatabaseManager';
import { World } from '../../domain/entities/World';
import { Campaign } from '../../domain/entities/Campaign';
import { EntityID } from '../../domain/value-objects/EntityID';

describe('SQLiteWorldRepository', () => {
    let dbManager: DatabaseManager;
    let worldRepository: SQLiteWorldRepository;
    let campaignRepository: SQLiteCampaignRepository;

    beforeEach(() => {
        dbManager = new DatabaseManager({ filepath: ':memory:' });
        dbManager.initialize();
        worldRepository = new SQLiteWorldRepository(dbManager.getDatabase());
        campaignRepository = new SQLiteCampaignRepository(dbManager.getDatabase());
    });

    afterEach(() => {
        dbManager.close();
    });

    describe('save and findById', () => {
        it('should save and retrieve a world (create)', async () => {
            const world = World.create({
                name: 'Test World',
                tagline: 'A test tagline'
            }).value;

            await worldRepository.save(world);
            const result = await worldRepository.findById(world.id);

            expect(result.isSuccess).toBe(true);
            expect(result.value).not.toBeNull();
            expect(result.value!.name.toString()).toBe('Test World');
            expect(result.value!.tagline).toBe('A test tagline');
        });

        it('should save and retrieve a world (update)', async () => {
            const world = World.create({ name: 'Original' }).value;
            await worldRepository.save(world);

            world.rename('Updated');
            await worldRepository.save(world);

            const result = await worldRepository.findById(world.id);
            expect(result.value!.name.toString()).toBe('Updated');
        });

        it('should return null for non-existent ID', async () => {
            const result = await worldRepository.findById(EntityID.generate());

            expect(result.isSuccess).toBe(true);
            expect(result.value).toBeNull();
        });
    });

    describe('findAll', () => {
        it('should return all worlds ordered by modified_at DESC', async () => {
            const world1 = World.create({ name: 'World 1' }).value;
            const world2 = World.create({ name: 'World 2' }).value;
            const world3 = World.create({ name: 'World 3' }).value;

            await worldRepository.save(world1);
            await worldRepository.save(world2);
            await worldRepository.save(world3);

            // Update world1 to make it most recently modified
            world1.rename('World 1 Updated');
            await worldRepository.save(world1);

            const result = await worldRepository.findAll();

            expect(result.isSuccess).toBe(true);
            expect(result.value).toHaveLength(3);
            // Most recently modified should be first
            expect(result.value[0].name.toString()).toBe('World 1 Updated');
        });
    });

    describe('delete', () => {
        it('should remove a world', async () => {
            const world = World.create({ name: 'To Delete' }).value;
            await worldRepository.save(world);

            await worldRepository.delete(world.id);

            const result = await worldRepository.findById(world.id);
            expect(result.value).toBeNull();
        });

        it('should be idempotent (no error for non-existent)', async () => {
            const result = await worldRepository.delete(EntityID.generate());
            expect(result.isSuccess).toBe(true);
        });

        it('should cascade delete campaigns', async () => {
            const world = World.create({ name: 'World with Campaigns' }).value;
            await worldRepository.save(world);

            const campaign = Campaign.create({
                name: 'Campaign 1',
                worldID: world.id
            }).value;
            await campaignRepository.save(campaign);

            // Verify campaign exists
            const beforeDelete = await campaignRepository.findById(campaign.id);
            expect(beforeDelete.value).not.toBeNull();

            // Delete world
            await worldRepository.delete(world.id);

            // Campaign should also be deleted (cascade)
            const afterDelete = await campaignRepository.findById(campaign.id);
            expect(afterDelete.value).toBeNull();
        });
    });

    describe('exists', () => {
        it('should return true for existing world', async () => {
            const world = World.create({ name: 'Exists' }).value;
            await worldRepository.save(world);

            const result = await worldRepository.exists(world.id);

            expect(result.value).toBe(true);
        });

        it('should return false for non-existent world', async () => {
            const result = await worldRepository.exists(EntityID.generate());

            expect(result.value).toBe(false);
        });
    });
});