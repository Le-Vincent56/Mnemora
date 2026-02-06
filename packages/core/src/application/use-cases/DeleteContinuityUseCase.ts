import { Result } from '../../domain/core/Result';
import { EntityID } from '../../domain/value-objects/EntityID';
import { EntityType } from '../../domain/entities/EntityType';
import { ContinuityDeletedEvent } from '../../domain/events/continuityEvents';
import type { IContinuityRepository } from '../../domain/repositories/IContinuityRepository';
import type { ICampaignRepository } from '../../domain/repositories/ICampaignRepository';
import type { IEntityRepository } from '../../domain/repositories/IEntityRepository';
import type { IEventBus } from '../../domain/events/IEventBus';
import type { IUseCase } from './IUseCase';
import { UseCaseError } from './UseCaseError';
import type { DeleteContinuityRequest } from '../dtos/RequestDTOs';

export class DeleteContinuityUseCase implements IUseCase<DeleteContinuityRequest, void> {
    constructor(
        private readonly continuityRepository: IContinuityRepository,
        private readonly campaignRepository: ICampaignRepository,
        private readonly entityRepository: IEntityRepository,
        private readonly eventBus: IEventBus
    ) { }

    async execute(request: DeleteContinuityRequest): Promise<Result<void, UseCaseError>> {
        // 1. Validate ID
        if (!request.id?.trim()) {
            return Result.fail(UseCaseError.validation('Continuity ID is required', 'id'));
        }

        const idResult = EntityID.fromString(request.id);
        if (idResult.isFailure) {
            return Result.fail(UseCaseError.validation('Invalid continuity ID', 'id'));
        }

        const continuityID = idResult.value;

        // 2. Find continuity to get worldID for event
        const findResult = await this.continuityRepository.findById(continuityID);
        if (findResult.isFailure) {
            return Result.fail(UseCaseError.repositoryError('Failed to find continuity', findResult.error));
        }

        const continuity = findResult.value;
        if (!continuity) {
            return Result.fail(UseCaseError.notFound('Continuity', request.id));
        }

        // 3. Check for existing events in this continuity
        const eventCountResult = await this.entityRepository.count({
            continuityID,
            types: [EntityType.EVENT],
        });
        if (eventCountResult.isFailure) {
            return Result.fail(UseCaseError.repositoryError('Failed to check events', eventCountResult.error));
        }
        if (eventCountResult.value > 0) {
            return Result.fail(UseCaseError.conflict(
                `Cannot delete continuity: ${eventCountResult.value} event(s) still reference it. Delete the events first.`
            ));
        }

        // 4. Check for campaigns referencing this continuity
        const campaignCountResult = await this.campaignRepository.countByContinuity(continuityID);
        if (campaignCountResult.isFailure) {
            return Result.fail(UseCaseError.repositoryError('Failed to check campaigns', campaignCountResult.error));
        }
        if (campaignCountResult.value > 0) {
            return Result.fail(UseCaseError.conflict(
                `Cannot delete continuity: ${campaignCountResult.value} campaign(s) still reference it. Re-assign or delete the
  campaigns first.`
            ));
        }

        // 5. Delete
        const deleteResult = await this.continuityRepository.delete(continuityID);
        if (deleteResult.isFailure) {
            return Result.fail(UseCaseError.repositoryError('Failed to delete continuity', deleteResult.error));
        }

        // 6. Publish event
        await this.eventBus.publish(
            new ContinuityDeletedEvent(continuityID, continuity.worldID)
        );

        return Result.ok(undefined);
    }
}