import { EntityDTO } from "./EntityDTOs";

/**
 * Response DTOs: Output from use cases.
 * These wrap the result data with metadata useful for the caller.
 */

/**
 * Response for operations that return a single entity.
 */
export interface EntityResponse {
    readonly entity: EntityDTO;
}

/**
 * Response for paginated entity lists.
 */
export interface EntityListResponse {
    readonly entities: readonly EntityDTO[];
    readonly total: number;
    readonly hasMore: boolean;
}

/**
 * A highlighted snippet from the search match.
 */
export interface SearchHighlightDTO {
    readonly field: string;
    readonly snippet: string;
}

/**
 * A single search result with relevance info.
 */
export interface SearchResultDTO {
    readonly entity: EntityDTO;
    readonly score: number;
    readonly highlights: readonly SearchHighlightDTO[];
}

/**
 * Full search response with results and metadata.
 */
export interface SearchResponse {
    readonly results: readonly SearchResultDTO[];
    readonly total: number;
    readonly hasMore: boolean;
    readonly queryTimeMs: number;
}

/**
 * Response for delete operations.
 */
export interface DeleteResponse {
    readonly deletedID: string;
}

/**
 * Response for fork operations.
 */
export interface ForkResponse {
    readonly forkedEntity: EntityDTO;
    readonly sourceEntityID: string;
}

/**
 * Details about a failed item in a batch operation.
 */
export interface BatchFailure {
    readonly id: string;
    readonly reason: string;
}

/**
 * Response for batch operations.
 */
export interface BatchResponse {
    readonly successCount: number;
    readonly failureCount: number;
    readonly failures: readonly BatchFailure[];
}