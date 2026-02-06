import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DeleteContinuityUseCase } from './DeleteContinuityUseCase';
import { SQLiteContinuityRepository } from '../../infrastructure/repositories/SQLiteContinuityRepository';
import { SQLiteCampaignRepository } from '../../infrastructure/repositories/SQLiteCampaignRepository';
import { SQLiteEntityRepository } from '../../infrastructure/repositories/SQLiteEntityRepository';
import { SQLiteWorldRepository } from '../../infrastructure/repositories/SQLiteWorldRepository';
import { DatabaseManager } from '../../infrastructure/database/DatabaseManager';
import { EventBus } from '../services/EventBus';
import { Continuity } from '../../domain/entities/Continuity';
import { Campaign } from '../../domain/entities/Campaign';
import { Event } from '../../domain/entities/Event';
import { World } from '../../domain/entities/World';
import { EntityID } from '../../domain/value-objects/EntityID';

describe('DeleteContinuityUseCase', () => {
    let dbManager: DatabaseManager;
    let continuityRepo: SQLiteContinuityRepository;
    let campaignRepo: SQLiteCampaignRepository;
    let entityRepo: SQLiteEntityRepository;
    let worldRepo: SQLiteWorldRepository;
    let eventBus: EventBus;
    let useCase: DeleteContinuityUseCase;
    let worldID: EntityID;

    beforeEach(async () => {
        dbManager = new DatabaseManager({ filepath: ':memory:' });
        dbManager.initialize();
        continuityRepo = new SQLiteContinuityRepository(dbManager.getDatabase());
        campaignRepo = new SQLiteCampaignRepository(dbManager.getDatabase());
        entityRepo = new SQLiteEntityRepository(dbManager.getDatabase());
        worldRepo = new SQLiteWorldRepository(dbManager.getDatabase());
        eventBus = new EventBus();
        useCase = new DeleteContinuityUseCase(continuityRepo, campaignRepo, entityRepo, eventBus);

        // Create a world for FK references
        const world = World.create({ name: 'Test World' }).value;
        await worldRepo.save(world);
        worldID = world.id;
    });

    afterEach(() => {
        dbManager.close();
    });

    it('should delete a continuity with no references', async () => {
        const continuity = Continuity.create({ name: 'Empty Timeline', worldID }).value;
        await continuityRepo.save(continuity);

        const result = await useCase.execute({ id: continuity.id.toString() });

        expect(result.isSuccess).toBe(true);

        const found = await continuityRepo.findById(continuity.id);
        expect(found.value).toBeNull();
    });

    it('should refuse deletion if events exist', async () => {
        const continuity = Continuity.create({ name: 'Timeline', worldID }).value;
        await continuityRepo.save(continuity);

        const event = Event.create({
            name: 'Battle',
            worldID,
            continuityID: continuity.id,
        }).value;
        await entityRepo.save(event);

        const result = await useCase.execute({ id: continuity.id.toString() });

        expect(result.isFailure).toBe(true);
        expect(result.error.code).toBe('CONFLICT');
        expect(result.error.message).toContain('event(s)');

        // Continuity should still exist
        const found = await continuityRepo.findById(continuity.id);
        expect(found.value).not.toBeNull();
    });

    it('should refuse deletion if campaigns reference it', async () => {
        const continuity = Continuity.create({ name: 'Timeline', worldID }).value;
        await continuityRepo.save(continuity);

        const campaign = Campaign.create({
            name: 'Campaign',
            worldID,
            continuityID: continuity.id,
        }).value;
        await campaignRepo.save(campaign);

        const result = await useCase.execute({ id: continuity.id.toString() });

        expect(result.isFailure).toBe(true);
        expect(result.error.code).toBe('CONFLICT');
        expect(result.error.message).toContain('campaign(s)');
    });

    it('should return NOT_FOUND for non-existent continuity', async () => {
        const result = await useCase.execute({ id: EntityID.generate().toString() });

        expect(result.isFailure).toBe(true);
        expect(result.error.code).toBe('NOT_FOUND');
    });

    it('should reject empty ID', async () => {
        const result = await useCase.execute({ id: '' });

        expect(result.isFailure).toBe(true);
        expect(result.error.code).toContain('VALIDATION');
    });

    it('should reject invalid ID format', async () => {
        const result = await useCase.execute({ id: 'not-a-uuid' });

        expect(result.isFailure).toBe(true);
    });
});