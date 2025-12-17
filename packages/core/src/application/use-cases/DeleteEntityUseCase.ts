import { Result } from "../../domain/core/Result";
import { EntityID } from "../../domain/value-objects/EntityID";
import type { IEntityRepository } from "../../domain/repositories/IEntityRepository";
import { EntityDeletedEvent } from "../../domain/events/entityLifecycleEvents";
import type { IEventBus } from "../../domain/events/IEventBus";
import type { IUseCase } from "./IUseCase";
import { UseCaseError } from "./UseCaseError";
import { DeleteEntityRequest } from "../dtos/RequestDTOs";
import { DeleteResponse } from '../dtos/ResponseDTOs';

/**
 * Use case: Delete an entity.
 * This is a generic use case that deletes any entity type by ID.
 */
export class DeleteEntityUseCase implements IUseCase<DeleteEntityRequest, DeleteResponse> {
    constructor(
        private readonly entityRepository: IEntityRepository,
        private readonly eventBus: IEventBus
    ) { }

    async execute(request: DeleteEntityRequest): Promise<Result<DeleteResponse, UseCaseError>> {
        // 1. Validate request
        if(!request.id?.trim()) {
            return Result.fail(UseCaseError.validation('Entity ID is required', 'id'));
        }

        // 2. Parse ID
        const entityIDResult = EntityID.fromString(request.id);
        if(entityIDResult.isFailure) {
            return Result.fail(UseCaseError.validation('Invalid entity ID', 'id'));
        }

        const entityID = entityIDResult.value;

        // 3. Load entity to get its type (for the event) and verify it exists
        const findResult = await this.entityRepository.findByID(entityID);
        if(findResult.isFailure) {
            return Result.fail(
                UseCaseError.repositoryError('Failed to load entity', findResult.error)
            );
        }

        const entity = findResult.value;
        if(!entity) {
            return Result.fail(UseCaseError.notFound('Entity', request.id));
        }

        // 4. Delete
        const deleteResult = await this.entityRepository.delete(entityID);
        if(deleteResult.isFailure) {
            return Result.fail(
                UseCaseError.repositoryError('Failed to delete entity', deleteResult.error)
            );
        }

        // 5. Publish event
        await this.eventBus.publish(
            new EntityDeletedEvent(entityID, entity.type)
        );

        // 6. Return confirmation
        return Result.ok({
            deletedID: request.id
        });
    }
}