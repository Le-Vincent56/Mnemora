import { Result } from '../../domain/core/Result';
import { Session, CreateSessionProps } from '../../domain/entities/Session';
import { EntityID } from '../../domain/value-objects/EntityID';
import type { IEntityRepository } from '../../domain/repositories/IEntityRepository';
import { EntityCreatedEvent } from '../../domain/events/entityLifecycleEvents';
import { EntityType } from '../../domain/entities/EntityType';
import type { IEventBus } from '../../domain/events/IEventBus';
import type { IUseCase } from './IUseCase';
import { UseCaseError } from './UseCaseError';
import type { CreateSessionRequest } from '../dtos/RequestDTOs';
import type { SessionDTO } from '../dtos/EntityDTOs';
import { EntityMapper } from '../mappers/EntityMapper';

/**
 * Use case: Create a new Session.
 * Sessions are always campaign-scoped (campaign ID is required).
 */
export class CreateSessionUseCase
    implements IUseCase<CreateSessionRequest, SessionDTO> {
    constructor(
        private readonly entityRepository: IEntityRepository,
        private readonly eventBus: IEventBus
    ) { }

    async execute(
        request: CreateSessionRequest
    ): Promise<Result<SessionDTO, UseCaseError>> {
        // 1. Validate request (campaignId is REQUIRED for sessions)
        if (!request.name?.trim()) {
            return Result.fail(UseCaseError.validation('Name is required', 'name'));
        }
        if (!request.worldID?.trim()) {
            return Result.fail(UseCaseError.validation('World ID is required', 'worldId'));
        }
        if (!request.campaignID?.trim()) {
            return Result.fail(UseCaseError.validation('Campaign ID is required for sessions', 'campaignId'));
        }

        // 2. Parse IDs
        const worldIDResult = EntityID.fromString(request.worldID);
        if (worldIDResult.isFailure) {
            return Result.fail(UseCaseError.validation('Invalid world ID', 'worldId'));
        }

        const campaignIDResult = EntityID.fromString(request.campaignID);
        if (campaignIDResult.isFailure) {
            return Result.fail(UseCaseError.validation('Invalid campaign ID', 'campaignId'));
        }

        // 3. Parse optional session date
        let sessionDate: Date | undefined;
        if (request.sessionDate) {
            sessionDate = new Date(request.sessionDate);
            if (isNaN(sessionDate.getTime())) {
                return Result.fail(UseCaseError.validation('Invalid session date', 'sessionDate'));
            }
        }

        // 4. Build create props
        const createProps: CreateSessionProps = {
            name: request.name,
            worldID: worldIDResult.value,
            campaignID: campaignIDResult.value,
        };

        if (sessionDate) {
            createProps.sessionDate = sessionDate;
        }

        // 5. Create domain entity
        const sessionResult = Session.create(createProps);
        if (sessionResult.isFailure) {
            return Result.fail(UseCaseError.validation(sessionResult.error.message));
        }

        const session = sessionResult.value;

        // 6. Apply optional fields
        if (request.summary) {
            session.updateSummary(request.summary);
        }
        if (request.notes) {
            session.updateNotes(request.notes);
        }
        if (request.secrets) {
            session.updateSecrets(request.secrets);
        }
        if (request.tags && request.tags.length > 0) {
            const tagsResult = session.setTags(request.tags as string[]);
            if (tagsResult.isFailure) {
                return Result.fail(UseCaseError.validation(tagsResult.error.message, 'tags'));
            }
        }

        // 7. Persist
        const saveResult = await this.entityRepository.save(session);
        if (saveResult.isFailure) {
            return Result.fail(UseCaseError.repositoryError('Failed to save session', saveResult.error));
        }

        // 8. Publish event
        await this.eventBus.publish(
            new EntityCreatedEvent(session.id, EntityType.SESSION, session.worldID, session.campaignID)
        );

        // 9. Return DTO
        return Result.ok(EntityMapper.sessionToDTO(session));
    }
}