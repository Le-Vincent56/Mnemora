import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SQLiteSearchRepository } from './SQLiteSearchRepository';
import { SQLiteEntityRepository } from './SQLiteEntityRepository';
import { DatabaseManager } from '../database/DatabaseManager';
import { Character } from '../../domain/entities/Character';
import { Location } from '../../domain/entities/Location';
import { EntityID } from '../../domain/value-objects/EntityID';
import { SearchMode } from '../../domain/repositories/ISearchRepository';

describe('SQLiteSearchRepository', () => {
    let dbManager: DatabaseManager;
    let entityRepo: SQLiteEntityRepository;
    let searchRepo: SQLiteSearchRepository;
    let worldID: EntityID;
    let campaignID: EntityID;

    beforeEach(async () => {
        dbManager = new DatabaseManager({ filepath: ':memory:' });
        dbManager.initialize();

        const db = dbManager.getDatabase();
        entityRepo = new SQLiteEntityRepository(db);
        searchRepo = new SQLiteSearchRepository(db);

        worldID = EntityID.generate();
        campaignID = EntityID.generate();

        // Seed test data
        const grimnak = Character.create({ name: 'Grimnak Ironbeard', worldID }).value;
        grimnak.updateDescription('A grumpy dwarf bartender who runs the Rusty Tankard tavern');
        grimnak.setTags(['npc', 'dwarf', 'bartender']);

        const elara = Character.create({ name: 'Elara Nightwhisper', worldID }).value;
        elara.updateDescription('An elven ranger who guards the forest');
        elara.setTags(['npc', 'elf', 'ranger']);

        const tavern = Location.create({ name: 'The Rusty Tankard', worldID }).value;
        tavern.updateDescription('A popular tavern in the merchant district');
        tavern.setTags(['tavern', 'merchant-district']);

        await entityRepo.saveMany([grimnak, elara, tavern]);
    });

    afterEach(() => {
        dbManager.close();
    });

    describe('natural search', () => {
        it('should find entities by name', async () => {
            const result = await searchRepo.search({
                raw: 'Grimnak',
                mode: SearchMode.NATURAL,
                worldID,
                limit: 10,
                offset: 0,
            });

            expect(result.isSuccess).toBe(true);
            expect(result.value.results.length).toBeGreaterThan(0);
            expect(result.value.results[0].entity.type).toBe('character');
        });

        it('should find entities by description content', async () => {
            const result = await searchRepo.search({
                raw: 'dwarf bartender',
                mode: SearchMode.NATURAL,
                worldID,
                limit: 10,
                offset: 0,
            });

            expect(result.value.results.length).toBeGreaterThan(0);
            const names = result.value.results.map(r =>
                (r.entity as Character).name.toString()
            );
            expect(names).toContain('Grimnak Ironbeard');
        });

        it('should find entities by tag', async () => {
            const result = await searchRepo.search({
                raw: 'elf',
                mode: SearchMode.NATURAL,
                worldID,
                limit: 10,
                offset: 0,
            });

            expect(result.value.results.length).toBeGreaterThan(0);
        });

        it('should return results with relevance scores', async () => {
            const result = await searchRepo.search({
                raw: 'tavern',
                mode: SearchMode.NATURAL,
                worldID,
                limit: 10,
                offset: 0,
            });

            expect(result.value.results.every(r => typeof r.score === 'number')).toBe(true);
        });

        it('should measure query time', async () => {
            const result = await searchRepo.search({
                raw: 'test',
                mode: SearchMode.NATURAL,
                worldID,
                limit: 10,
                offset: 0,
            });

            expect(result.value.queryTimeMs).toBeGreaterThanOrEqual(0);
        });
    });

    describe('search scoping', () => {
        it('should only return entities from specified world', async () => {
            const otherWorld = EntityID.generate();
            const otherChar = Character.create({
                name: 'Other World Character',
                worldID: otherWorld
            }).value;
            await entityRepo.save(otherChar);

            const result = await searchRepo.search({
                raw: 'Character',
                mode: SearchMode.NATURAL,
                worldID, // Search in original world
                limit: 10,
                offset: 0,
            });

            const worldIDs = result.value.results.map(r =>
                (r.entity as Character).worldID.toString()
            );
            expect(worldIDs.every(id => id === worldID.toString())).toBe(true);
        });
    });

    describe('pagination', () => {
        it('should paginate results', async () => {
            for (let i = 0; i < 5; i++) {
                const char = Character.create({ name: `Test Character ${i}`, worldID }).value;
                char.updateDescription('A test character for pagination');
                await entityRepo.save(char);
            }

            const page1 = await searchRepo.search({
                raw: 'test',
                mode: SearchMode.NATURAL,
                worldID,
                limit: 2,
                offset: 0,
            });

            const page2 = await searchRepo.search({
                raw: 'test',
                mode: SearchMode.NATURAL,
                worldID,
                limit: 2,
                offset: 2,
            });

            expect(page1.value.results).toHaveLength(2);
            expect(page2.value.results).toHaveLength(2);
            expect(page1.value.hasMore).toBe(true);
        });

        it('should report total count accurately', async () => {
            const result = await searchRepo.search({
                raw: 'npc',
                mode: SearchMode.NATURAL,
                worldID,
                limit: 1,
                offset: 0,
            });

            expect(result.value.total).toBe(2); // Grimnak and Elara
            expect(result.value.hasMore).toBe(true);
        });
    });

    describe('empty results', () => {
        it('should return empty results for no matches', async () => {
            const result = await searchRepo.search({
                raw: 'xyznonexistent',
                mode: SearchMode.NATURAL,
                worldID,
                limit: 10,
                offset: 0,
            });

            expect(result.isSuccess).toBe(true);
            expect(result.value.results).toHaveLength(0);
            expect(result.value.total).toBe(0);
        });
    });

    describe('FTS sync via triggers', () => {
        it('should find newly added entities', async () => {
            const newChar = Character.create({ name: 'Brandnew Testcharacter', worldID }).value;
            await entityRepo.save(newChar);

            const result = await searchRepo.search({
                raw: 'Brandnew',
                mode: SearchMode.NATURAL,
                worldID,
                limit: 10,
                offset: 0,
            });

            expect(result.value.results.length).toBe(1);
        });

        it('should find updated content', async () => {
            const char = Character.create({ name: 'UpdateTest', worldID }).value;
            await entityRepo.save(char);

            char.updateDescription('Unique search term xyzabc123');
            await entityRepo.save(char);

            const result = await searchRepo.search({
                raw: 'xyzabc123',
                mode: SearchMode.NATURAL,
                worldID,
                limit: 10,
                offset: 0,
            });

            expect(result.value.results.length).toBe(1);
        });

        it('should not find deleted entities', async () => {
            const char = Character.create({ name: 'ToBeDeleted', worldID }).value;
            await entityRepo.save(char);

            await entityRepo.delete(char.id);

            const result = await searchRepo.search({
                raw: 'ToBeDeleted',
                mode: SearchMode.NATURAL,
                worldID,
                limit: 10,
                offset: 0,
            });

            expect(result.value.results.length).toBe(0);
        });
    });
});