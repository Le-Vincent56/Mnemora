import { Result } from '../../domain/core/Result';
import { Campaign } from '../../domain/entities/Campaign';
import { EntityID } from '../../domain/value-objects/EntityID';
import { CampaignCreatedEvent } from '../../domain/events/worldCampaignEvents';
import type { ICampaignRepository } from '../../domain/repositories/ICampaignRepository';
import type { IContinuityRepository } from '../../domain/repositories/IContinuityRepository';
import type { IWorldRepository } from '../../domain/repositories/IWorldRepository';
import type { IEventBus } from '../../domain/events/IEventBus';
import type { IUseCase } from './IUseCase';
import { UseCaseError } from './UseCaseError';
import type { CreateCampaignRequest } from '../dtos/RequestDTOs';
import type { CampaignDTO } from '../dtos/EntityDTOs';
import { EntityMapper } from '../mappers/EntityMapper';

export class CreateCampaignUseCase implements IUseCase<CreateCampaignRequest, CampaignDTO> {
    constructor(
        private readonly campaignRepository: ICampaignRepository,
        private readonly continuityRepository: IContinuityRepository,
        private readonly worldRepository: IWorldRepository,
        private readonly eventBus: IEventBus
    ) { }

    async execute(request: CreateCampaignRequest): Promise<Result<CampaignDTO, UseCaseError>> {
        // 1. Validate request
        if (!request.name?.trim()) {
            return Result.fail(UseCaseError.validation('Name is required', 'name'));
        }
        if (!request.worldID?.trim()) {
            return Result.fail(UseCaseError.validation('World ID is required', 'worldID'));
        }
        if (!request.continuityID?.trim()) {
            return Result.fail(UseCaseError.validation('Continuity ID is required', 'continuityID'));
        }

        // 2. Parse world ID
        const worldIDResult = EntityID.fromString(request.worldID);
        if (worldIDResult.isFailure) {
            return Result.fail(UseCaseError.validation('Invalid world ID', 'worldID'));
        }

        // 3. Verify world exists
        const worldExistsResult = await this.worldRepository.exists(worldIDResult.value);
        if (worldExistsResult.isFailure) {
            return Result.fail(UseCaseError.repositoryError('Failed to check world existence', worldExistsResult.error));
        }
        if (!worldExistsResult.value) {
            return Result.fail(UseCaseError.notFound('World', request.worldID));
        }

        // 4. Parse and verify continuity
        const continuityIDResult = EntityID.fromString(request.continuityID);
        if (continuityIDResult.isFailure) {
            return Result.fail(UseCaseError.validation('Invalid continuity ID', 'continuityID'));
        }

        const continuityExists = await this.continuityRepository.exists(continuityIDResult.value);
        if (continuityExists.isFailure) {
            return Result.fail(UseCaseError.repositoryError('Failed to check continuity', continuityExists.error));
        }
        if (!continuityExists.value) {
            return Result.fail(UseCaseError.notFound('Continuity', request.continuityID));
        }

        // 5. Create domain entity
        const campaignResult = Campaign.create({
            name: request.name,
            worldID: worldIDResult.value,
            continuityID: continuityIDResult.value,
            ...(request.description !== undefined && { description: request.description }),
        });

        if (campaignResult.isFailure) {
            return Result.fail(UseCaseError.validation(campaignResult.error.message));
        }

        const campaign = campaignResult.value;

        // 6. Persist
        const saveResult = await this.campaignRepository.save(campaign);
        if (saveResult.isFailure) {
            return Result.fail(UseCaseError.repositoryError('Failed to save campaign', saveResult.error));
        }

        // 7. Publish event
        await this.eventBus.publish(
            new CampaignCreatedEvent(campaign.id, campaign.worldID, campaign.name.toString())
        );

        // 8. Return DTO
        return Result.ok(EntityMapper.campaignToDTO(campaign));
    }
}