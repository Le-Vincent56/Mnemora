import { Result } from "../core/Result";
import { RepositoryError } from "../core/errors";
import { EntityID } from "../value-objects/EntityID";
import { BaseEntity } from "../entities/BaseEntity";
import { EntityType } from "../entities/EntityType";

/**
 * Filter options for querying entities.
 */
export interface EntityFilter {
    worldID?: EntityID;
    campaignID?: EntityID | null;
    types?: EntityType[];
    tags?: string[];
    includeForked?: boolean;
}

/**
 * Options for pagination results.
 */
export interface PaginationOptions {
    limit: number;
    offset: number;
}

/**
 * Result of a pagined query.
 */
export interface PaginatedResult<T> {
    items: T[];
    total: number;
    hasMore: boolean;
}

/**
 * IEntityRepository: Interface for entity persistence operations.
 * This interface is defined in the domain layer but implemented in
 * the infrastructure layer (Dependency Inversion Principle).
 * All methods return Result<T, RepositoryError> to make errors explicit.
 */
export interface IEntityRepository {
    
    /**
     * Finds all entities belong to a World.
     * Includes both World-level and Campaign-scoped entities.
     */
    findByID(id: EntityID): Promise<Result<BaseEntity | null, RepositoryError>>;

    /**
     * Finds all entities belonging to a World.
     * Includes both World-level and Campaign-scoped entities.
     */
    findByWorld(
        worldID: EntityID, 
        options?: PaginationOptions
    ): Promise<Result<PaginatedResult<BaseEntity>, RepositoryError>>;

    /**
     * Finds all entities belonging to a Campaign.
     * Only returns Campaign-scoped entities, not World-level ones.
     */
    findByCampaign(
        campaignID: EntityID, 
        options?: PaginationOptions
    ): Promise<Result<PaginatedResult<BaseEntity>, RepositoryError>>;

    /**
     * Finds entities matching the given filter criteria. 
     */
    findByFilter(
        filter: EntityFilter, 
        options?: PaginationOptions
    ): Promise<Result<PaginatedResult<BaseEntity>, RepositoryError>>;

    /**
     * Finds all entities of a specific type within a World.
     */
    findByType(
        worldID: EntityID,
        type: EntityType,
        options?: PaginationOptions
    ): Promise<Result<PaginatedResult<BaseEntity>, RepositoryError>>;

    /**
     * Saves an entity (insert or update).
     * If the entity exists (by ID), it's updated; otherwise it's inserted.
     */
    save(entity: BaseEntity): Promise<Result<void, RepositoryError>>;

    /**
     * Saves multiple entities in a single transaction.
     */
    saveMany(entities: BaseEntity[]): Promise<Result<void, RepositoryError>>;

    /**
     * Delets an entity by ID.
     * Returns success even if the entity didn't exist (idempotent)
     */
    delete(id: EntityID): Promise<Result<void, RepositoryError>>;

    /**
     * Deletes multiple entities by ID in a single transaction.
     */
    deleteMany(ids: EntityID[]): Promise<Result<void, RepositoryError>>;

    /**
     * Checks if an entity with the given ID exists.
     */
    exists(id: EntityID): Promise<Result<boolean, RepositoryError>>;

    /**
     * Counts entities matching the filter criteria.
     */
    count(filter: EntityFilter): Promise<Result<number, RepositoryError>>;
}