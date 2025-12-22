import { Result } from "../core/Result";
import { RepositoryError } from "../core/errors";
import { EntityID } from "../value-objects/EntityID";
import { World } from "../entities/World";

/**
 * IWorldRepository: Interface for World persistence operations.
 * This interface is defined in the domain layer but implemented in
 * the infrastructure layer (Dependency Inversion Principle).
 * All methods return Result<T, RepositoryError> to make errors explicit.
 */
export interface IWorldRepository {
    /**
     * Finds a World by its ID.
     * Returns null if not found.
     */
    findById(id: EntityID): Promise<Result<World | null, RepositoryError>>;

    /**
     * Finds all Worlds, ordered by modified_at descending.
     */
    findAll(): Promise<Result<World[], RepositoryError>>;

    /**
     * Saves a World (insert or update).
     * If the World exists (by ID), it's updated; otherwise it's inserted.
     */
    save(world: World): Promise<Result<void, RepositoryError>>;

    /**
     * Deletes a World by ID.
     * This will cascade delete all associated Campaigns.
     * Returns success even if the World didn't exist (idempotent).
     */
    delete(id: EntityID): Promise<Result<void, RepositoryError>>;

    /**
     * Checks if a World with the given ID exists.
     */
    exists(id: EntityID): Promise<Result<boolean, RepositoryError>>;
}
