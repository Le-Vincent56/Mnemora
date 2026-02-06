import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { GetContinuityUseCase } from './GetContinuityUseCase';
import { SQLiteContinuityRepository } from '../../infrastructure/repositories/SQLiteContinuityRepository';
import { DatabaseManager } from '../../infrastructure/database/DatabaseManager';
import { Continuity } from '../../domain/entities/Continuity';
import { EntityID } from '../../domain/value-objects/EntityID';

describe('GetContinuityUseCase', () => {
    let dbManager: DatabaseManager;
    let repo: SQLiteContinuityRepository;
    let useCase: GetContinuityUseCase;

    beforeEach(() => {
        dbManager = new DatabaseManager({ filepath: ':memory:' });
        dbManager.initialize();
        repo = new SQLiteContinuityRepository(dbManager.getDatabase());
        useCase = new GetContinuityUseCase(repo);
    });

    afterEach(() => {
        dbManager.close();
    });

    it('should return a continuity by ID', async () => {
        const continuity = Continuity.create({
            name: 'Main Timeline',
            worldID: EntityID.generate(),
        }).value;
        await repo.save(continuity);

        const result = await useCase.execute({ id: continuity.id.toString() });

        expect(result.isSuccess).toBe(true);
        expect(result.value.name).toBe('Main Timeline');
        expect(result.value.id).toBe(continuity.id.toString());
    });

    it('should return NOT_FOUND for non-existent ID', async () => {
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