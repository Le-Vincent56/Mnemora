import { EntityRow } from '../database/types';
import { BaseEntity } from '../../domain/entities/BaseEntity';
import { Character, CharacterProps } from '../../domain/entities/Character';
import { Location, LocationProps } from '../../domain/entities/Location';
import { Faction, FactionProps } from '../../domain/entities/Faction';
import { Session, SessionProps } from '../../domain/entities/Session';
import { Note, NoteProps } from '../../domain/entities/Note';
import { EntityType, toEntityType } from '../../domain/entities/EntityType';
import { EntityID } from '../../domain/value-objects/EntityID';
import { Name } from '../../domain/value-objects/Name';
import { RichText } from '../../domain/value-objects/RichText';
import { TagCollection } from '../../domain/value-objects/TagCollection';
import { Timestamps } from '../../domain/value-objects/Timestamps';
import { TypeSpecificFieldsWrapper } from '../../domain/value-objects/TypeSpecificFields';

export class DatabaseMapper {
    /**
     * Converts a database row to a domain entity.
     */
    static toDomain(row: EntityRow): BaseEntity {
        const type = toEntityType(row.type);

        switch (type) {
            case EntityType.CHARACTER:
                return Character.fromProps(DatabaseMapper.toCharacterProps(row));
            case EntityType.LOCATION:
                return Location.fromProps(DatabaseMapper.toLocationProps(row));
            case EntityType.FACTION:
                return Faction.fromProps(DatabaseMapper.toFactionProps(row));
            case EntityType.SESSION:
                return Session.fromProps(DatabaseMapper.toSessionProps(row));
            case EntityType.NOTE:
                return Note.fromProps(DatabaseMapper.toNoteProps(row));
            default:
                throw new Error(`Unknown entity type: ${row.type}`);
        }
    }

    /**
     * Converts a domain entity to a database row.
     */
    static toRow(entity: BaseEntity): EntityRow {
        // Base fields common to all entities
        const base = {
            id: entity.id.toString(),
            type: entity.type,
            created_at: entity.createdAt.toISOString(),
            modified_at: entity.modifiedAt.toISOString(),
        };

        switch (entity.type) {
            case EntityType.CHARACTER: {
                const char = entity as Character;
                return {
                    ...base,
                    name: char.name.toString(),
                    description: char.description.toString(),
                    secrets: char.secrets.toString(),
                    content: null,
                    summary: null,
                    notes: null,
                    tags: JSON.stringify(char.tags.toArray()),
                    world_id: char.worldID.toString(),
                    campaign_id: char.campaignID?.toString() ?? null,
                    forked_from: char.forkedFrom?.toString() ?? null,
                    session_date: null,
                    type_specific_fields: char.typeSpecificFieldsWrapper.toJSON(),
                };
            }
            case EntityType.LOCATION: {
                const loc = entity as Location;
                return {
                    ...base,
                    name: loc.name.toString(),
                    description: loc.description.toString(),
                    secrets: loc.secrets.toString(),
                    content: null,
                    summary: null,
                    notes: null,
                    tags: JSON.stringify(loc.tags.toArray()),
                    world_id: loc.worldID.toString(),
                    campaign_id: loc.campaignID?.toString() ?? null,
                    forked_from: loc.forkedFrom?.toString() ?? null,
                    session_date: null,
                    type_specific_fields: loc.typeSpecificFieldsWrapper.toJSON(),
                };
            }
            case EntityType.FACTION: {
                const fac = entity as Faction;
                return {
                    ...base,
                    name: fac.name.toString(),
                    description: fac.description.toString(),
                    secrets: fac.secrets.toString(),
                    content: null,
                    summary: null,
                    notes: null,
                    tags: JSON.stringify(fac.tags.toArray()),
                    world_id: fac.worldID.toString(),
                    campaign_id: fac.campaignID?.toString() ?? null,
                    forked_from: fac.forkedFrom?.toString() ?? null,
                    session_date: null,
                    type_specific_fields: fac.typeSpecificFieldsWrapper.toJSON(),
                };
            }
            case EntityType.SESSION: {
                const sess = entity as Session;
                return {
                    ...base,
                    name: sess.name.toString(),
                    description: null,
                    secrets: sess.secrets.toString(),
                    content: null,
                    summary: sess.summary.toString(),
                    notes: sess.notes.toString(),
                    tags: JSON.stringify(sess.tags.toArray()),
                    world_id: sess.worldID.toString(),
                    campaign_id: sess.campaignID.toString(),  // Always non-null for Session
                    forked_from: null,
                    session_date: sess.sessionDate?.toISOString() ?? null,
                    type_specific_fields: sess.typeSpecificFieldsWrapper.toJSON(),
                };
            }
            case EntityType.NOTE: {
                const note = entity as Note;
                return {
                    ...base,
                    name: note.name.toString(),
                    description: null,
                    secrets: null,
                    content: note.content.toString(),
                    summary: null,
                    notes: null,
                    tags: JSON.stringify(note.tags.toArray()),
                    world_id: note.worldID.toString(),
                    campaign_id: note.campaignID.toString(),  // Always non-null for Note
                    forked_from: null,
                    session_date: null,
                    type_specific_fields: note.typeSpecificFieldsWrapper.toJSON(),
                };
            }
            default:
                throw new Error(`Unknown entity type: ${entity.type}`);
        }
    }

