import { Result } from "../core/Result";
import { RepositoryError } from "../core/errors";
import { EntityID } from "../value-objects/EntityID";
import { BaseEntity } from "../entities/BaseEntity";
import { EntityType } from "../entities/EntityType";

/**
 * Search mode determines how the query is interpreted.
 */
export enum SearchMode {
    NATURAL = 'natural',    // Natural language search with fuzzy matching and relevance ranking
    BOOLEAN = 'boolean',    // Boolean search with && || ! operators
    FILTER = 'filter'       // Filter search with type: and tag: prefixes
}

/**
 * A search query with parsed parameters.
 */
export interface SearchQuery {
    raw: string;            // The raw query string
    mode: SearchMode;       // Detected or forced search mode
    worldID: EntityID;      // Scope search to a specific World
    campaignID?: EntityID;  // Optionally scope to a specific Campaign
    types?: EntityType[];   // Filter by entity types
    tags?: string[];        // Filter by tags
    limit: number;          // Maximum results to return
    offset: number;         // Offset for pagination
}

/**
 * A highlighted match within a field.
 */
export interface SearchHighlight {
    field: string;
    snippet: string;
}


/**
 * A single search result with a relevance score.
 */
export interface SearchResult {
    entity: BaseEntity;
    score: number;                  // Relevance score (higher = more relevant)
    highlights: SearchHighlight[];  // Matched text snippets for highlighting
}

/**
 * Response from a search operation.
 */
export interface SearchResponse {
    results: SearchResult[];
    total: number;
    hasMore: boolean;
    queryTimeMs: number;    // Time taken in milliseconds
}

/**
 * ISearchRepository: Interface for full-text search operations.
 * Separated from IEntityRepository due to a difference in concerns
 * (indexing, ranking, highlighting) and may use different 
 * storage (FTS5 virtual tables in SQLite).
 */
export interface ISearchRepository {
    /**
     * Performs a search with the given query.
     */
    search(query: SearchQuery): Promise<Result<SearchResponse, RepositoryError>>;

    /**
     * Indexes an entity for search.
     * Called automatically when entities are saved.
     */
    index(entity: BaseEntity): Promise<Result<void, RepositoryError>>;

    /**
     * Removes an entity from the search index.
     * Called automatically when entities are deleted.
     */
    removeFromIndex(id: EntityID): Promise<Result<void, RepositoryError>>;

    /**
     * Rebuilds the entire search index.
     * Useful for maintenance or after schema changes.
     */
    rebuildIndex(worldID: EntityID): Promise<Result<void, RepositoryError>>;
}