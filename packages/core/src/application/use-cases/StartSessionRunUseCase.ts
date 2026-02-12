import { Result } from '../../domain/core/Result';
import { EntityType } from '../../domain/entities/EntityType';
import { Session } from '../../domain/entities/Session';
import { EntityID } from '../../domain/value-objects/EntityID';
import type { IEntityRepository } from '../../domain/repositories/IEntityRepository';
import type { ICampaignRepository } from '../../domain/repositories/ICampaignRepository';
import type { ISessionRunRepository } from '../../domain/repositories/ISessionRunRepository';
import type { IUseCase } from './IUseCase';
import { UseCaseError } from './UseCaseError';
import type { ActiveSessionRunDTO, StartSessionRunRequest } from '../dtos/SessionRunDTOs';

export class StartSessionRunUseCase implements IUseCase<StartSessionRunRequest, ActiveSessionRunDTO> {
    constructor(
        private readonly entityRepository: IEntityRepository,
        private readonly campaignRepository: ICampaignRepository,
        private readonly sessionRunRepository: ISessionRunRepository
    ) { }
    
    async execute(request: StartSessionRunRequest): Promise<Result<ActiveSessionRunDTO, UseCaseError>> {
        if (!request.sessionID?.trim()) {
            return Result.fail(UseCaseError.validation('Session ID is required', 'sessionId'));
        }

        const sessionIDResult = EntityID.fromString(request.sessionID);
        if (sessionIDResult.isFailure) {
            return Result.fail(UseCaseError.validation('Invalid session ID', 'sessionId'));
        }

        const findResult = await this.entityRepository.findByID(sessionIDResult.value);
        if (findResult.isFailure) {
            return Result.fail(UseCaseError.repositoryError('Failed to find session', findResult.error));
        }

        const entity = findResult.value;
        if (!entity) {
            return Result.fail(UseCaseError.notFound('Session', request.sessionID));
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

        if (session.hasEnded) {
            return Result.fail(
                UseCaseError.invalidOperation('Cannot start a session that has already ended')
            );
        }

        const startedAt = new Date();
        const startResult = await this.sessionRunRepository.startSessionRun(
            session.campaignID,
            session.id,
            startedAt
        );
        
        if (startResult.isFailure) {
            return Result.fail(UseCaseError.repositoryError('Failed to start session run', startResult.error));
        }

        const outcome = startResult.value;
        if (outcome.kind === 'conflict') {
            return Result.fail(
                UseCaseError.conflict(
                    `Campaign already has an active session (${outcome.activeSessionID.toString()})`
                )
            );
        }

        return Result.ok({
            campaignID: session.campaignID.toString(),
            sessionID: session.id.toString(),
            sessionName: session.name.toString(),
            startedAt: outcome.startedAt.toISOString(),
        });
    }
}