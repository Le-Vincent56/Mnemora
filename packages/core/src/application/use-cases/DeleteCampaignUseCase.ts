import { Result } from '../../domain/core/Result';
import { EntityID } from '../../domain/value-objects/EntityID';
import { CampaignDeletedEvent } from '../../domain/events/worldCampaignEvents';
import type { ICampaignRepository } from '../../domain/repositories/ICampaignRepository';
import type { IEventBus } from '../../domain/events/IEventBus';
import type { IUseCase } from './IUseCase';
import { UseCaseError } from './UseCaseError';
import type { DeleteCampaignRequest } from '../dtos/RequestDTOs';

export class DeleteCampaignUseCase implements IUseCase<DeleteCampaignRequest, void> {
    constructor(
        private readonly campaignRepository: ICampaignRepository,
        private readonly eventBus: IEventBus
    ) { }

    async execute(request: DeleteCampaignRequest): Promise<Result<void, UseCaseError>> {
        // 1. Validate ID
        if (!request.id?.trim()) {
            return Result.fail(UseCaseError.validation('Campaign ID is required', 'id'));
        }

        const idResult = EntityID.fromString(request.id);
        if (idResult.isFailure) {
            return Result.fail(UseCaseError.validation('Invalid campaign ID', 'id'));
        }

        const campaignID = idResult.value;

        // 2. Find campaign to get worldID for event (optional but useful)
        const findResult = await this.campaignRepository.findById(campaignID);
        if (findResult.isFailure) {
            return Result.fail(UseCaseError.repositoryError('Failed to find campaign', findResult.error));
        }

        const campaign = findResult.value;
        // Note: We proceed with delete even if not found (idempotent)

        // 3. Delete
        const deleteResult = await this.campaignRepository.delete(campaignID);
        if (deleteResult.isFailure) {
            return Result.fail(UseCaseError.repositoryError('Failed to delete campaign', deleteResult.error));
        }

        // 4. Publish event (only if campaign existed)
        if (campaign) {
            await this.eventBus.publish(
                new CampaignDeletedEvent(campaignID, campaign.worldID)
            );
        }

        return Result.ok(undefined);
    }
}