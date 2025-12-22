import { BaseEntity } from "../../domain/entities/BaseEntity";
import { Character } from "../../domain/entities/Character";
import { Location } from "../../domain/entities/Location";
import { Faction } from "../../domain/entities/Faction";
import { Session } from "../../domain/entities/Session";
import { Note } from "../../domain/entities/Note";
import { EntityType } from "../../domain/entities/EntityType";
import type {
    EntityDTO,
    CharacterDTO,
    LocationDTO,
    FactionDTO,
    SessionDTO,
    NoteDTO
} from '../dtos/EntityDTOs';
import { World } from "../../domain/entities/World";
import { Campaign } from "../../domain/entities/Campaign";
import type { WorldDTO, CampaignDTO } from '../dtos/EntityDTOs';

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
            createdAt: campaign.createdAt.toISOString(),
            modifiedAt: campaign.modifiedAt.toISOString(),
        };
    }

    static campaignsToDTOs(campaigns: readonly Campaign[]): CampaignDTO[] {
        return campaigns.map((c) => this.campaignToDTO(c));
    }
}