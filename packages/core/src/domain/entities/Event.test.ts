import { describe, it, expect } from 'vitest';
import { Event } from './Event';
import { EntityType } from './EntityType';
import { EntityID } from '../value-objects/EntityID';

describe('Event', () => {
    const worldID = EntityID.generate();
    const continuityID = EntityID.generate();

    describe('create', () => {
        it('should create an event with required fields', () => {
            const result = Event.create({
                name: 'The Battle of Five Armies',
                worldID,
                continuityID,
            });

            expect(result.isSuccess).toBe(true);
            expect(result.value.name.toString()).toBe('The Battle of Five Armies');
            expect(result.value.worldID.equals(worldID)).toBe(true);
            expect(result.value.continuityID.equals(continuityID)).toBe(true);
            expect(result.value.type).toBe(EntityType.EVENT);
            expect(result.value.campaignID).toBeNull();
            expect(result.value.forkedFrom).toBeNull();
            expect(result.value.description.isEmpty).toBe(true);
            expect(result.value.secrets.isEmpty).toBe(true);
            expect(result.value.tags.toArray()).toEqual([]);
        });

        it('should create an event with optional campaignID', () => {
            const campaignID = EntityID.generate();
            const result = Event.create({
                name: 'Battle',
                worldID,
                continuityID,
                campaignID,
            });

            expect(result.isSuccess).toBe(true);
            expect(result.value.campaignID!.equals(campaignID)).toBe(true);
        });

        it('should reject empty name', () => {
            const result = Event.create({
                name: '',
                worldID,
                continuityID,
            });

            expect(result.isFailure).toBe(true);
        });

        it('should initialize with default EventFields', () => {
            const event = Event.create({
                name: 'Test Event',
                worldID,
                continuityID,
            }).value;

            const fields = event.typeSpecificFields;
            expect(fields.type).toBe('event');
            expect(fields.inWorldTime).toBeUndefined();
            expect(fields.realWorldAnchor).toBeUndefined();
            expect(fields.involvedEntityIDs).toBeUndefined();
            expect(fields.locationID).toBeUndefined();
            expect(fields.outcomes).toBeUndefined();
        });
    });

    describe('rename', () => {
        it('should update name', () => {
            const event = Event.create({ name: 'Original', worldID, continuityID }).value;

            const result = event.rename('Updated');

            expect(result.isSuccess).toBe(true);
            expect(event.name.toString()).toBe('Updated');
        });

        it('should reject empty name', () => {
            const event = Event.create({ name: 'Original', worldID, continuityID }).value;

            const result = event.rename('');

            expect(result.isFailure).toBe(true);
            expect(event.name.toString()).toBe('Original');
        });
    });

    describe('updateDescription', () => {
        it('should update description', () => {
            const event = Event.create({ name: 'Test', worldID, continuityID }).value;

            event.updateDescription('A great battle');

            expect(event.description.value).toBe('A great battle');
        });
    });

    describe('updateSecrets', () => {
        it('should update secrets', () => {
            const event = Event.create({ name: 'Test', worldID, continuityID }).value;

            event.updateSecrets('Hidden agenda');

            expect(event.secrets.value).toBe('Hidden agenda');
        });
    });

    describe('tags', () => {
        it('should set tags', () => {
            const event = Event.create({ name: 'Test', worldID, continuityID }).value;

            const result = event.setTags(['combat', 'pivotal']);

            expect(result.isSuccess).toBe(true);
            expect(event.tags.toArray()).toEqual(['combat', 'pivotal']);
        });

        it('should add a tag', () => {
            const event = Event.create({ name: 'Test', worldID, continuityID }).value;
            event.setTags(['combat']);

            const result = event.addTag('pivotal');

            expect(result.isSuccess).toBe(true);
            expect(event.tags.toArray()).toContain('pivotal');
        });

        it('should remove a tag', () => {
            const event = Event.create({ name: 'Test', worldID, continuityID }).value;
            event.setTags(['combat', 'pivotal']);

            event.removeTag('combat');

            expect(event.tags.toArray()).not.toContain('combat');
        });
    });

    describe('type-specific fields', () => {
        it('should set inWorldTime', () => {
            const event = Event.create({ name: 'Test', worldID, continuityID }).value;

            const result = event.setTypeSpecificField('inWorldTime', 'Third Age, Year 2941');

            expect(result.isSuccess).toBe(true);
            expect(event.getTypeSpecificField('inWorldTime')).toBe('Third Age, Year 2941');
        });

        it('should set outcomes', () => {
            const event = Event.create({ name: 'Test', worldID, continuityID }).value;
            const outcomes = JSON.stringify([{ entityId: 'abc', field: 'status', toValue: 'dead' }]);

            const result = event.setTypeSpecificField('outcomes', outcomes);

            expect(result.isSuccess).toBe(true);
            expect(event.getTypeSpecificField('outcomes')).toBe(outcomes);
        });

        it('should reject invalid field name', () => {
            const event = Event.create({ name: 'Test', worldID, continuityID }).value;

            const result = event.setTypeSpecificField('invalidField', 'value');

            expect(result.isFailure).toBe(true);
        });

        it('should clear a field by setting undefined', () => {
            const event = Event.create({ name: 'Test', worldID, continuityID }).value;
            event.setTypeSpecificField('inWorldTime', 'Some time');

            event.setTypeSpecificField('inWorldTime', undefined);

            expect(event.getTypeSpecificField('inWorldTime')).toBeUndefined();
        });
    });

    describe('immutable references', () => {
        it('should have immutable worldID', () => {
            const event = Event.create({ name: 'Test', worldID, continuityID }).value;
            expect(event.worldID.equals(worldID)).toBe(true);
        });

        it('should have immutable continuityID', () => {
            const event = Event.create({ name: 'Test', worldID, continuityID }).value;
            expect(event.continuityID.equals(continuityID)).toBe(true);
        });
    });
});