import { BaseEntity } from "../../domain/entities/BaseEntity";
import { Character } from "../../domain/entities/Character";
import { Location } from "../../domain/entities/Location";
import { Faction } from "../../domain/entities/Faction";
import { Session } from "../../domain/entities/Session";
import { Note } from "../../domain/entities/Note";
import { Event } from "../../domain/entities/Event";
import { EntityType } from "../../domain/entities/EntityType";
import type {
    EntityDTO,
    CharacterDTO,
    LocationDTO,
    FactionDTO,
    SessionDTO,
    NoteDTO,
    EventDTO,
} from '../dtos/EntityDTOs';
import { World } from "../../domain/entities/World";
import { Campaign } from "../../domain/entities/Campaign";
import { Continuity } from "../../domain/entities/Continuity";
import type { WorldDTO, CampaignDTO, ContinuityDTO } from '../dtos/EntityDTOs';

/**
 * Mapper to convert domain entities to DTOs.
 * This is the single point of conversion from domain to DTO.
 * Value objects are unwrapped to primitives, dates to ISO strings.
 * Note: We only map domain to DTO here, the reverse (DTO to domain)
 * happens in the infrastructure layer when hydrating from the database.
 */
export class EntityMapper {
    /**
     * Convert any entity to its corresponding DTO.
     */
    static toDTO(entity: BaseEntity): EntityDTO {
        switch (entity.type) {
            case EntityType.CHARACTER:
                return this.characterToDTO(entity as Character);
            case EntityType.LOCATION:
                return this.locationToDTO(entity as Location);
            case EntityType.FACTION:
                return this.factionToDTO(entity as Faction);
            case EntityType.SESSION:
                return this.sessionToDTO(entity as Session);
            case EntityType.NOTE:
                return this.noteToDTO(entity as Note);
            case EntityType.EVENT:
                return this.eventToDTO(entity as Event);
            default:
                throw new Error(`Unknown entity type: ${entity.type}`);
        }
    }

    /**
     * Convert multiple entities to DTOs.
     */
    static toDTOs(entities: readonly BaseEntity[]): EntityDTO[] {
        return entities.map((e) => this.toDTO(e));
    }

    static characterToDTO(character: Character): CharacterDTO {
        return {
            id: character.id.toString(),
            type: EntityType.CHARACTER,
            name: character.name.toString(),
            description: character.description.value,
            secrets: character.secrets.value,
            tags: character.tags.toArray(),
            worldID: character.worldID.toString(),
            campaignID: character.campaignID?.toString() ?? null,
            forkedFrom: character.forkedFrom?.toString() ?? null,
            createdAt: character.createdAt.toISOString(),
            modifiedAt: character.modifiedAt.toISOString(),
            typeSpecificFields: {
                appearance: character.typeSpecificFields.appearance,
                personality: character.typeSpecificFields.personality,
                motivation: character.typeSpecificFields.motivation,
                voiceMannerisms: character.typeSpecificFields.voiceMannerisms,
            }
        };
    }

    static locationToDTO(location: Location): LocationDTO {
        return {
            id: location.id.toString(),
            type: EntityType.LOCATION,
            name: location.name.toString(),
            description: location.description.value,
            secrets: location.secrets.value,
            tags: location.tags.toArray(),
            worldID: location.worldID.toString(),
            campaignID: location.campaignID?.toString() ?? null,
            forkedFrom: location.forkedFrom?.toString() ?? null,
            createdAt: location.createdAt.toISOString(),
            modifiedAt: location.modifiedAt.toISOString(),
            typeSpecificFields: {
                appearance: location.typeSpecificFields.appearance,
                atmosphere: location.typeSpecificFields.atmosphere,
                notableFeatures: location.typeSpecificFields.notableFeatures,
            },
        };
    }

