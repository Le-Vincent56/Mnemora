import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { UpdateContinuityUseCase } from './UpdateContinuityUseCase';
import { SQLiteContinuityRepository } from '../../infrastructure/repositories/SQLiteContinuityRepository';
import { SQLiteWorldRepository } from '../../infrastructure/repositories/SQLiteWorldRepository';
import { DatabaseManager } from '../../infrastructure/database/DatabaseManager';
import { EventBus } from '../services/EventBus';
import { Continuity } from '../../domain/entities/Continuity';
import { World } from '../../domain/entities/World';
import { EntityID } from '../../domain/value-objects/EntityID';

describe('UpdateContinuityUseCase', () => {
    let dbManager: DatabaseManager;
    let repo: SQLiteContinuityRepository;
    let eventBus: EventBus;
    let useCase: UpdateContinuityUseCase;
    let worldID: EntityID;

    beforeEach(async () => {
        dbManager = new DatabaseManager({ filepath: ':memory:' });
        dbManager.initialize();
        const db = dbManager.getDatabase();
        repo = new SQLiteContinuityRepository(db);
        eventBus = new EventBus();
        useCase = new UpdateContinuityUseCase(repo, eventBus);

        const world = World.create({ name: 'Test World' }).value;
        await new SQLiteWorldRepository(db).save(world);
        worldID = world.id;
    });

    afterEach(() => {
        dbManager.close();
    });

    it('should update name', async () => {
        const continuity = Continuity.create({ name: 'Original', worldID }).value;
        await repo.save(continuity);

        const result = await useCase.execute({
            id: continuity.id.toString(),
            name: 'Updated Name',
        });

        expect(result.isSuccess).toBe(true);
        expect(result.value.name).toBe('Updated Name');
    });

    it('should update description', async () => {
        const continuity = Continuity.create({ name: 'Test', worldID }).value;
        await repo.save(continuity);

        const result = await useCase.execute({
            id: continuity.id.toString(),
            description: 'New description',
        });

        expect(result.isSuccess).toBe(true);
        expect(result.value.description).toBe('New description');
    });

    it('should update both name and description', async () => {
        const continuity = Continuity.create({ name: 'Original', worldID }).value;
        await repo.save(continuity);

        const result = await useCase.execute({
            id: continuity.id.toString(),
            name: 'New Name',
            description: 'New Desc',
        });

        expect(result.isSuccess).toBe(true);
        expect(result.value.name).toBe('New Name');
        expect(result.value.description).toBe('New Desc');
    });

    it('should return current state when no changes are provided', async () => {
        const continuity = Continuity.create({ name: 'Unchanged', worldID }).value;
        await repo.save(continuity);

        const result = await useCase.execute({
            id: continuity.id.toString(),
        });

        expect(result.isSuccess).toBe(true);
        expect(result.value.name).toBe('Unchanged');
    });

    it('should persist changes', async () => {
        const continuity = Continuity.create({ name: 'Original', worldID }).value;
        await repo.save(continuity);

        await useCase.execute({
            id: continuity.id.toString(),
            name: 'Persisted',
        });

        const found = await repo.findById(continuity.id);
        expect(found.value!.name.toString()).toBe('Persisted');
    });

    it('should reject empty ID', async () => {
        const result = await useCase.execute({ id: '' });
        expect(result.isFailure).toBe(true);
    });

    it('should return NOT_FOUND for non-existent continuity', async () => {
        const result = await useCase.execute({
            id: EntityID.generate().toString(),
            name: 'New',
        });
        expect(result.isFailure).toBe(true);
        expect(result.error.code).toBe('NOT_FOUND');
    });

    it('should reject empty name', async () => {
        const continuity = Continuity.create({ name: 'Original', worldID }).value;
        await repo.save(continuity);

        const result = await useCase.execute({
            id: continuity.id.toString(),
            name: '',
        });

        expect(result.isFailure).toBe(true);
        expect(result.error.code).toContain('VALIDATION');
    });
});