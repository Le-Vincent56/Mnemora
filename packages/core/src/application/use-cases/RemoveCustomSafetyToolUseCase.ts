import { Result } from '../../domain/core/Result';
import { EntityID } from '../../domain/value-objects/EntityID';
import type { ISafetyToolRepository } from '../../domain/repositories/ISafetyToolRepository';
import type { ICampaignRepository } from '../../domain/repositories/ICampaignRepository';
import type { IUseCase } from './IUseCase';
import { UseCaseError } from './UseCaseError';
import type { RemoveCustomSafetyToolRequest, SafetyToolConfigurationDTO } from '../dtos/SafetyToolDTOs';
import { SafetyToolDTOMapper } from '../mappers/SafetyToolDTOMapper';

export class RemoveCustomSafetyToolUseCase implements IUseCase<RemoveCustomSafetyToolRequest, SafetyToolConfigurationDTO> {
    constructor(
        private readonly safetyToolRepository: ISafetyToolRepository,
        private readonly campaignRepository: ICampaignRepository
    ) { }

    async execute(request: RemoveCustomSafetyToolRequest): Promise<Result<SafetyToolConfigurationDTO, UseCaseError>> {
        // 1. Validate request
        if (!request.campaignId?.trim()) {
            return Result.fail(UseCaseError.validation('Campaign ID is required', 'campaignId'));
        }
        if (!request.customId?.trim()) {
            return Result.fail(UseCaseError.validation('Custom tool ID is required', 'customId'));
        }

        const campaignIdResult = EntityID.fromString(request.campaignId);
        if (campaignIdResult.isFailure) {
            return Result.fail(UseCaseError.validation('Invalid campaign ID format', 'campaignId'));
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

        // 3. Find configuration
        const findResult = await this.safetyToolRepository.findByCampaignId(campaignId);
        if (findResult.isFailure) {
            return Result.fail(UseCaseError.repositoryError('Failed to retrieve safety tools', findResult.error));
        }

        const config = findResult.value;
        if (!config) {
            return Result.fail(UseCaseError.notFound('SafetyToolConfiguration', request.campaignId));
        }

        // 4. Verify custom tool exists
        const customTool = config.getCustomTool(request.customId);
        if (!customTool) {
            return Result.fail(UseCaseError.notFound('CustomSafetyTool', request.customId));
        }

        // 5. Remove custom tool (domain logic)
        config.removeCustomTool(request.customId);

        // 6. Persist
        const saveResult = await this.safetyToolRepository.save(config);
        if (saveResult.isFailure) {
            return Result.fail(UseCaseError.repositoryError('Failed to save safety tools', saveResult.error));
        }

        // 7. Return DTO
        return Result.ok(SafetyToolDTOMapper.configToDTO(config));
    }
}