import { Result } from '../../domain/core/Result';
import { EntityType } from '../../domain/entities/EntityType';
import { Session } from '../../domain/entities/Session';
import { EntityID } from '../../domain/value-objects/EntityID';
import type { IEntityRepository } from '../../domain/repositories/IEntityRepository';
import type { ICampaignRepository } from '../../domain/repositories/ICampaignRepository';
import type { ISessionRunRepository } from '../../domain/repositories/ISessionRunRepository';
import type { IUseCase } from './IUseCase';
import { UseCaseError } from './UseCaseError';
import type { EndSessionRunRequest } from '../dtos/SessionRunDTOs';

export class EndSessionRunUseCase implements IUseCase<EndSessionRunRequest, void> {
    constructor(
        private readonly entityRepository: IEntityRepository,
        private readonly campaignRepository: ICampaignRepository,
        private readonly sessionRunRepository: ISessionRunRepository
    ) { }

    async execute(request: EndSessionRunRequest): Promise<Result<void, UseCaseError>> {
        if (!request.sessionId?.trim()) {
            return Result.fail(UseCaseError.validation('Session ID is required', 'sessionId'));
        }

        if (request.durationSeconds < 0) {
            return Result.fail(UseCaseError.validation('Duration cannot be negative', 'durationSeconds'));
        }

        const sessionIDResult = EntityID.fromString(request.sessionId);
        if (sessionIDResult.isFailure) {
            return Result.fail(UseCaseError.validation('Invalid session ID', 'sessionId'));
        }

        const findResult = await this.entityRepository.findByID(sessionIDResult.value);
        if (findResult.isFailure) {
            return Result.fail(UseCaseError.repositoryError('Failed to find session', findResult.error));
        }
        
        const entity = findResult.value;
        if (!entity) {
            return Result.fail(UseCaseError.notFound('Session', request.sessionId));
        }

        if (entity.type !== EntityType.SESSION) {
            return Result.fail(UseCaseError.validation('Entity is not a session', 'sessionId'));
        }

        const session = entity as Session;
        const campaignExists = await this.campaignRepository.exists(session.campaignID);
        if (campaignExists.isFailure) {
            return Result.fail(UseCaseError.repositoryError('Failed to check campaign existence', campaignExists.error));
        }
        if (!campaignExists.value) {
            return Result.fail(UseCaseError.notFound('Campaign', session.campaignID.toString()));
        }

        const endedAt = new Date();
        const endResult = await this.sessionRunRepository.endSessionRun(
            session.campaignID,
            session.id,
            endedAt,
            request.durationSeconds
        );
        if (endResult.isFailure) {
            return Result.fail(UseCaseError.repositoryError('Failed to end session run', endResult.error));
        }

        const outcome = endResult.value;
        if (outcome.kind === 'conflict') {
            return Result.fail(
                UseCaseError.conflict(
                    `Cannot end session: campaign has a different active session (${outcome.activeSessionID.toString()})`
                )
            );
        }

        if (outcome.kind === 'not_active') {
            return Result.fail(
                UseCaseError.invalidOperation('Cannot end session: session is not active')
            );
        }
        return Result.ok(undefined);
    }
}