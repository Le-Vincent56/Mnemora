import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { UpdateEntityUseCase } from './UpdateEntityUseCase';
import { SQLiteEntityRepository } from '../../infrastructure/repositories/SQLiteEntityRepository';
import { DatabaseManager } from '../../infrastructure/database/DatabaseManager';
import { EventBus } from '../services/EventBus';
import { EventStatePropagator } from '../../domain/services/EventStatePropagator';
import { DriftDetector } from '../../domain/services/DriftDetector';
import { SQLiteDriftRepository } from '../../infrastructure/repositories/SQLiteDriftRepository';
import { Event } from '../../domain/entities/Event';
import { EntityID } from '../../domain/value-objects/EntityID';
import { EntityType } from '../../domain/entities/EntityType';
import { isEventDTO } from '../dtos/EntityDTOs';

describe('UpdateEntityUseCase — Event case', () => {
    let dbManager: DatabaseManager;
    let entityRepo: SQLiteEntityRepository;
    let eventBus: EventBus;
    let useCase: UpdateEntityUseCase;
    let worldID: EntityID;
    let continuityID: EntityID;

    beforeEach(() => {
        dbManager = new DatabaseManager({ filepath: ':memory:' });
        dbManager.initialize();
        entityRepo = new SQLiteEntityRepository(dbManager.getDatabase());
        eventBus = new EventBus();
        const propagator = new EventStatePropagator(entityRepo);
        const driftRepo = new SQLiteDriftRepository(dbManager.getDatabase());
        const driftDetector = new DriftDetector(entityRepo, driftRepo);
        useCase = new UpdateEntityUseCase(entityRepo, eventBus, propagator, driftDetector);
        worldID = EntityID.generate();
        continuityID = EntityID.generate();
    });

    afterEach(() => {
        dbManager.close();
    });

    async function createEvent(name: string): Promise<Event> {
        const event = Event.create({ name, worldID, continuityID }).value;
        await entityRepo.save(event);
        return event;
    }

    it('should update event name', async () => {
        const event = await createEvent('Original');

        const result = await useCase.execute({
            id: event.id.toString(),
            name: 'Updated Name',
        });

        expect(result.isSuccess).toBe(true);
        expect(result.value.name).toBe('Updated Name');
        expect(result.value.type).toBe(EntityType.EVENT);
    });

    it('should update event description', async () => {
        const event = await createEvent('Test');

        const result = await useCase.execute({
            id: event.id.toString(),
            description: 'A significant event',
        });

        expect(result.isSuccess).toBe(true);
        if (isEventDTO(result.value)) {
            expect(result.value.description).toBe('A significant event');
        }
    });

    it('should update event secrets', async () => {
        const event = await createEvent('Test');

        const result = await useCase.execute({
            id: event.id.toString(),
            secrets: 'Hidden truth',
        });

        expect(result.isSuccess).toBe(true);
        if (isEventDTO(result.value)) {
            expect(result.value.secrets).toBe('Hidden truth');
        }
    });

    it('should update event tags', async () => {
        const event = await createEvent('Test');

        const result = await useCase.execute({
            id: event.id.toString(),
            tags: ['combat', 'arc-1'],
        });

        expect(result.isSuccess).toBe(true);
        expect(result.value.tags).toEqual(expect.arrayContaining(['combat', 'arc-1']));
        expect(result.value.tags).toHaveLength(2);
    });

    it('should update event type-specific fields', async () => {
        const event = await createEvent('Test');

        const result = await useCase.execute({
            id: event.id.toString(),
            typeSpecificFields: {
                inWorldTime: 'Year 1000, Midwinter',
                locationID: EntityID.generate().toString(),
            },
        });

        expect(result.isSuccess).toBe(true);
        if (isEventDTO(result.value)) {
            expect(result.value.typeSpecificFields.inWorldTime).toBe('Year 1000, Midwinter');
            expect(result.value.typeSpecificFields.locationID).toBeDefined();
        }
    });

    it('should update outcomes via typeSpecificFields', async () => {
        const event = await createEvent('Battle');
        const outcomes = JSON.stringify([
            { entityId: 'entity-1', field: 'status', toValue: 'dead', fromValue: 'alive' },
        ]);

        const result = await useCase.execute({
            id: event.id.toString(),
            typeSpecificFields: { outcomes },
        });

        expect(result.isSuccess).toBe(true);
        if (isEventDTO(result.value)) {
            expect(result.value.typeSpecificFields.outcomes).toBe(outcomes);
        }
    });

    it('should reject invalid type-specific field', async () => {
        const event = await createEvent('Test');

        const result = await useCase.execute({
            id: event.id.toString(),
            typeSpecificFields: { invalidField: 'value' },
        });

        expect(result.isFailure).toBe(true);
        expect(result.error.code).toContain('VALIDATION');
    });

    it('should return unchanged DTO when no fields provided', async () => {
        const event = await createEvent('Unchanged');

        const result = await useCase.execute({
            id: event.id.toString(),
        });

        expect(result.isSuccess).toBe(true);
        expect(result.value.name).toBe('Unchanged');
    });

    it('should persist changes', async () => {
        const event = await createEvent('Original');

        await useCase.execute({
            id: event.id.toString(),
            name: 'Persisted',
            description: 'Updated desc',
        });

        const found = await entityRepo.findByID(event.id);
        expect(found.value).not.toBeNull();
        // Re-read should show the updates via the saved entity
        const reloaded = found.value as Event;
        expect(reloaded.name.toString()).toBe('Persisted');
    });
});