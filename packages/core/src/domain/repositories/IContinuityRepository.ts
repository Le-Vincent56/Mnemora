import { Result } from "../core/Result";
import { RepositoryError } from "../core/errors";
import { EntityID } from "../value-objects/EntityID";
import { Continuity } from "../entities/Continuity";

export interface IContinuityRepository {
    findById(id: EntityID): Promise<Result<Continuity | null, RepositoryError>>;
    findByWorld(worldID: EntityID): Promise<Result<Continuity[], RepositoryError>>;
    save(continuity: Continuity): Promise<Result<void, RepositoryError>>;
    delete(id: EntityID): Promise<Result<void, RepositoryError>>;
    exists(id: EntityID): Promise<Result<boolean, RepositoryError>>;
}