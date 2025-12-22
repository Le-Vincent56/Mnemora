import { Result } from '../../domain/core/Result';
import { EntityID } from '../../domain/value-objects/EntityID';
import { CampaignUpdatedEvent } from '../../domain/events/worldCampaignEvents';
import type { ICampaignRepository } from '../../domain/repositories/ICampaignRepository';
import type { IEventBus } from '../../domain/events/IEventBus';
import type { IUseCase } from './IUseCase';
import { UseCaseError } from './UseCaseError';
import type { UpdateCampaignRequest } from '../dtos/RequestDTOs';
import type { CampaignDTO } from '../dtos/EntityDTOs';
import { EntityMapper } from '../mappers/EntityMapper';

export class UpdateCampaignUseCase implements IUseCase<UpdateCampaignRequest, CampaignDTO> {
    constructor(
        private readonly campaignRepository: ICampaignRepository,
        private readonly eventBus: IEventBus
    ) { }

    async execute(request: UpdateCampaignRequest): Promise<Result<CampaignDTO, UseCaseError>> {
        // 1. Validate ID
        if (!request.id?.trim()) {
            return Result.fail(UseCaseError.validation('Campaign ID is required', 'id'));
        }

        const idResult = EntityID.fromString(request.id);
        if (idResult.isFailure) {
            return Result.fail(UseCaseError.validation('Invalid campaign ID', 'id'));
        }

        // 2. Find existing campaign
        const findResult = await this.campaignRepository.findById(idResult.value);
        if (findResult.isFailure) {
            return Result.fail(UseCaseError.repositoryError('Failed to find campaign', findResult.error));
        }

        const campaign = findResult.value;
        if (!campaign) {
            return Result.fail(UseCaseError.notFound('Campaign', request.id));
        }

        // 3. Apply changes
        const changedFields: string[] = [];

        if (request.name !== undefined) {
            const renameResult = campaign.rename(request.name);
            if (renameResult.isFailure) {
                return Result.fail(UseCaseError.validation(renameResult.error.message, 'name'));
            }
            changedFields.push('name');
        }

        if (request.description !== undefined) {
            campaign.updateDescription(request.description);
            changedFields.push('description');
        }

        // 4. Persist (only if changes were made)
        if (changedFields.length > 0) {
            const saveResult = await this.campaignRepository.save(campaign);
            if (saveResult.isFailure) {
                return Result.fail(UseCaseError.repositoryError('Failed to save campaign', saveResult.error));
            }

            // 5. Publish event
            await this.eventBus.publish(
                new CampaignUpdatedEvent(campaign.id, changedFields)
            );
        }

        // 6. Return DTO
        return Result.ok(EntityMapper.campaignToDTO(campaign));
    }
}