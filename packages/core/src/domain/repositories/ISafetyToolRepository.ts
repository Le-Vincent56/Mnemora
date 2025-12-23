import { Result } from '../core/Result';
import { RepositoryError } from '../core/errors';
import { EntityID } from '../value-objects/EntityID';
import { SafetyToolConfiguration } from '../entities/SafetyToolConfiguration';

/**
 * ISafetyToolRepository: Interface for SafetyToolConfiguration persistence operations.
 * This interface is defined in the domain layer but implemented in
 * the infrastructure layer (Dependency Inversion Principle).
 * All methods return Result<T, RepositoryError> to make errors explicit.
 */
export interface ISafetyToolRepository {
    /**
     * Finds a SafetyToolConfiguration by its ID.
     * Returns null if not found.
     */
    findById(id: EntityID): Promise<Result<SafetyToolConfiguration | null, RepositoryError>>;

    /**
     * Finds a SafetyToolConfiguration by its campaign ID.
     * Returns null if no configuration exists for the campaign.
     * Each campaign has at most one SafetyToolConfiguration.
     */
    findByCampaignId(campaignId: EntityID): Promise<Result<SafetyToolConfiguration | null, RepositoryError>>;

    /**
     * Saves a SafetyToolConfiguration (insert or update).
     * If the configuration exists (by ID), it's updated; otherwise it's inserted.
     * This also persists all associated SafetyToolDefinitions.
     */
    save(config: SafetyToolConfiguration): Promise<Result<void, RepositoryError>>;

    /**
     * Deletes a SafetyToolConfiguration by ID.
     * This cascades to delete all associated SafetyToolDefinitions.
     * Returns success even if the configuration didn't exist (idempotent).
     */
    delete(id: EntityID): Promise<Result<void, RepositoryError>>;

    /**
     * Deletes a SafetyToolConfiguration by campaign ID.
     * Convenience method for when you have the campaign ID but not the config ID.
     */
    deleteByCampaignId(campaignId: EntityID): Promise<Result<void, RepositoryError>>;

    /**
     * Checks if a SafetyToolConfiguration exists for the given campaign.
     */
    existsForCampaign(campaignId: EntityID): Promise<Result<boolean, RepositoryError>>;
}