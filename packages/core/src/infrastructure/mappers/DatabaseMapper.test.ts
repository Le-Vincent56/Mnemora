import { describe, it, expect } from 'vitest';
import { DatabaseMapper } from './DatabaseMapper';
import { Character } from '../../domain/entities/Character';
import { Location } from '../../domain/entities/Location';
import { Faction } from '../../domain/entities/Faction';
import { Session } from '../../domain/entities/Session';
import { Note } from '../../domain/entities/Note';
import { EntityID } from '../../domain/value-objects/EntityID';
import { EntityType } from '../../domain/entities/EntityType';
import { EntityRow } from '../database/types';

describe('DatabaseMapper', () => {
    const worldID = EntityID.generate();
    const campaignID = EntityID.generate();

    describe('toRow', () => {
        it('should convert Character to row', () => {
            const character = Character.create({
                name: "Hugo",
                worldID,
                campaignID
            }).value;

            character.updateDescription('A human man of pure dexterity and charm');
            character.updateSecrets('Hugradral Scowl is one of the Seven Revenants');

            const row = DatabaseMapper.toRow(character);

            expect(row.id).toBe(character.id.toString());
            expect(row.type).toBe(EntityType.CHARACTER);
            expect(row.name).toBe("Hugo");
            expect(row.description).toBe('A human man of pure dexterity and charm');
            expect(row.secrets).toBe('Hugradral Scowl is one of the Seven Revenants');
            expect(row.world_id).toBe(worldID.toString());
            expect(row.campaign_id).toBe(campaignID.toString());
            expect(row.content).toBeNull();
            expect(row.summary).toBeNull();
        });

        it('should convert Location to row', () => {
            const location = Location.create({
                name: 'Eagon, the Safe Haven',
                worldID,
            }).value;

            const row = DatabaseMapper.toRow(location);

            expect(row.type).toBe(EntityType.LOCATION);
            expect(row.name).toBe('Eagon, the Safe Haven');
            expect(row.campaign_id).toBeNull();
        });

        it('should convert Session to row with sessionDate', () => {
            const sessionDate = new Date('2025-12-18');
            const session = Session.create({
                name: 'Session 1',
                worldID,
                campaignID,
                sessionDate
            }).value;

            const row = DatabaseMapper.toRow(session);

            expect(row.type).toBe(EntityType.SESSION);
            expect(row.session_date).toBe(sessionDate.toISOString());
            expect(row.campaign_id).toBe(campaignID.toString());
        });

        it('should convert Note to row', () => {
            const note = Note.create({
                name: 'Plot ideas',
                worldID,
                campaignID,
            }).value;
            note.updateContent('The villain is actually the daughter of the Black King');

            const row = DatabaseMapper.toRow(note);

            expect(row.type).toBe(EntityType.NOTE);
            expect(row.content).toBe('The villain is actually the daughter of the Black King');
            expect(row.description).toBeNull();
            expect(row.secrets).toBeNull();
        });

        it('should serialize tags as JSON array', () => {
            const character = Character.create({
                name: 'Cyrus',
                worldID,
            }).value;
            character.setTags(['npc', 'tahfa', 'villain', 'triton']);

            const row = DatabaseMapper.toRow(character);

            expect(row.tags).toBe('["npc","tahfa","triton","villain"]'); // Sorted alphabetically
        });
    });

    describe('toDomain', () => {
        it('should convert Character row to entity', () => {
            const row: EntityRow = {
                id: EntityID.generate().toString(),
                type: 'character',
                name: 'Hugo',
                description: 'A human man of pure dexterity and charm',
                secrets: 'Hugradral Scowl is one of the Seven Revenants',
                content: null,
                summary: null,
                notes: null,
                tags: '["npc","human","seven revenants"]',
                world_id: worldID.toString(),
                campaign_id: campaignID.toString(),
                forked_from: null,
                session_date: null,
                created_at: new Date().toISOString(),
                modified_at: new Date().toISOString(),
            };

            const entity = DatabaseMapper.toDomain(row);

            expect(entity).toBeInstanceOf(Character);
            expect(entity.type).toBe(EntityType.CHARACTER);
            const character = entity as Character;
            expect(character.name.toString()).toBe('Hugo');
            expect(character.description.toString()).toBe('A human man of pure dexterity and charm');
            expect(character.secrets.toString()).toBe('Hugradral Scowl is one of the Seven Revenants');
            expect(character.tags.toArray()).toEqual(['human', 'npc', 'seven revenants']);
        });
    });

    it('should convert Session row to entity', () => {
        const sessionDate = new Date('2025-12-18');
        const row: EntityRow = {
            id: EntityID.generate().toString(),
            type: 'session',
            name: 'Session 1',
            description: null,
            secrets: 'The daughter of the Black King is the villain',
            content: null,
            summary: 'The party met',
            notes: 'Prep notes here',
            tags: '[]',
            world_id: worldID.toString(),
            campaign_id: campaignID.toString(),
            forked_from: null,
            session_date: sessionDate.toISOString(),
            created_at: new Date().toISOString(),
            modified_at: new Date().toISOString(),
        };

        const entity = DatabaseMapper.toDomain(row);

        expect(entity).toBeInstanceOf(Session);
        const session = entity as Session;
        expect(session.summary.toString()).toBe('The party met');
        expect(session.notes.toString()).toBe('Prep notes here');
        expect(session.sessionDate?.toISOString()).toBe(sessionDate.toISOString());
    });

    it('should handle null campaignID for world-level entities', () => {
        const row: EntityRow = {
            id: EntityID.generate().toString(),
            type: 'location',
            name: 'World Location',
            description: '',
            secrets: '',
            content: null,
            summary: null,
            notes: null,
            tags: '[]',
            world_id: worldID.toString(),
            campaign_id: null,
            forked_from: null,
            session_date: null,
            created_at: new Date().toISOString(),
            modified_at: new Date().toISOString(),
        };

        const entity = DatabaseMapper.toDomain(row) as Location;

        expect(entity.campaignID).toBeNull();
        expect(entity.isCampaignScoped).toBe(false);
    });

    it('should preserve forkedFrom reference', () => {
        const sourceID = EntityID.generate();
        const row: EntityRow = {
            id: EntityID.generate().toString(),
            type: 'character',
            name: 'Forked Character',
            description: '',
            secrets: '',
            content: null,
            summary: null,
            notes: null,
            tags: '[]',
            world_id: worldID.toString(),
            campaign_id: campaignID.toString(),
            forked_from: sourceID.toString(),
            session_date: null,
            created_at: new Date().toISOString(),
            modified_at: new Date().toISOString(),
        };

        const entity = DatabaseMapper.toDomain(row) as Character;

        expect(entity.forkedFrom?.toString()).toBe(sourceID.toString());
        expect(entity.isForked).toBe(true);
    });

    describe('round-trip conversion', () => {
        it('should preserve Character data through round-trip', () => {
            const original = Character.create({
                name: 'Round Trip Test',
                worldID,
                campaignID,
            }).value;
            original.updateDescription('Test description');
            original.setTags(['test', 'roundtrip']);

            const row = DatabaseMapper.toRow(original);
            const restored = DatabaseMapper.toDomain(row) as Character;

            expect(restored.id.toString()).toBe(original.id.toString());
            expect(restored.name.toString()).toBe(original.name.toString());
            expect(restored.description.toString()).toBe(original.description.toString());
            expect(restored.tags.toArray()).toEqual(original.tags.toArray());
        });
    });
});