    static factionToDTO(faction: Faction): FactionDTO {
        return {
            id: faction.id.toString(),
            type: EntityType.FACTION,
            name: faction.name.toString(),
            description: faction.description.value,
            secrets: faction.secrets.value,
            tags: faction.tags.toArray(),
            worldID: faction.worldID.toString(),
            campaignID: faction.campaignID?.toString() ?? null,
            forkedFrom: faction.forkedFrom?.toString() ?? null,
            createdAt: faction.createdAt.toISOString(),
            modifiedAt: faction.modifiedAt.toISOString(),
            typeSpecificFields: {
                ideology: faction.typeSpecificFields.ideology,
                goals: faction.typeSpecificFields.goals,
                resources: faction.typeSpecificFields.resources,
                structure: faction.typeSpecificFields.structure,
            },
        };
    }

    static sessionToDTO(session: Session): SessionDTO {
        return {
            id: session.id.toString(),
            type: EntityType.SESSION,
            name: session.name.toString(),
            summary: session.summary.value,
            notes: session.notes.value,
            secrets: session.secrets.value,
            sessionDate: session.sessionDate?.toISOString() ?? null,
            tags: session.tags.toArray(),
            worldID: session.worldID.toString(),
            campaignID: session.campaignID.toString(),
            createdAt: session.createdAt.toISOString(),
            modifiedAt: session.modifiedAt.toISOString(),
            typeSpecificFields: {
                prepNotes: session.typeSpecificFields.prepNotes,
            },
        };
    }

    static noteToDTO(note: Note): NoteDTO {
        return {
            id: note.id.toString(),
            type: EntityType.NOTE,
            name: note.name.toString(),
            content: note.content.value,
            tags: note.tags.toArray(),
            worldID: note.worldID.toString(),
            campaignID: note.campaignID.toString(),
            createdAt: note.createdAt.toISOString(),
            modifiedAt: note.modifiedAt.toISOString(),
            typeSpecificFields: {
                content: note.typeSpecificFields.content,
            },
        };
    }

    static eventToDTO(event: Event): EventDTO {
        return {
            id: event.id.toString(),
            type: EntityType.EVENT,
            name: event.name.toString(),
            description: event.description.value,
            secrets: event.secrets.value,
            tags: event.tags.toArray(),
            worldID: event.worldID.toString(),
            campaignID: event.campaignID?.toString() ?? null,
            forkedFrom: event.forkedFrom?.toString() ?? null,
            continuityID: event.continuityID.toString(),
            createdAt: event.createdAt.toISOString(),
            modifiedAt: event.modifiedAt.toISOString(),
            typeSpecificFields: {
                inWorldTime: event.typeSpecificFields.inWorldTime,
                realWorldAnchor: event.typeSpecificFields.realWorldAnchor,
                involvedEntityIDs: event.typeSpecificFields.involvedEntityIDs,
                locationID: event.typeSpecificFields.locationID,
                outcomes: event.typeSpecificFields.outcomes,
            },
        };
    }

    static worldToDTO(world: World): WorldDTO {
        return {
            id: world.id.toString(),
            name: world.name.toString(),
            tagline: world.tagline,
            createdAt: world.createdAt.toISOString(),
            modifiedAt: world.modifiedAt.toISOString(),
        };
    }

    static worldsToDTOs(worlds: readonly World[]): WorldDTO[] {
        return worlds.map((w) => this.worldToDTO(w));
    }

    static campaignToDTO(campaign: Campaign): CampaignDTO {
        return {
            id: campaign.id.toString(),
            name: campaign.name.toString(),
            description: campaign.description.toString(),
            worldID: campaign.worldID.toString(),
            continuityID: campaign.continuityID.toString(),
            createdAt: campaign.createdAt.toISOString(),
            modifiedAt: campaign.modifiedAt.toISOString(),
        };
    }

    static campaignsToDTOs(campaigns: readonly Campaign[]): CampaignDTO[] {
        return campaigns.map((c) => this.campaignToDTO(c));
    }

    static continuityToDTO(continuity: Continuity): ContinuityDTO {
        return {
            id: continuity.id.toString(),
            name: continuity.name.toString(),
            description: continuity.description.toString(),
            worldID: continuity.worldID.toString(),
            branchedFromID: continuity.branchedFromID?.toString() ?? null,
            branchPointEventID: continuity.branchPointEventID?.toString() ?? null,
            createdAt: continuity.createdAt.toISOString(),
            modifiedAt: continuity.modifiedAt.toISOString(),
        };
    }
}