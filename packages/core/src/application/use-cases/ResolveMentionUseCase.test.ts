import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ResolveMentionUseCase } from './ResolveMentionUseCase';
import { SQLiteEntityRepository } from '../../infrastructure/repositories/SQLiteEntityRepository';
import { DatabaseManager } from '../../infrastructure/database/DatabaseManager';
import { Character } from '../../domain/entities/Character';
import { Location } from '../../domain/entities/Location';
import { Faction } from '../../domain/entities/Faction';
import { EntityID } from '../../domain/value-objects/EntityID';
import { EntityType } from '../../domain/entities/EntityType';

describe('ResolveMentionUseCase', () => {
    let dbManager: DatabaseManager;
    let repository: SQLiteEntityRepository;
    let useCase: ResolveMentionUseCase;
    let worldID: EntityID;
    let campaignID: EntityID;

    beforeEach(() => {
        dbManager = new DatabaseManager({ filepath: ':memory:' });
        dbManager.initialize();
        repository = new SQLiteEntityRepository(dbManager.getDatabase());
        useCase = new ResolveMentionUseCase(repository);
        worldID = EntityID.generate();
        campaignID = EntityID.generate();
    });

    afterEach(() => {
        dbManager.close();
    });

    describe('mention parsing', () => {
        it('should parse simple @Name format', async () => {
            const character = Character.create({
                name: 'Gandalf',
                worldID,
                campaignID,
            }).value;
            await repository.save(character);

            const result = await useCase.execute({
                mentionText: '@Gandalf',
                worldID: worldID.toString(),
                campaignID: campaignID.toString(),
            });

            expect(result.isSuccess).toBe(true);
            expect(result.value.found).toBe(true);
            expect(result.value.entityName).toBe('Gandalf');
            expect(result.value.entityId).toBe(character.id.toString());
            expect(result.value.entityType).toBe(EntityType.CHARACTER);
        });

        it('should parse quoted @"Name With Spaces" format', async () => {
            const character = Character.create({
                name: 'The Dark Lord',
                worldID,
                campaignID,
            }).value;
            await repository.save(character);

            const result = await useCase.execute({
                mentionText: '@"The Dark Lord"',
                worldID: worldID.toString(),
                campaignID: campaignID.toString(),
            });

            expect(result.isSuccess).toBe(true);
            expect(result.value.found).toBe(true);
            expect(result.value.entityName).toBe('The Dark Lord');
        });

        it('should handle unclosed quotes gracefully', async () => {
            const character = Character.create({
                name: 'Partial Name',
                worldID,
                campaignID,
            }).value;
            await repository.save(character);

            const result = await useCase.execute({
                mentionText: '@"Partial Name',
                worldID: worldID.toString(),
                campaignID: campaignID.toString(),
            });

            expect(result.isSuccess).toBe(true);
            expect(result.value.found).toBe(true);
            expect(result.value.entityName).toBe('Partial Name');
        });

        it('should reject mention without @ prefix', async () => {
            const result = await useCase.execute({
                mentionText: 'Gandalf',
                worldID: worldID.toString(),
                campaignID: campaignID.toString(),
            });

            expect(result.isFailure).toBe(true);
            expect(result.error.message).toContain('Invalid mention format');
        });

        it('should reject empty mention', async () => {
            const result = await useCase.execute({
                mentionText: '@',
                worldID: worldID.toString(),
                campaignID: campaignID.toString(),
            });

            expect(result.isFailure).toBe(true);
        });

        it('should reject empty quoted mention', async () => {
            const result = await useCase.execute({
                mentionText: '@""',
                worldID: worldID.toString(),
                campaignID: campaignID.toString(),
            });

            expect(result.isFailure).toBe(true);
        });
    });

    describe('entity resolution', () => {
        it('should find entity by exact name match (case-insensitive)', async () => {
            const character = Character.create({
                name: 'Gandalf',
                worldID,
                campaignID,
            }).value;
            await repository.save(character);

            const result = await useCase.execute({
                mentionText: '@gandalf',
                worldID: worldID.toString(),
                campaignID: campaignID.toString(),
            });

            expect(result.isSuccess).toBe(true);
            expect(result.value.found).toBe(true);
            expect(result.value.entityName).toBe('Gandalf');
        });

        it('should return found: false for non-existent entity', async () => {
            const result = await useCase.execute({
                mentionText: '@NonExistent',
                worldID: worldID.toString(),
                campaignID: campaignID.toString(),
            });

            expect(result.isSuccess).toBe(true);
            expect(result.value.found).toBe(false);
            expect(result.value.entityName).toBe('NonExistent');
            expect(result.value.entityId).toBeNull();
            expect(result.value.entityType).toBeNull();
        });

        it('should find different entity types', async () => {
            const location = Location.create({
                name: 'Mordor',
                worldID,
                campaignID,
            }).value;
            await repository.save(location);

            const result = await useCase.execute({
                mentionText: '@Mordor',
                worldID: worldID.toString(),
                campaignID: campaignID.toString(),
            });

            expect(result.value.found).toBe(true);
            expect(result.value.entityType).toBe(EntityType.LOCATION);
        });

        it('should find factions', async () => {
            const faction = Faction.create({
                name: 'The Fellowship',
                worldID,
                campaignID,
            }).value;
            await repository.save(faction);

            const result = await useCase.execute({
                mentionText: '@"The Fellowship"',
                worldID: worldID.toString(),
                campaignID: campaignID.toString(),
            });

            expect(result.value.found).toBe(true);
            expect(result.value.entityType).toBe(EntityType.FACTION);
        });
    });

    describe('multiple matches', () => {
        it('should return most recently modified when multiple matches exist', async () => {
            // Create two characters with the same name (in different campaigns but same name)
            const older = Character.create({
                name: 'Duplicate',
                worldID,
                campaignID,
            }).value;
            await repository.save(older);

            // Wait a tiny bit to ensure different timestamps
            await new Promise(resolve => setTimeout(resolve, 10));

            // Create a location with the same name (more recently)
            const newer = Location.create({
                name: 'Duplicate',
                worldID,
                campaignID,
            }).value;
            await repository.save(newer);

            const result = await useCase.execute({
                mentionText: '@Duplicate',
                worldID: worldID.toString(),
                campaignID: campaignID.toString(),
            });

            expect(result.value.found).toBe(true);
            expect(result.value.entityType).toBe(EntityType.LOCATION);
            expect(result.value.entityId).toBe(newer.id.toString());
        });
    });

    describe('world-level entities', () => {
        it('should find world-level entities when no campaign match', async () => {
            // Create a world-level character (no campaign)
            const worldChar = Character.create({
                name: 'WorldNPC',
                worldID,
            }).value;
            await repository.save(worldChar);

            const result = await useCase.execute({
                mentionText: '@WorldNPC',
                worldID: worldID.toString(),
                campaignID: campaignID.toString(),
            });

            expect(result.value.found).toBe(true);
            expect(result.value.entityName).toBe('WorldNPC');
        });

        it('should prefer campaign-level over world-level when both exist', async () => {
            // Create world-level character
            const worldChar = Character.create({
                name: 'SharedName',
                worldID,
            }).value;
            await repository.save(worldChar);

            // Create campaign-level character with same name
            const campaignChar = Character.create({
                name: 'SharedName',
                worldID,
                campaignID,
            }).value;
            await repository.save(campaignChar);

            const result = await useCase.execute({
                mentionText: '@SharedName',
                worldID: worldID.toString(),
                campaignID: campaignID.toString(),
            });

            expect(result.value.found).toBe(true);
            // Should find one of them - the campaign one was created after
            expect(result.value.entityId).toBe(campaignChar.id.toString());
        });

        it('should not find entities from different worlds', async () => {
            const otherWorld = EntityID.generate();
            const character = Character.create({
                name: 'OtherWorldChar',
                worldID: otherWorld,
            }).value;
            await repository.save(character);

            const result = await useCase.execute({
                mentionText: '@OtherWorldChar',
                worldID: worldID.toString(),
                campaignID: campaignID.toString(),
            });

            expect(result.value.found).toBe(false);
        });
    });

    describe('input validation', () => {
        it('should reject empty world ID', async () => {
            const result = await useCase.execute({
                mentionText: '@Test',
                worldID: '',
                campaignID: campaignID.toString(),
            });

            expect(result.isFailure).toBe(true);
            expect(result.error.message).toContain('world ID');
        });

        it('should reject empty campaign ID', async () => {
            const result = await useCase.execute({
                mentionText: '@Test',
                worldID: worldID.toString(),
                campaignID: '  ',
            });

            expect(result.isFailure).toBe(true);
            expect(result.error.message).toContain('campaign ID');
        });
    });

    describe('edge cases', () => {
        it('should handle whitespace in names', async () => {
            const character = Character.create({
                name: '  Spaced Name  ',
                worldID,
                campaignID,
            }).value;
            await repository.save(character);

            // The name gets trimmed during creation
            const result = await useCase.execute({
                mentionText: '@"Spaced Name"',
                worldID: worldID.toString(),
                campaignID: campaignID.toString(),
            });

            expect(result.value.found).toBe(true);
        });

        it('should handle special characters in names', async () => {
            const character = Character.create({
                name: "O'Brien",
                worldID,
                campaignID,
            }).value;
            await repository.save(character);

            const result = await useCase.execute({
                mentionText: '@"O\'Brien"',
                worldID: worldID.toString(),
                campaignID: campaignID.toString(),
            });

            expect(result.value.found).toBe(true);
        });

        it('should handle unicode characters', async () => {
            const character = Character.create({
                name: 'Björk',
                worldID,
                campaignID,
            }).value;
            await repository.save(character);

            const result = await useCase.execute({
                mentionText: '@Björk',
                worldID: worldID.toString(),
                campaignID: campaignID.toString(),
            });

            expect(result.value.found).toBe(true);
        });
    });
});
