import { describe, it, expect } from 'vitest';
import { SafetyToolConfiguration } from './SafetyToolConfiguration';
import { SafetyToolType } from '../value-objects/SafetyToolType';
import { EntityID } from '../value-objects/EntityID';

describe('SafetyToolConfiguration', () => {
    describe('createForCampaign', () => {
        it('should create configuration with default tools', () => {
            const campaignId = EntityID.generate();
            const config = SafetyToolConfiguration.createForCampaign(campaignId);

            expect(config.campaignID.equals(campaignId)).toBe(true);
            expect(config.tools).toHaveLength(5); // 5 built-in tools
            expect(config.enabledTools).toHaveLength(0); // All disabled by default
        });

        it('should include all built-in tool types', () => {
            const config = SafetyToolConfiguration.createForCampaign(EntityID.generate());
            const types = config.tools.map(t => t.type);

            expect(types).toContain(SafetyToolType.LINES_AND_VEILS);
            expect(types).toContain(SafetyToolType.X_CARD);
            expect(types).toContain(SafetyToolType.STARS_AND_WISHES);
            expect(types).toContain(SafetyToolType.OPEN_DOOR);
            expect(types).toContain(SafetyToolType.SCRIPT_CHANGE);
        });
    });

    describe('enableTool / disableTool', () => {
        it('should enable a tool', () => {
            const config = SafetyToolConfiguration.createForCampaign(EntityID.generate());

            config.enableTool(SafetyToolType.X_CARD);

            const xCard = config.getTool(SafetyToolType.X_CARD);
            expect(xCard?.isEnabled).toBe(true);
            expect(config.enabledTools).toHaveLength(1);
        });

        it('should disable a tool', () => {
            const config = SafetyToolConfiguration.createForCampaign(EntityID.generate());
            config.enableTool(SafetyToolType.X_CARD);

            config.disableTool(SafetyToolType.X_CARD);

            const xCard = config.getTool(SafetyToolType.X_CARD);
            expect(xCard?.isEnabled).toBe(false);
        });

        it('should update modifiedAt when enabling', () => {
            const config = SafetyToolConfiguration.createForCampaign(EntityID.generate());
            const originalModified = config.modifiedAt;

            config.enableTool(SafetyToolType.X_CARD);

            expect(config.modifiedAt.getTime()).toBeGreaterThanOrEqual(originalModified.getTime());
        });
    });

    describe('hasStarsAndWishes / hasLinesAndVeils', () => {
        it('should return false when tools are disabled', () => {
            const config = SafetyToolConfiguration.createForCampaign(EntityID.generate());

            expect(config.hasStarsAndWishes()).toBe(false);
            expect(config.hasLinesAndVeils()).toBe(false);
        });

        it('should return true when tools are enabled', () => {
            const config = SafetyToolConfiguration.createForCampaign(EntityID.generate());
            config.enableTool(SafetyToolType.STARS_AND_WISHES);
            config.enableTool(SafetyToolType.LINES_AND_VEILS);

            expect(config.hasStarsAndWishes()).toBe(true);
            expect(config.hasLinesAndVeils()).toBe(true);
        });
    });

    describe('updateToolConfig', () => {
        it('should update Lines & Veils configuration', () => {
            const config = SafetyToolConfiguration.createForCampaign(EntityID.generate());

            config.updateToolConfig(SafetyToolType.LINES_AND_VEILS, {
                type: SafetyToolType.LINES_AND_VEILS,
                lines: ['Harm to children'],
                veils: ['Graphic violence']
            });

            const tool = config.getTool(SafetyToolType.LINES_AND_VEILS);
            expect(tool?.configuration).toEqual({
                type: SafetyToolType.LINES_AND_VEILS,
                lines: ['Harm to children'],
                veils: ['Graphic violence']
            });
        });
    });

    describe('addCustomTool / removeCustomTool', () => {
        it('should add a custom tool', () => {
            const config = SafetyToolConfiguration.createForCampaign(EntityID.generate());

            const result = config.addCustomTool(
                'Safe Word',
                'A code word to pause the game',
                'Say "pause" to stop'
            );

            expect(result.isSuccess).toBe(true);
            expect(config.tools).toHaveLength(6);

            const customTool = config.tools.find(t => t.type === SafetyToolType.CUSTOM);
            expect(customTool).toBeDefined();
            expect(customTool?.name.toString()).toBe('Safe Word');
            expect(customTool?.isEnabled).toBe(true);
        });

        it('should remove a custom tool', () => {
            const config = SafetyToolConfiguration.createForCampaign(EntityID.generate());
            config.addCustomTool('Safe Word', 'Description', 'Quick ref');

            const customTool = config.tools.find(t => t.type === SafetyToolType.CUSTOM);
            expect(customTool).toBeDefined();

            config.removeCustomTool(customTool!.customId!);

            expect(config.tools).toHaveLength(5);
            expect(config.tools.find(t => t.type === SafetyToolType.CUSTOM)).toBeUndefined();
        });

        it('should reject empty name', () => {
            const config = SafetyToolConfiguration.createForCampaign(EntityID.generate());

            const result = config.addCustomTool('', 'Description', 'Quick ref');

            expect(result.isFailure).toBe(true);
        });
    });
});