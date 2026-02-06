import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ListContinuitiesUseCase } from './ListContinuitiesUseCase';
import { SQLiteContinuityRepository } from '../../infrastructure/repositories/SQLiteContinuityRepository';
import { SQLiteWorldRepository } from '../../infrastructure/repositories/SQLiteWorldRepository';
import { DatabaseManager } from '../../infrastructure/database/DatabaseManager';
import { Continuity } from '../../domain/entities/Continuity';
import { World } from '../../domain/entities/World';
import { EntityID } from '../../domain/value-objects/EntityID';

describe('ListContinuitiesUseCase', () => {
    let dbManager: DatabaseManager;
    let repo: SQLiteContinuityRepository;
    let useCase: ListContinuitiesUseCase;
    let worldID: EntityID;

    beforeEach(async () => {
        dbManager = new DatabaseManager({ filepath: ':memory:' });
        dbManager.initialize();
        const db = dbManager.getDatabase();
        repo = new SQLiteContinuityRepository(db);
        useCase = new ListContinuitiesUseCase(repo);

        const world = World.create({ name: 'Test World' }).value;
        await new SQLiteWorldRepository(db).save(world);
        worldID = world.id;
    });

    afterEach(() => {
        dbManager.close();
    });

    it('should return all continuities for a world', async () => {
        const c1 = Continuity.create({ name: 'Timeline A', worldID }).value;
        const c2 = Continuity.create({ name: 'Timeline B', worldID }).value;
        await repo.save(c1);
        await repo.save(c2);

        const result = await useCase.execute({ worldID: worldID.toString() });

        expect(result.isSuccess).toBe(true);
        expect(result.value).toHaveLength(2);
    });

    it('should return empty array when no continuities exist', async () => {
        const result = await useCase.execute({ worldID: worldID.toString() });

        expect(result.isSuccess).toBe(true);
        expect(result.value).toEqual([]);
    });

    it('should not return continuities from other worlds', async () => {
        const otherWorld = World.create({ name: 'Other World' }).value;
        await new SQLiteWorldRepository(dbManager.getDatabase()).save(otherWorld);
        const c = Continuity.create({ name: 'Other', worldID: otherWorld.id }).value;
        await repo.save(c);

        const result = await useCase.execute({ worldID: worldID.toString() });

        expect(result.isSuccess).toBe(true);
        expect(result.value).toHaveLength(0);
    });

    it('should reject empty worldID', async () => {
        const result = await useCase.execute({ worldID: '' });

        expect(result.isFailure).toBe(true);
        expect(result.error.code).toContain('VALIDATION');
    });
});