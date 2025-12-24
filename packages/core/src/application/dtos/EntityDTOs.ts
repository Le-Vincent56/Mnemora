import { EntityType } from "../../domain/entities/EntityType";

/**
 * Data Transfer Objects for entities.
 * These are plain data structures that cross layer boundaries.
 * They contain no behavior, just pure data in a serializable format.
 */

/**
 * Type-specific fields for DTOs.
 * These mirror the domain TypeSpecificFields but with explicit undefined types
 * to satisfy exactOptionalPropertyTypes.
 */
export interface CharacterTypeSpecificFieldsDTO {
    readonly appearance: string | undefined;
    readonly personality: string | undefined;
    readonly motivation: string | undefined;
    readonly voiceMannerisms: string | undefined;
}

export interface LocationTypeSpecificFieldsDTO {
    readonly appearance: string | undefined;
    readonly atmosphere: string | undefined;
    readonly notableFeatures: string | undefined;
}

export interface FactionTypeSpecificFieldsDTO {
    readonly ideology: string | undefined;
    readonly goals: string | undefined;
    readonly resources: string | undefined;
    readonly structure: string | undefined;
}

export interface SessionTypeSpecificFieldsDTO {
    readonly prepNotes: string | undefined;
}

export interface NoteTypeSpecificFieldsDTO {
    readonly content: string | undefined;
}

/**
 * Base fields shared by all entity DTOs
 */
export interface BaseEntityDTO {
    readonly id: string;
    readonly type: EntityType;
    readonly name: string;
    readonly tags: readonly string[];
    readonly worldID: string;
    readonly campaignID: string | null;
    readonly createdAt: string;     // ISO date string
    readonly modifiedAt: string;    // ISO date string
}

/**
 * Character DTO: NPCs, notable figure, etc.
 */
export interface CharacterDTO extends BaseEntityDTO {
    readonly type: EntityType.CHARACTER;
    readonly description: string;
    readonly secrets: string;
    readonly forkedFrom: string | null;
    readonly typeSpecificFields: CharacterTypeSpecificFieldsDTO;
}

/**
 * Location DTO: Places, regions, buildings, etc.
 */
export interface LocationDTO extends BaseEntityDTO {
    readonly type: EntityType.LOCATION;
    readonly description: string;
    readonly secrets: string;
    readonly forkedFrom: string | null;
    readonly typeSpecificFields: LocationTypeSpecificFieldsDTO;
}

/**
 * Faction DTO: Organizations, guilds, nations, etc.
 */
export interface FactionDTO extends BaseEntityDTO {
    readonly type: EntityType.FACTION;
    readonly description: string;
    readonly secrets: string;
    readonly forkedFrom: string | null;
    readonly typeSpecificFields: FactionTypeSpecificFieldsDTO;
}

/**
 * Session DTO: Game session records.
 */
export interface SessionDTO extends BaseEntityDTO {
    readonly type: EntityType.SESSION;
    readonly summary: string;
    readonly notes: string;
    readonly secrets: string;
    readonly sessionDate: string | null;
    readonly typeSpecificFields: SessionTypeSpecificFieldsDTO;
}

/**
 * Note DTO: Simple GM notes.
 */
export interface NoteDTO extends BaseEntityDTO {
    readonly type: EntityType.NOTE;
    readonly content: string;
    readonly typeSpecificFields: NoteTypeSpecificFieldsDTO;
}

export type EntityDTO =
    | CharacterDTO
    | LocationDTO
    | FactionDTO
    | SessionDTO
    | NoteDTO;

export function isCharacterDTO(dto: EntityDTO): dto is CharacterDTO {
    return dto.type === EntityType.CHARACTER;
}

export function isLocationDTO(dto: EntityDTO): dto is LocationDTO {
    return dto.type === EntityType.LOCATION;
}

export function isFactionDTO(dto: EntityDTO): dto is FactionDTO {
    return dto.type === EntityType.FACTION;
}

export function isSessionDTO(dto: EntityDTO): dto is SessionDTO {
    return dto.type === EntityType.SESSION;
}

export function isNoteDTO(dto: EntityDTO): dto is NoteDTO {
    return dto.type === EntityType.NOTE;
}

/**
   * World DTO: Top-level container for a game setting.
   */
export interface WorldDTO {
    readonly id: string;
    readonly name: string;
    readonly tagline: string | null;
    readonly createdAt: string;   // ISO date string
    readonly modifiedAt: string;  // ISO date string
}

/**
 * Campaign DTO: A campaign within a World.
 */
export interface CampaignDTO {
    readonly id: string;
    readonly name: string;
    readonly description: string;
    readonly worldID: string;
    readonly createdAt: string;   // ISO date string
    readonly modifiedAt: string;  // ISO date string
}