import { Result } from '../../domain/core/Result';
import { Event } from '../../domain/entities/Event';
import { EntityID } from '../../domain/value-objects/EntityID';
import { EntityType } from '../../domain/entities/EntityType';
import type { IEntityRepository } from '../../domain/repositories/IEntityRepository';
import type { IContinuityRepository } from '../../domain/repositories/IContinuityRepository';
import { EntityCreatedEvent } from '../../domain/events/entityLifecycleEvents';
import type { IEventBus } from '../../domain/events/IEventBus';
import { EventStatePropagator } from '../../domain/services/EventStatePropagator';
import type { IUseCase } from './IUseCase';
import { UseCaseError } from './UseCaseError';
import type { CreateEventRequest } from '../dtos/RequestDTOs';
import type { EventDTO } from '../dtos/EntityDTOs';
import { EntityMapper } from '../mappers/EntityMapper';

export class CreateEventUseCase implements IUseCase<CreateEventRequest, EventDTO> {
    constructor(
        private readonly entityRepository: IEntityRepository,
        private readonly continuityRepository: IContinuityRepository,
        private readonly eventBus: IEventBus,
        private readonly propagator: EventStatePropagator
    ) { }

    async execute(request: CreateEventRequest): Promise<Result<EventDTO, UseCaseError>> {
        if (!request.name?.trim()) {
            return Result.fail(UseCaseError.validation('Name is required', 'name'));
        }
        if (!request.worldID?.trim()) {
            return Result.fail(UseCaseError.validation('World ID is required', 'worldID'));
        }
        if (!request.continuityID?.trim()) {
            return Result.fail(UseCaseError.validation('Continuity ID is required', 'continuityID'));
        }

        const worldIDResult = EntityID.fromString(request.worldID);
        if (worldIDResult.isFailure) {
            return Result.fail(UseCaseError.validation('Invalid world ID', 'worldID'));
        }

        const continuityIDResult = EntityID.fromString(request.continuityID);
        if (continuityIDResult.isFailure) {
            return Result.fail(UseCaseError.validation('Invalid continuity ID', 'continuityID'));
        }

        // Verify continuity exists
        const continuityExists = await this.continuityRepository.exists(continuityIDResult.value);
        if (continuityExists.isFailure) {
            return Result.fail(UseCaseError.repositoryError('Failed to check continuity', continuityExists.error));
        }
        if (!continuityExists.value) {
            return Result.fail(UseCaseError.notFound('Continuity', request.continuityID));
        }

        let campaignID: EntityID | undefined;
        if (request.campaignID) {
            const result = EntityID.fromString(request.campaignID);
            if (result.isFailure) {
                return Result.fail(UseCaseError.validation('Invalid campaign ID', 'campaignID'));
            }
            campaignID = result.value;
        }

        const eventResult = Event.create({
            name: request.name,
            worldID: worldIDResult.value,
            continuityID: continuityIDResult.value,
            ...(campaignID !== undefined && { campaignID }),
        });

        if (eventResult.isFailure) {
            return Result.fail(UseCaseError.validation(eventResult.error.message));
        }

        const event = eventResult.value;

        if (request.description) event.updateDescription(request.description);
        if (request.secrets) event.updateSecrets(request.secrets);
        if (request.tags && request.tags.length > 0) {
            const tagsResult = event.setTags(request.tags as string[]);
            if (tagsResult.isFailure) {
                return Result.fail(UseCaseError.validation(tagsResult.error.message, 'tags'));
            }
        }

        const saveResult = await this.entityRepository.save(event);
        if (saveResult.isFailure) {
            return Result.fail(UseCaseError.repositoryError('Failed to save event', saveResult.error));
        }

        // Propagate outcomes to target entities (no-op if no outcomes set)
        await this.propagator.propagateOutcomes(event);

        await this.eventBus.publish(
            new EntityCreatedEvent(event.id, EntityType.EVENT, event.worldID, event.campaignID)
        );

        return Result.ok(EntityMapper.eventToDTO(event));
    }
}