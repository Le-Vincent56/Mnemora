import { EntityType } from "../../domain/entities/EntityType";

/**
 * Request DTOs: Input for use cases.
 * These define what data is needed to execute each use case.
 * Alll fields are primitives (the use case converst to value objects).
 */

/**
 * Base fields for creating any entity.
 */
interface BaseCreateRequest {
    readonly name: string;
    readonly worldID: string;
    readonly tags?: readonly string[];
}

/**
 * Create a new Character
 */
export interface CreateCharacterRequest extends BaseCreateRequest {
    readonly campaignID?: string;
    readonly description?: string;
    readonly secrets?: string;
}

/**
 * Create a new Location.
 */
export interface CreateLocationRequest extends BaseCreateRequest {
    readonly campaignID?: string;
    readonly description?: string;
    readonly secrets?: string;
}

/**
 * Create a new Faction.
 */
export interface CreateFactionRequest extends BaseCreateRequest {
    readonly campaignID?: string;
    readonly description?: string;
    readonly secrets?: string;
}

/**
 * Create a new Session.
 * A Campaign ID is required for sessions.
 */
export interface CreateSessionRequest extends BaseCreateRequest {
    readonly campaignID: string;
    readonly summary?: string;
    readonly notes?: string;
    readonly secrets?: string;
    readonly sessionDate?: string;
}

/**
 * Create a new Note.
 * A Campaign ID is required for notes.
 */
export interface CreateNoteRequest extends BaseCreateRequest {
    readonly campaignID: string;
    readonly content?: string;
}

/**
 * Create a new Event.
 * Continuity ID is required for events.
 */
export interface CreateEventRequest extends BaseCreateRequest {
    readonly continuityID: string;
    readonly campaignID?: string;
    readonly description?: string;
    readonly secrets?: string;
}

/**
 * Update an existing entity.
 * Only include fields you want to change.
 * Null means "clear this field" (where applicable).
 * Undefined means "don't change this field".
 */
export interface UpdateEntityRequest {
    readonly id: string;
    readonly name?: string;
    readonly description?: string;
    readonly secrets?: string;
    readonly content?: string;              // For Notes
    readonly summary?: string;              // For Session
    readonly notes?: string;                // For Session
    readonly sessionDate?: string | null;   // For Session
    readonly tags?: readonly string[];
    readonly typeSpecificFields?: Record<string, string | undefined>;
}

/**
 * Delete an entity by ID.
 */
export interface DeleteEntityRequest {
    readonly id: string;
}

/**
 * Fork a world-level entity into a campaign.
 */
export interface ForkEntityRequest {
    readonly sourceEntityID: string;
    readonly intoCampaignID: string;
}

/**
 * Search for entities
 */
export interface SearchEntitiesRequest {
    readonly query: string;
    readonly worldID: string;
    readonly campaignID?: string;
    readonly types?: readonly EntityType[];
    readonly tags?: readonly string[];
    readonly limit?: number;
    readonly offset?: number;
}

/**
 * Get a single entity by ID.
 */
export interface GetEntityRequest {
    readonly id: string;
}

/**
 * List entities with filtering.
 */
export interface ListEntitiesRequest {
    readonly worldID: string;
    readonly campaignID?: string;
    readonly types?: readonly EntityType[];
    readonly tags?: readonly string[];
    readonly includeForked?: boolean;
    readonly limit?: number;
    readonly offset?: number;
}

/**
 * Create a new World.
 */
export interface CreateWorldRequest {
    readonly name: string;
    readonly tagline?: string;
}

/**
 * Update an existing World.
 * Undefined = don't change, null = clear (for tagline).
 */
export interface UpdateWorldRequest {
    readonly id: string;
    readonly name?: string;
    readonly tagline?: string | null;
}

/**
 * Delete a World by ID.
 */
export interface DeleteWorldRequest {
    readonly id: string;
}

/**
 * Get a single World by ID.
 */
export interface GetWorldRequest {
    readonly id: string;
}

/**
 * List all Worlds.
 */
export interface ListWorldsRequest {
    // Empty for now - could add pagination later
}

/**
 * Create a new Campaign.
 */
export interface CreateCampaignRequest {
    readonly name: string;
    readonly worldID: string;
    readonly continuityID: string;
    readonly description?: string;
}

/**
 * Update an existing Campaign.
 */
export interface UpdateCampaignRequest {
    readonly id: string;
    readonly name?: string;
    readonly description?: string;
}

/**
 * Delete a Campaign by ID.
 */
export interface DeleteCampaignRequest {
    readonly id: string;
}

/**
 * Get a single Campaign by ID.
 */
export interface GetCampaignRequest {
    readonly id: string;
}

/**
 * List Campaigns for a World.
 */
export interface ListCampaignsRequest {
    readonly worldID: string;
}

/**
 * Create a new Continuity.
 */
export interface CreateContinuityRequest {
    readonly name: string;
    readonly worldID: string;
    readonly description?: string;
    readonly branchedFromID?: string;
    readonly branchPointEventID?: string;
}

/**
 * Get a single Continuity by ID.
 */
export interface GetContinuityRequest {
    readonly id: string;
}

/**
 * List Continuities for a World.
 */
export interface ListContinuitiesRequest {
    readonly worldID: string;
}

/**
 * Update an existing Continuity.
 * Undefined = don't change
 */
export interface UpdateContinuityRequest {
    readonly id: string;
    readonly name?: string;
    readonly description?: string;
}

/**
 * Delete a Continuity by ID
 */
export interface DeleteContinuityRequest {
    readonly id: string;
}

export interface BranchContinuityRequest {
    readonly name: string;
    readonly parentContinuityID: string;
    readonly branchPointEventID: string;
    readonly description?: string;
}