    private static toCharacterProps(row: EntityRow): CharacterProps {
        return {
            id: EntityID.fromStringOrThrow(row.id),
            name: Name.create(row.name).value,  // Already validated in DB
            description: RichText.fromString(row.description ?? ''),
            secrets: RichText.fromString(row.secrets ?? ''),
            tags: TagCollection.fromArray(JSON.parse(row.tags)).value,
            worldID: EntityID.fromStringOrThrow(row.world_id),
            campaignID: row.campaign_id ? EntityID.fromStringOrThrow(row.campaign_id) : null,
            forkedFrom: row.forked_from ? EntityID.fromStringOrThrow(row.forked_from) : null,
            timestamps: Timestamps.fromStringsOrThrow(row.created_at, row.modified_at),
            typeSpecificFields: TypeSpecificFieldsWrapper.fromJSON(
                EntityType.CHARACTER,
                row.type_specific_fields
            ),
        };
    }

    private static toLocationProps(row: EntityRow): LocationProps {
        return {
            id: EntityID.fromStringOrThrow(row.id),
            name: Name.create(row.name).value,
            description: RichText.fromString(row.description ?? ''),
            secrets: RichText.fromString(row.secrets ?? ''),
            tags: TagCollection.fromArray(JSON.parse(row.tags)).value,
            worldID: EntityID.fromStringOrThrow(row.world_id),
            campaignID: row.campaign_id ? EntityID.fromStringOrThrow(row.campaign_id) : null,
            forkedFrom: row.forked_from ? EntityID.fromStringOrThrow(row.forked_from) : null,
            timestamps: Timestamps.fromStringsOrThrow(row.created_at, row.modified_at),
            typeSpecificFields: TypeSpecificFieldsWrapper.fromJSON(
                EntityType.LOCATION,
                row.type_specific_fields
            ),
        };
    }

    private static toFactionProps(row: EntityRow): FactionProps {
        return {
            id: EntityID.fromStringOrThrow(row.id),
            name: Name.create(row.name).value,
            description: RichText.fromString(row.description ?? ''),
            secrets: RichText.fromString(row.secrets ?? ''),
            tags: TagCollection.fromArray(JSON.parse(row.tags)).value,
            worldID: EntityID.fromStringOrThrow(row.world_id),
            campaignID: row.campaign_id ? EntityID.fromStringOrThrow(row.campaign_id) : null,
            forkedFrom: row.forked_from ? EntityID.fromStringOrThrow(row.forked_from) : null,
            timestamps: Timestamps.fromStringsOrThrow(row.created_at, row.modified_at),
            typeSpecificFields: TypeSpecificFieldsWrapper.fromJSON(
                EntityType.FACTION,
                row.type_specific_fields
            ),
        };
    }

    private static toSessionProps(row: EntityRow): SessionProps {
        return {
            id: EntityID.fromStringOrThrow(row.id),
            name: Name.create(row.name).value,
            summary: RichText.fromString(row.summary ?? ''),
            notes: RichText.fromString(row.notes ?? ''),
            secrets: RichText.fromString(row.secrets ?? ''),
            tags: TagCollection.fromArray(JSON.parse(row.tags)).value,
            worldID: EntityID.fromStringOrThrow(row.world_id),
            campaignID: EntityID.fromStringOrThrow(row.campaign_id!),  // Never null for Session
            sessionDate: row.session_date ? new Date(row.session_date) : null,
            timestamps: Timestamps.fromStringsOrThrow(row.created_at, row.modified_at),
            quickNotes: [],
            starsAndWishes: null,
            duration: (row as EntityRow & { duration?: number }).duration ?? null,
            typeSpecificFields: TypeSpecificFieldsWrapper.fromJSON(
                EntityType.SESSION,
                row.type_specific_fields
            ),
        };
    }

    private static toNoteProps(row: EntityRow): NoteProps {
        return {
            id: EntityID.fromStringOrThrow(row.id),
            name: Name.create(row.name).value,
            content: RichText.fromString(row.content ?? ''),
            tags: TagCollection.fromArray(JSON.parse(row.tags)).value,
            worldID: EntityID.fromStringOrThrow(row.world_id),
            campaignID: EntityID.fromStringOrThrow(row.campaign_id!),  // Never null for Note
            timestamps: Timestamps.fromStringsOrThrow(row.created_at, row.modified_at),
            typeSpecificFields: TypeSpecificFieldsWrapper.fromJSON(
                EntityType.NOTE,
                row.type_specific_fields
            ),
        };
    }
}