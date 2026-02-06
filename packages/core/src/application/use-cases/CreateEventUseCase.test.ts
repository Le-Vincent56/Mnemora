import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CreateEventUseCase } from './CreateEventUseCase';
import { SQLiteEntityRepository } from '../../infrastructure/repositories/SQLiteEntityRepository';
import { SQLiteContinuityRepository } from '../../infrastructure/repositories/SQLiteContinuityRepository';
import { DatabaseManager } from '../../infrastructure/database/DatabaseManager';
import { EventBus } from '../services/EventBus';
import { Continuity } from '../../domain/entities/Continuity';
import { EntityID } from '../../domain/value-objects/EntityID';
import { EntityType } from '../../domain/entities/EntityType';

describe('CreateEventUseCase', () => {
    let dbManager: DatabaseManager;
    let entityRepo: SQLiteEntityRepository;
    let continuityRepo: SQLiteContinuityRepository;
    let eventBus: EventBus;
    let useCase: CreateEventUseCase;
    let worldID: EntityID;
    let continuityID: string;

    beforeEach(async () => {
        dbManager = new DatabaseManager({ filepath: ':memory:' });
        dbManager.initialize();
        entityRepo = new SQLiteEntityRepository(dbManager.getDatabase());
        continuityRepo = new SQLiteContinuityRepository(dbManager.getDatabase());
        eventBus = new EventBus();
        useCase = new CreateEventUseCase(entityRepo, continuityRepo, eventBus);

        worldID = EntityID.generate();
        const continuity = Continuity.create({ name: 'Main', worldID }).value;
        await continuityRepo.save(continuity);
        continuityID = continuity.id.toString();
    });

    afterEach(() => {
        dbManager.close();
    });

    it('should create an event with valid inputs', async () => {
        const result = await useCase.execute({
            name: 'The Battle of Five Armies',
            worldID: worldID.toString(),
            continuityID,
        });

        expect(result.isSuccess).toBe(true);
        expect(result.value.name).toBe('The Battle of Five Armies');
        expect(result.value.type).toBe(EntityType.EVENT);
        expect(result.value.continuityID).toBe(continuityID);
    });

    it('should create an event with description and secrets', async () => {
        const result = await useCase.execute({
            name: 'Event',
            worldID: worldID.toString(),
            continuityID,
            description: 'A great battle',
            secrets: 'Secret plan',
        });

        expect(result.isSuccess).toBe(true);
        expect(result.value.description).toBe('A great battle');
        expect(result.value.secrets).toBe('Secret plan');
    });

    it('should create an event with tags', async () => {
        const result = await useCase.execute({
            name: 'Event',
            worldID: worldID.toString(),
            continuityID,
            tags: ['combat', 'pivotal'],
        });

        expect(result.isSuccess).toBe(true);
        expect(result.value.tags).toEqual(['combat', 'pivotal']);
    });

    it('should reject empty name', async () => {
        const result = await useCase.execute({
            name: '',
            worldID: worldID.toString(),
            continuityID,
        });
        expect(result.isFailure).toBe(true);
    });

    it('should reject missing worldID', async () => {
        const result = await useCase.execute({
            name: 'Test',
            worldID: '',
            continuityID,
        });
        expect(result.isFailure).toBe(true);
    });

    it('should reject missing continuityID', async () => {
        const result = await useCase.execute({
            name: 'Test',
            worldID: worldID.toString(),
            continuityID: '',
        });
        expect(result.isFailure).toBe(true);
    });

    it('should reject non-existent continuity', async () => {
        const result = await useCase.execute({
            name: 'Test',
            worldID: worldID.toString(),
            continuityID: EntityID.generate().toString(),
        });
        expect(result.isFailure).toBe(true);
        expect(result.error.code).toBe('NOT_FOUND');
    });

    it('should persist the event', async () => {
        const result = await useCase.execute({
            name: 'Persisted Event',
            worldID: worldID.toString(),
            continuityID,
        });
        expect(result.isSuccess).toBe(true);

        const found = await entityRepo.findByID(EntityID.fromStringOrThrow(result.value.id));
        expect(found.isSuccess).toBe(true);
        expect(found.value).not.toBeNull();
        expect(found.value!.type).toBe(EntityType.EVENT);
    });
});