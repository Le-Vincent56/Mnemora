import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SQLiteCampaignRepository } from './SQLiteCampaignRepository';
import { SQLiteWorldRepository } from './SQLiteWorldRepository';
import { DatabaseManager } from '../database/DatabaseManager';
import { Campaign } from '../../domain/entities/Campaign';
import { World } from '../../domain/entities/World';
import { EntityID } from '../../domain/value-objects/EntityID';

describe('SQLiteCampaignRepository', () => {
    let dbManager: DatabaseManager;
    let campaignRepository: SQLiteCampaignRepository;
    let worldRepository: SQLiteWorldRepository;
    let worldID: EntityID;

    beforeEach(async () => {
        dbManager = new DatabaseManager({ filepath: ':memory:' });
        dbManager.initialize();
        campaignRepository = new SQLiteCampaignRepository(dbManager.getDatabase());
        worldRepository = new SQLiteWorldRepository(dbManager.getDatabase());

        // Create a world for campaigns
        const world = World.create({ name: 'Test World' }).value;
        await worldRepository.save(world);
        worldID = world.id;
    });

    afterEach(() => {
        dbManager.close();
    });

    describe('save and findById', () => {
        it('should save and retrieve a campaign', async () => {
            const campaign = Campaign.create({
                name: 'Test Campaign',
                worldID,
                description: 'A test description'
            }).value;

            await campaignRepository.save(campaign);
            const result = await campaignRepository.findById(campaign.id);

            expect(result.isSuccess).toBe(true);
            expect(result.value).not.toBeNull();
            expect(result.value!.name.toString()).toBe('Test Campaign');
            expect(result.value!.description.toString()).toBe('A test description');
        });

        it('should return null for non-existent ID', async () => {
            const result = await campaignRepository.findById(EntityID.generate());

            expect(result.isSuccess).toBe(true);
            expect(result.value).toBeNull();
        });
    });

    describe('findByWorld', () => {
        it('should return only campaigns for that world', async () => {
            // Create another world
            const otherWorld = World.create({ name: 'Other World' }).value;
            await worldRepository.save(otherWorld);

            const campaign1 = Campaign.create({ name: 'Campaign 1', worldID }).value;
            const campaign2 = Campaign.create({ name: 'Campaign 2', worldID }).value;
            const otherCampaign = Campaign.create({
                name: 'Other Campaign',
                worldID: otherWorld.id
            }).value;

            await campaignRepository.save(campaign1);
            await campaignRepository.save(campaign2);
            await campaignRepository.save(otherCampaign);

            const result = await campaignRepository.findByWorld(worldID);

            expect(result.isSuccess).toBe(true);
            expect(result.value).toHaveLength(2);
            expect(result.value.every(c => c.worldID.equals(worldID))).toBe(true);
        });

        it('should order by modified_at DESC', async () => {
            const campaign1 = Campaign.create({ name: 'Campaign 1', worldID }).value;
            const campaign2 = Campaign.create({ name: 'Campaign 2', worldID }).value;

            await campaignRepository.save(campaign1);
            await campaignRepository.save(campaign2);

            // Update campaign1 to make it most recently modified
            campaign1.rename('Campaign 1 Updated');
            await campaignRepository.save(campaign1);

            const result = await campaignRepository.findByWorld(worldID);

            expect(result.value[0].name.toString()).toBe('Campaign 1 Updated');
        });
    });

    describe('findAll', () => {
        it('should return all campaigns', async () => {
            const campaign1 = Campaign.create({ name: 'Campaign 1', worldID }).value;
            const campaign2 = Campaign.create({ name: 'Campaign 2', worldID }).value;

            await campaignRepository.save(campaign1);
            await campaignRepository.save(campaign2);

            const result = await campaignRepository.findAll();

            expect(result.isSuccess).toBe(true);
            expect(result.value).toHaveLength(2);
        });
    });

    describe('save (update)', () => {
        it('should update existing campaign', async () => {
            const campaign = Campaign.create({
                name: 'Original',
                worldID
            }).value;
            await campaignRepository.save(campaign);

            campaign.rename('Updated');
            campaign.updateDescription('New description');
            await campaignRepository.save(campaign);

            const result = await campaignRepository.findById(campaign.id);
            expect(result.value!.name.toString()).toBe('Updated');
            expect(result.value!.description.toString()).toBe('New description');
        });
    });

    describe('delete', () => {
        it('should remove a campaign', async () => {
            const campaign = Campaign.create({
                name: 'To Delete',
                worldID
            }).value;
            await campaignRepository.save(campaign);

            await campaignRepository.delete(campaign.id);

            const result = await campaignRepository.findById(campaign.id);
            expect(result.value).toBeNull();
        });

        it('should be idempotent', async () => {
            const result = await campaignRepository.delete(EntityID.generate());
            expect(result.isSuccess).toBe(true);
        });
    });

    describe('countByWorld', () => {
        it('should return correct count', async () => {
            const campaign1 = Campaign.create({ name: 'Campaign 1', worldID }).value;
            const campaign2 = Campaign.create({ name: 'Campaign 2', worldID }).value;

            await campaignRepository.save(campaign1);
            await campaignRepository.save(campaign2);

            const result = await campaignRepository.countByWorld(worldID);

            expect(result.isSuccess).toBe(true);
            expect(result.value).toBe(2);
        });

        it('should return 0 for world with no campaigns', async () => {
            const emptyWorld = World.create({ name: 'Empty' }).value;
            await worldRepository.save(emptyWorld);

            const result = await campaignRepository.countByWorld(emptyWorld.id);

            expect(result.value).toBe(0);
        });
    });

    describe('exists', () => {
        it('should return true for existing campaign', async () => {
            const campaign = Campaign.create({ name: 'Exists', worldID }).value;
            await campaignRepository.save(campaign);

            const result = await campaignRepository.exists(campaign.id);

            expect(result.value).toBe(true);
        });

        it('should return false for non-existent campaign', async () => {
            const result = await campaignRepository.exists(EntityID.generate());

            expect(result.value).toBe(false);
        });
    });
});