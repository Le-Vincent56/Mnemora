import { Result } from '../../domain/core/Result';
import { EntityID } from '../../domain/value-objects/EntityID';
import type { ICampaignRepository } from '../../domain/repositories/ICampaignRepository';
import type { IUseCase } from './IUseCase';
import { UseCaseError } from './UseCaseError';
import type { ListCampaignsRequest } from '../dtos/RequestDTOs';
import type { CampaignDTO } from '../dtos/EntityDTOs';
import { EntityMapper } from '../mappers/EntityMapper';

export class ListCampaignsUseCase implements IUseCase<ListCampaignsRequest, CampaignDTO[]> {
    constructor(private readonly campaignRepository: ICampaignRepository) { }

    async execute(request: ListCampaignsRequest): Promise<Result<CampaignDTO[], UseCaseError>> {
        // 1. Validate world ID
        if (!request.worldID?.trim()) {
            return Result.fail(UseCaseError.validation('World ID is required', 'worldID'));
        }

        const worldIDResult = EntityID.fromString(request.worldID);
        if (worldIDResult.isFailure) {
            return Result.fail(UseCaseError.validation('Invalid world ID', 'worldID'));
        }

        // 2. Find campaigns
        const findResult = await this.campaignRepository.findByWorld(worldIDResult.value);
        if (findResult.isFailure) {
            return Result.fail(UseCaseError.repositoryError('Failed to list campaigns', findResult.error));
        }

        // 3. Return DTOs
        return Result.ok(EntityMapper.campaignsToDTOs(findResult.value));
    }
}