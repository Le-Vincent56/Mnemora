import { Result } from '../../domain/core/Result';
import { EntityID } from '../../domain/value-objects/EntityID';
import { WorldDeletedEvent } from '../../domain/events/worldCampaignEvents';
import type { IWorldRepository } from '../../domain/repositories/IWorldRepository';
import type { IEventBus } from '../../domain/events/IEventBus';
import type { IUseCase } from './IUseCase';
import { UseCaseError } from './UseCaseError';
import type { DeleteWorldRequest } from '../dtos/RequestDTOs';

export class DeleteWorldUseCase implements IUseCase<DeleteWorldRequest, void> {
    constructor(
        private readonly worldRepository: IWorldRepository,
        private readonly eventBus: IEventBus
    ) { }

    async execute(request: DeleteWorldRequest): Promise<Result<void, UseCaseError>> {
        // 1. Validate ID
        if (!request.id?.trim()) {
            return Result.fail(UseCaseError.validation('World ID is required', 'id'));
        }

        const idResult = EntityID.fromString(request.id);
        if (idResult.isFailure) {
            return Result.fail(UseCaseError.validation('Invalid world ID', 'id'));
        }

        const worldID = idResult.value;

        // 2. Delete (campaigns cascade automatically via SQL foreign key)
        const deleteResult = await this.worldRepository.delete(worldID);
        if (deleteResult.isFailure) {
            return Result.fail(UseCaseError.repositoryError('Failed to delete world', deleteResult.error));
        }

        // 3. Publish event
        await this.eventBus.publish(new WorldDeletedEvent(worldID));

        return Result.ok(undefined);
    }
}