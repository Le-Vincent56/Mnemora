import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SQLiteSafetyToolRepository } from './SQLiteSafetyToolRepository';
import { SQLiteWorldRepository } from './SQLiteWorldRepository';
import { SQLiteCampaignRepository } from './SQLiteCampaignRepository';
import { DatabaseManager } from '../database/DatabaseManager';
import { SafetyToolConfiguration } from '../../domain/entities/SafetyToolConfiguration';
import { SafetyToolType } from '../../domain/value-objects/SafetyToolType';
import { World } from '../../domain/entities/World';
import { Campaign } from '../../domain/entities/Campaign';
import { EntityID } from '../../domain/value-objects/EntityID';

describe('SQLiteSafetyToolRepository', () => {
    let dbManager: DatabaseManager;
    let safetyToolRepository: SQLiteSafetyToolRepository;
    let worldRepository: SQLiteWorldRepository;
    let campaignRepository: SQLiteCampaignRepository;
    let testWorld: World;
    let testCampaign: Campaign;

    beforeEach(async () => {
        dbManager = new DatabaseManager({ filepath: ':memory:' });
        dbManager.initialize();

        safetyToolRepository = new SQLiteSafetyToolRepository(dbManager.getDatabase());
        worldRepository = new SQLiteWorldRepository(dbManager.getDatabase());
        campaignRepository = new SQLiteCampaignRepository(dbManager.getDatabase());

        // Create test world and campaign
        testWorld = World.create({ name: 'Test World' }).value;
        await worldRepository.save(testWorld);

        testCampaign = Campaign.create({
            name: 'Test Campaign',
            worldID: testWorld.id
        }).value;
        await campaignRepository.save(testCampaign);
    });

    afterEach(() => {
        dbManager.close();
    });

    describe('save and findById', () => {
        it('should save and retrieve a configuration', async () => {
            const config = SafetyToolConfiguration.createForCampaign(testCampaign.id);

            await safetyToolRepository.save(config);
            const result = await safetyToolRepository.findById(config.id);

            expect(result.isSuccess).toBe(true);
            expect(result.value).not.toBeNull();
            expect(result.value!.campaignID.equals(testCampaign.id)).toBe(true);
            expect(result.value!.tools).toHaveLength(5);
        });

        it('should preserve enabled state', async () => {
            const config = SafetyToolConfiguration.createForCampaign(testCampaign.id);
            config.enableTool(SafetyToolType.X_CARD);
            config.enableTool(SafetyToolType.OPEN_DOOR);

            await safetyToolRepository.save(config);
            const result = await safetyToolRepository.findById(config.id);

            expect(result.value!.enabledTools).toHaveLength(2);
            expect(result.value!.getTool(SafetyToolType.X_CARD)?.isEnabled).toBe(true);
            expect(result.value!.getTool(SafetyToolType.OPEN_DOOR)?.isEnabled).toBe(true);
        });

        it('should preserve tool configuration', async () => {
            const config = SafetyToolConfiguration.createForCampaign(testCampaign.id);
            config.updateToolConfig(SafetyToolType.LINES_AND_VEILS, {
                type: SafetyToolType.LINES_AND_VEILS,
                lines: ['Line 1', 'Line 2'],
                veils: ['Veil 1']
            });

            await safetyToolRepository.save(config);
            const result = await safetyToolRepository.findById(config.id);

            const linesAndVeils = result.value!.getTool(SafetyToolType.LINES_AND_VEILS);
            expect(linesAndVeils?.configuration).toEqual({
                type: SafetyToolType.LINES_AND_VEILS,
                lines: ['Line 1', 'Line 2'],
                veils: ['Veil 1']
            });
        });

        it('should return null for non-existent ID', async () => {
            const result = await safetyToolRepository.findById(EntityID.generate());

            expect(result.isSuccess).toBe(true);
            expect(result.value).toBeNull();
        });
    });

    describe('findByCampaignId', () => {
        it('should find configuration by campaign ID', async () => {
            const config = SafetyToolConfiguration.createForCampaign(testCampaign.id);
            await safetyToolRepository.save(config);

            const result = await safetyToolRepository.findByCampaignId(testCampaign.id);

            expect(result.isSuccess).toBe(true);
            expect(result.value).not.toBeNull();
            expect(result.value!.id.equals(config.id)).toBe(true);
        });

        it('should return null for campaign without configuration', async () => {
            const result = await safetyToolRepository.findByCampaignId(testCampaign.id);

            expect(result.isSuccess).toBe(true);
            expect(result.value).toBeNull();
        });
    });

    describe('delete', () => {
        it('should remove a configuration', async () => {
            const config = SafetyToolConfiguration.createForCampaign(testCampaign.id);
            await safetyToolRepository.save(config);

            await safetyToolRepository.delete(config.id);

            const result = await safetyToolRepository.findById(config.id);
            expect(result.value).toBeNull();
        });

        it('should be idempotent', async () => {
            const result = await safetyToolRepository.delete(EntityID.generate());
            expect(result.isSuccess).toBe(true);
        });
    });

    describe('deleteByCampaignId', () => {
        it('should remove configuration by campaign ID', async () => {
            const config = SafetyToolConfiguration.createForCampaign(testCampaign.id);
            await safetyToolRepository.save(config);

            await safetyToolRepository.deleteByCampaignId(testCampaign.id);

            const result = await safetyToolRepository.findByCampaignId(testCampaign.id);
            expect(result.value).toBeNull();
        });
    });

    describe('existsForCampaign', () => {
        it('should return true when configuration exists', async () => {
            const config = SafetyToolConfiguration.createForCampaign(testCampaign.id);
            await safetyToolRepository.save(config);

            const result = await safetyToolRepository.existsForCampaign(testCampaign.id);

            expect(result.value).toBe(true);
        });

        it('should return false when configuration does not exist', async () => {
            const result = await safetyToolRepository.existsForCampaign(testCampaign.id);

            expect(result.value).toBe(false);
        });
    });

    describe('cascade delete', () => {
        it('should delete configuration when campaign is deleted', async () => {
            const config = SafetyToolConfiguration.createForCampaign(testCampaign.id);
            await safetyToolRepository.save(config);

            // Verify config exists
            const beforeDelete = await safetyToolRepository.findById(config.id);
            expect(beforeDelete.value).not.toBeNull();

            // Delete campaign
            await campaignRepository.delete(testCampaign.id);

            // Config should be cascade deleted
            const afterDelete = await safetyToolRepository.findById(config.id);
            expect(afterDelete.value).toBeNull();
        });
    });

    describe('custom tools', () => {
        it('should persist custom tools', async () => {
            const config = SafetyToolConfiguration.createForCampaign(testCampaign.id);
            config.addCustomTool('My Safety Tool', 'Custom description', 'Quick reference');

            await safetyToolRepository.save(config);
            const result = await safetyToolRepository.findById(config.id);

            expect(result.value!.tools).toHaveLength(6);
            const customTool = result.value!.tools.find(t => t.type === SafetyToolType.CUSTOM);
            expect(customTool).toBeDefined();
            expect(customTool?.name.toString()).toBe('My Safety Tool');
        });
    });
});