import { Result } from '../../domain/core/Result';
import { EntityID } from '../../domain/value-objects/EntityID';
import type { ICampaignRepository } from '../../domain/repositories/ICampaignRepository';
import type { IUseCase } from './IUseCase';
import { UseCaseError } from './UseCaseError';
import type { GetCampaignRequest } from '../dtos/RequestDTOs';
import type { CampaignDTO } from '../dtos/EntityDTOs';
import { EntityMapper } from '../mappers/EntityMapper';

export class GetCampaignUseCase implements IUseCase<GetCampaignRequest, CampaignDTO> {
    constructor(private readonly campaignRepository: ICampaignRepository) { }

    async execute(request: GetCampaignRequest): Promise<Result<CampaignDTO, UseCaseError>> {
        // 1. Validate ID
        if (!request.id?.trim()) {
            return Result.fail(UseCaseError.validation('Campaign ID is required', 'id'));
        }

        const idResult = EntityID.fromString(request.id);
        if (idResult.isFailure) {
            return Result.fail(UseCaseError.validation('Invalid campaign ID', 'id'));
        }

        // 2. Find campaign
        const findResult = await this.campaignRepository.findById(idResult.value);
        if (findResult.isFailure) {
            return Result.fail(UseCaseError.repositoryError('Failed to find campaign', findResult.error));
        }

        const campaign = findResult.value;
        if (!campaign) {
            return Result.fail(UseCaseError.notFound('Campaign', request.id));
        }

        // 3. Return DTO
        return Result.ok(EntityMapper.campaignToDTO(campaign));
    }
}