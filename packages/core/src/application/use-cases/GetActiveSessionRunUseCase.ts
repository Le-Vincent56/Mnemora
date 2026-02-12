import { Result } from '../../domain/core/Result';
import { EntityID } from '../../domain/value-objects/EntityID';
import type { ICampaignRepository } from '../../domain/repositories/ICampaignRepository';
import type { ISessionRunRepository } from '../../domain/repositories/ISessionRunRepository';
import type { IUseCase } from './IUseCase';
import { UseCaseError } from './UseCaseError';
import type { ActiveSessionRunDTO, GetActiveSessionRunRequest } from '../dtos/SessionRunDTOs';

export class GetActiveSessionRunUseCase implements IUseCase<GetActiveSessionRunRequest, ActiveSessionRunDTO | null> {
    constructor(
        private readonly campaignRepository: ICampaignRepository,
        private readonly sessionRunRepository: ISessionRunRepository
    ) { }

    async execute(request: GetActiveSessionRunRequest): Promise<Result<ActiveSessionRunDTO | null, UseCaseError>> {
        if (!request.campaignID?.trim()) {
            return Result.fail(UseCaseError.validation('Campaign ID is required', 'campaignId'));
        }

        const campaignIDResult = EntityID.fromString(request.campaignID);
        if (campaignIDResult.isFailure) {
            return Result.fail(UseCaseError.validation('Invalid campaign ID', 'campaignId'));
        }

        const existsResult = await this.campaignRepository.exists(campaignIDResult.value);
        if (existsResult.isFailure) {
            return Result.fail(UseCaseError.repositoryError('Failed to check campaign existence', existsResult.error));
        }

        if (!existsResult.value) {
            return Result.fail(UseCaseError.notFound('Campaign', request.campaignID));
        }

        const activeResult = await this.sessionRunRepository.getActiveSessionRun(campaignIDResult.value);
        if (activeResult.isFailure) {
            return Result.fail(UseCaseError.repositoryError('Failed to get active session run', activeResult.error));
        }

        const active = activeResult.value;
        if (!active) {
            return Result.ok(null);
        }

        return Result.ok({
            campaignId: active.campaignID.toString(),
            sessionId: active.sessionID.toString(),
            sessionName: active.sessionName,
            startedAt: active.startedAt.toISOString(),
        });
    }
}