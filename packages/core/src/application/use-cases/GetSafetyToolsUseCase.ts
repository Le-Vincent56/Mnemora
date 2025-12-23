import { Result } from '../../domain/core/Result';
import { SafetyToolConfiguration } from '../../domain/entities/SafetyToolConfiguration';
import { EntityID } from '../../domain/value-objects/EntityID';
import type { ISafetyToolRepository } from '../../domain/repositories/ISafetyToolRepository';
import type { ICampaignRepository } from '../../domain/repositories/ICampaignRepository';
import type { IUseCase } from './IUseCase';
import { UseCaseError } from './UseCaseError';
import type { GetSafetyToolsRequest, SafetyToolConfigurationDTO } from '../dtos/SafetyToolDTOs';
import { SafetyToolDTOMapper } from '../mappers/SafetyToolDTOMapper';

export class GetSafetyToolsUseCase implements IUseCase<GetSafetyToolsRequest, SafetyToolConfigurationDTO> {
    constructor(
        private readonly safetyToolRepository: ISafetyToolRepository,
        private readonly campaignRepository: ICampaignRepository
    ) { }

    async execute(request: GetSafetyToolsRequest): Promise<Result<SafetyToolConfigurationDTO, UseCaseError>> {
        // 1. Validate request
        if (!request.campaignId?.trim()) {
            return Result.fail(UseCaseError.validation('Campaign ID is required', 'campaignId'));
        }

        const campaignIdResult = EntityID.fromString(request.campaignId);
        if (campaignIdResult.isFailure) {
            return Result.fail(UseCaseError.validation('Invalid campaign ID format'));
        }
        const campaignId = campaignIdResult.value;

        // 2. Verify campaign exists
        const campaignExistsResult = await this.campaignRepository.exists(campaignId);
        if (campaignExistsResult.isFailure) {
            return Result.fail(UseCaseError.repositoryError('Failed to check campaign existence', campaignExistsResult.error));
        }
        if (!campaignExistsResult.value) {
            return Result.fail(UseCaseError.notFound('Campaign', request.campaignId));
        }

        // 3. Find existing configuration
        const findResult = await this.safetyToolRepository.findByCampaignId(campaignId);
        if (findResult.isFailure) {
            return Result.fail(UseCaseError.repositoryError('Failed to retrieve safety tools', findResult.error));
        }

        let config = findResult.value;

        // 4. If no configuration exists, create one with defaults
        if (!config) {
            config = SafetyToolConfiguration.createForCampaign(campaignId);

            const saveResult = await this.safetyToolRepository.save(config);
            if (saveResult.isFailure) {
                return Result.fail(UseCaseError.repositoryError('Failed to create default safety tools', saveResult.error));
            }
        }

        // 5. Return DTO
        return Result.ok(SafetyToolDTOMapper.configToDTO(config));
    }
}