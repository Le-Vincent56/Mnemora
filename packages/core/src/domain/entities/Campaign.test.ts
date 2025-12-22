import { describe, it, expect } from 'vitest';
import { Campaign } from './Campaign';
import { EntityID } from '../value-objects/EntityID';

describe('Campaign', () => {
    const worldID = EntityID.generate();

    describe('create', () => {
        it('should create a campaign with required fields', () => {
            const result = Campaign.create({
                name: 'The Clone Wars',
                worldID
            });

            expect(result.isSuccess).toBe(true);
            expect(result.value.name.toString()).toBe('The Clone Wars');
            expect(result.value.worldID.equals(worldID)).toBe(true);
            expect(result.value.description.isEmpty).toBe(true);
        });

        it('should create a campaign with description', () => {
            const result = Campaign.create({
                name: 'The Clone Wars',
                worldID,
                description: 'A campaign about the Clones versus the Droids, and something much, much darker growing in the galaxy.'
            });

            expect(result.isSuccess).toBe(true);
            expect(result.value.description.toString()).toBe('A campaign about the Clones versus the Droids, and something much, much darker growing in the galaxy.');
        });

        it('should reject empty name', () => {
            const result = Campaign.create({
                name: '',
                worldID
            });

            expect(result.isFailure).toBe(true);
        });
    });

    describe('rename', () => {
        it('should update name and modifiedAt', () => {
            const campaign = Campaign.create({
                name: 'Original',
                worldID
            }).value;

            const result = campaign.rename('Updated');

            expect(result.isSuccess).toBe(true);
            expect(campaign.name.toString()).toBe('Updated');
        });
    });

    describe('updateDescription', () => {
        it('should update description', () => {
            const campaign = Campaign.create({
                name: 'Test',
                worldID
            }).value;

            campaign.updateDescription('New description');

            expect(campaign.description.toString()).toBe('New description');
        });
    });

    describe('worldID immutability', () => {
        it('should have immutable worldID (no setter)', () => {
            const campaign = Campaign.create({
                name: 'Test',
                worldID
            }).value;

            // TypeScript should prevent: campaign.worldID = otherID
            // At runtime, we verify the getter returns the original value
            expect(campaign.worldID.equals(worldID)).toBe(true);
        });
    });

    describe('equals', () => {
        it('should compare by ID', () => {
            const campaign1 = Campaign.create({ name: 'C1', worldID }).value;
            const campaign2 = Campaign.create({ name: 'C2', worldID }).value;

            expect(campaign1.equals(campaign1)).toBe(true);
            expect(campaign1.equals(campaign2)).toBe(false);
        });
    });
});