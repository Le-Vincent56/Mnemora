import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CreateContinuityUseCase } from './CreateContinuityUseCase';
import { SQLiteContinuityRepository } from '../../infrastructure/repositories/SQLiteContinuityRepository';
import { SQLiteWorldRepository } from '../../infrastructure/repositories/SQLiteWorldRepository';
import { DatabaseManager } from '../../infrastructure/database/DatabaseManager';
import { EventBus } from '../services/EventBus';
import { World } from '../../domain/entities/World';
import { Continuity } from '../../domain/entities/Continuity';
import { EntityID } from '../../domain/value-objects/EntityID';

describe('CreateContinuityUseCase', () => {
    let dbManager: DatabaseManager;
    let continuityRepo: SQLiteContinuityRepository;
    let worldRepo: SQLiteWorldRepository;
    let eventBus: EventBus;
    let useCase: CreateContinuityUseCase;
    let worldID: string;

    beforeEach(async () => {
        dbManager = new DatabaseManager({ filepath: ':memory:' });
        dbManager.initialize();
        continuityRepo = new SQLiteContinuityRepository(dbManager.getDatabase());
        worldRepo = new SQLiteWorldRepository(dbManager.getDatabase());
        eventBus = new EventBus();
        useCase = new CreateContinuityUseCase(continuityRepo, worldRepo, eventBus);

        // Create a world for tests
        const world = World.create({ name: 'Star Wars' }).value;
        await worldRepo.save(world);
        worldID = world.id.toString();
    });

    afterEach(() => {
        dbManager.close();
    });

    it('should create a continuity with valid inputs', async () => {
        const result = await useCase.execute({
            name: 'Default Timeline',
            worldID,
        });

        expect(result.isSuccess).toBe(true);
        expect(result.value.name).toBe('Default Timeline');
        expect(result.value.worldID).toBe(worldID);
        expect(result.value.branchedFromID).toBeNull();
    });

    it('should create a continuity with description', async () => {
        const result = await useCase.execute({
            name: 'Alt Timeline',
            worldID,
            description: 'What if Anakin resisted Palpatine?',
        });

        expect(result.isSuccess).toBe(true);
        expect(result.value.description).toBe('What if Anakin resisted Palpatine?');
    });

    it('should create a branched continuity', async () => {
        // Create parent continuity first
        const parent = Continuity.create({ name: 'Main', worldID: EntityID.fromStringOrThrow(worldID) }).value;
        await continuityRepo.save(parent);

        const result = await useCase.execute({
            name: 'Branch',
            worldID,
            branchedFromID: parent.id.toString(),
        });

        expect(result.isSuccess).toBe(true);
        expect(result.value.branchedFromID).toBe(parent.id.toString());
    });

    it('should reject empty name', async () => {
        const result = await useCase.execute({ name: '', worldID });
        expect(result.isFailure).toBe(true);
        expect(result.error.code).toContain('VALIDATION');
    });

    it('should reject missing worldID', async () => {
        const result = await useCase.execute({ name: 'Test', worldID: '' });
        expect(result.isFailure).toBe(true);
    });

    it('should reject non-existent world', async () => {
        const result = await useCase.execute({
            name: 'Test',
            worldID: EntityID.generate().toString(),
        });
        expect(result.isFailure).toBe(true);
        expect(result.error.code).toBe('NOT_FOUND');
    });

    it('should reject non-existent branchedFromID', async () => {
        const result = await useCase.execute({
            name: 'Test',
            worldID,
            branchedFromID: EntityID.generate().toString(),
        });
        expect(result.isFailure).toBe(true);
        expect(result.error.code).toBe('NOT_FOUND');
    });

    it('should persist the continuity', async () => {
        const result = await useCase.execute({ name: 'Persisted', worldID });
        expect(result.isSuccess).toBe(true);

        const found = await continuityRepo.findById(EntityID.fromStringOrThrow(result.value.id));
        expect(found.isSuccess).toBe(true);
        expect(found.value).not.toBeNull();
        expect(found.value!.name.toString()).toBe('Persisted');
    });
});