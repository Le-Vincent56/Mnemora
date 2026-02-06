import { Result } from '../core/Result';
import { RepositoryError } from '../core/errors';
import { EntityID } from '../value-objects/EntityID';
import { Drift } from '../types/Drift';

/**
 * IDriftRepository: Interface for drift record persistence.
 * Defined in domain layer, implemented in infrastructure.
 */
export interface IDriftRepository {
    /**
     * Saves a drift record (insert or update).
     * Upserts on (entity_id, continuity_id, field) to avoid duplicates.
     */
    save(drift: Drift): Promise<Result<void, RepositoryError>>;

    /**
     * Finds all unresolved drifts for a specific entity.
     */
    findByEntity(entityID: EntityID): Promise<Result<Drift[], RepositoryError>>;

    /**
     * Finds all unresolved drifts for a specific continuity.
     */
    findByContinuity(continuityID: EntityID): Promise<Result<Drift[], RepositoryError>>;

    /**
     * Finds all unresolved drifts across the system.
     * Optionally filtered by entity or continuity.
     */
    findUnresolved(filter?: {
        entityID?: EntityID;
        continuityID?: EntityID;
    }): Promise<Result<Drift[], RepositoryError>>;

    /**
     * Marks a drift as resolved (sets resolvedAt to now).
     */
    resolve(driftId: EntityID): Promise<Result<void, RepositoryError>>;

    /**
     * Resolves all drifts matching an entity+field+continuity combination.
     * Used when a re-edit brings the value back into alignment.
     */
    resolveByMatch(
        entityID: EntityID,
        continuityID: EntityID,
        field: string
    ): Promise<Result<void, RepositoryError>>;

    /**
     * Deletes all drifts for an entity (used on entity deletion).
     */
    deleteByEntity(entityId: EntityID): Promise<Result<void, RepositoryError>>;
}