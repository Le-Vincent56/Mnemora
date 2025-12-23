import { Result } from '../../domain/core/Result';
import { SafetyToolConfiguration } from '../../domain/entities/SafetyToolConfiguration';
import { EntityID } from '../../domain/value-objects/EntityID';
import type { ISafetyToolRepository } from '../../domain/repositories/ISafetyToolRepository';
import type { ICampaignRepository } from '../../domain/repositories/ICampaignRepository';
import type { IUseCase } from './IUseCase';
import { UseCaseError } from './UseCaseError';
import type { AddCustomSafetyToolRequest, SafetyToolConfigurationDTO } from '../dtos/SafetyToolDTOs';
import { SafetyToolDTOMapper } from '../mappers/SafetyToolDTOMapper';

export class AddCustomSafetyToolUseCase implements IUseCase<AddCustomSafetyToolRequest, SafetyToolConfigurationDTO> {
    constructor(
        private readonly safetyToolRepository: ISafetyToolRepository,
        private readonly campaignRepository: ICampaignRepository
    ) { }

    async execute(request: AddCustomSafetyToolRequest): Promise<Result<SafetyToolConfigurationDTO, UseCaseError>> {
        // 1. Validate request
        if (!request.campaignId?.trim()) {
            return Result.fail(UseCaseError.validation('Campaign ID is required', 'campaignId'));
        }
        if (!request.name?.trim()) {
            return Result.fail(UseCaseError.validation('Tool name is required', 'name'));
        }
        if (!request.description?.trim()) {
            return Result.fail(UseCaseError.validation('Tool description is required', 'description'));
        }
        if (!request.quickRefText?.trim()) {
            return Result.fail(UseCaseError.validation('Quick reference text is required', 'quickRefText'));
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

        // 3. Find or create configuration
        const findResult = await this.safetyToolRepository.findByCampaignId(campaignId);
        if (findResult.isFailure) {
            return Result.fail(UseCaseError.repositoryError('Failed to retrieve safety tools', findResult.error));
        }

        let config = findResult.value;
        if (!config) {
            config = SafetyToolConfiguration.createForCampaign(campaignId);
        }

        // 4. Add custom tool (domain logic)
        const addResult = config.addCustomTool(
            request.name.trim(),
            request.description.trim(),
            request.quickRefText.trim()
        );
        if (addResult.isFailure) {
            return Result.fail(UseCaseError.validation(addResult.error.message, 'name'));
        }

        // 5. Persist
        const saveResult = await this.safetyToolRepository.save(config);
        if (saveResult.isFailure) {
            return Result.fail(UseCaseError.repositoryError('Failed to save safety tools', saveResult.error));
        }

        // 6. Return DTO
        return Result.ok(SafetyToolDTOMapper.configToDTO(config));
    }
}