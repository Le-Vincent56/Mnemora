import { Result } from "../core/Result";
import { RepositoryError } from "../core/errors";
import { EntityID } from "../value-objects/EntityID";
import { Campaign } from "../entities/Campaign";

/**
 * ICampaignRepository: Interface for Campaign persistence operations.
 * This interface is defined in the domain layer but implemented in
 * the infrastructure layer (Dependency Inversion Principle).
 * All methods return Result<T, RepositoryError> to make errors explicit.
 */
export interface ICampaignRepository {
    /**
     * Finds a Campaign by its ID.
     * Returns null if not found.
     */
    findById(id: EntityID): Promise<Result<Campaign | null, RepositoryError>>;

    /**
     * Finds all Campaigns belonging to a specific World.
     * Ordered by modified_at descending.
     */
    findByWorld(worldID: EntityID): Promise<Result<Campaign[], RepositoryError>>;

    /**
     * Finds all Campaigns across all Worlds.
     * Ordered by modified_at descending.
     */
    findAll(): Promise<Result<Campaign[], RepositoryError>>;

    /**
     * Saves a Campaign (insert or update).
     * If the Campaign exists (by ID), it's updated; otherwise it's inserted.
     */
    save(campaign: Campaign): Promise<Result<void, RepositoryError>>;

    /**
     * Deletes a Campaign by ID.
     * Returns success even if the Campaign didn't exist (idempotent).
     */
    delete(id: EntityID): Promise<Result<void, RepositoryError>>;

    /**
     * Counts the number of Campaigns in a World.
     */
    countByWorld(worldID: EntityID): Promise<Result<number, RepositoryError>>;

    /**
     * Counts the number of Campaigns that reference a specific Continuity.
     */
    countByContinuity(continuityID: EntityID): Promise<Result<number, RepositoryError>>;

    /**
     * Checks if a Campaign with the given ID exists.
     */
    exists(id: EntityID): Promise<Result<boolean, RepositoryError>>;
}
