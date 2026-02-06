import { Result } from '../../domain/core/Result';
import { Continuity } from '../../domain/entities/Continuity';
import { Event } from '../../domain/entities/Event';
import { EntityID } from '../../domain/value-objects/EntityID';
import { EntityType } from '../../domain/entities/EntityType';
import { ContinuityCreatedEvent } from '../../domain/events/continuityEvents';
import type { IContinuityRepository } from '../../domain/repositories/IContinuityRepository';
import type { IEntityRepository } from '../../domain/repositories/IEntityRepository';
import type { IEventBus } from '../../domain/events/IEventBus';
import type { IUseCase } from './IUseCase';
import { UseCaseError } from './UseCaseError';
import type { BranchContinuityRequest } from '../dtos/RequestDTOs';
import type { ContinuityDTO } from '../dtos/EntityDTOs';
import { EntityMapper } from '../mappers/EntityMapper';

/**
 * Creates a new Continuity branched from an existing one at a specific event.
 *
 * Events before the branch point are SHARED (referenced) — timeline queries
 * walk the branchedFromID chain to include parent events. Events after the
 * branch point are excluded from the new branch.
 *
 * Entity variants are NOT copied (deferred — no continuity-scoped variant model yet).
 */
export class BranchContinuityUseCase implements IUseCase<BranchContinuityRequest, ContinuityDTO> {
    constructor(
        private readonly continuityRepository: IContinuityRepository,
        private readonly entityRepository: IEntityRepository,
        private readonly eventBus: IEventBus
    ) { }

    async execute(request: BranchContinuityRequest): Promise<Result<ContinuityDTO, UseCaseError>> {
        // 1. Validate required fields
        if (!request.name?.trim()) {
            return Result.fail(UseCaseError.validation('Name is required', 'name'));
        }
        if (!request.parentContinuityID?.trim()) {
            return Result.fail(UseCaseError.validation('Parent continuity ID is required', 'parentContinuityID'));
        }
        if (!request.branchPointEventID?.trim()) {
            return Result.fail(UseCaseError.validation('Branch point event ID is required', 'branchPointEventID'));
        }

        // 2. Parse IDs
        const parentIdResult = EntityID.fromString(request.parentContinuityID);
        if (parentIdResult.isFailure) {
            return Result.fail(UseCaseError.validation('Invalid parent continuity ID', 'parentContinuityID'));
        }

        const eventIdResult = EntityID.fromString(request.branchPointEventID);
        if (eventIdResult.isFailure) {
            return Result.fail(UseCaseError.validation('Invalid branch point event ID', 'branchPointEventID'));
        }

        // 3. Validate parent continuity exists
        const parentResult = await this.continuityRepository.findById(parentIdResult.value);
        if (parentResult.isFailure) {
            return Result.fail(UseCaseError.repositoryError('Failed to find parent continuity', parentResult.error));
        }
        if (!parentResult.value) {
            return Result.fail(UseCaseError.notFound('Continuity', request.parentContinuityID));
        }

        const parentContinuity = parentResult.value;

        // 4. Validate branch point event exists and belongs to parent continuity
        const eventResult = await this.entityRepository.findByID(eventIdResult.value);
        if (eventResult.isFailure) {
            return Result.fail(UseCaseError.repositoryError('Failed to find branch point event', eventResult.error));
        }
        if (!eventResult.value) {
            return Result.fail(UseCaseError.notFound('Event', request.branchPointEventID));
        }

        const branchPointEvent = eventResult.value;
        if (branchPointEvent.type !== EntityType.EVENT) {
            return Result.fail(UseCaseError.validation(
                'Branch point must be an Event entity', 'branchPointEventID'
            ));
        }

        const typedEvent = branchPointEvent as Event;
        if (!typedEvent.continuityID.equals(parentIdResult.value)) {
            return Result.fail(UseCaseError.validation(
                'Branch point event does not belong to the parent continuity',
                'branchPointEventID'
            ));
        }

        // 5. Validate event has inWorldTime (needed for shared query resolution)
        if (!typedEvent.typeSpecificFields.inWorldTime) {
            return Result.fail(UseCaseError.validation(
                'Branch point event must have an inWorldTime set',
                'branchPointEventID'
            ));
        }

        // 6. Create the branched continuity
        const continuityResult = Continuity.create({
            name: request.name,
            worldID: parentContinuity.worldID,
            branchedFromID: parentIdResult.value,
            branchPointEventID: eventIdResult.value,
            ...(request.description !== undefined && { description: request.description }),
        });

        if (continuityResult.isFailure) {
            return Result.fail(UseCaseError.validation(continuityResult.error.message));
        }

        const continuity = continuityResult.value;

        // 7. Save
        const saveResult = await this.continuityRepository.save(continuity);
        if (saveResult.isFailure) {
            return Result.fail(UseCaseError.repositoryError('Failed to save branched continuity', saveResult.error));
        }

        // 8. Publish event
        await this.eventBus.publish(
            new ContinuityCreatedEvent(continuity.id, continuity.worldID, continuity.name.toString())
        );

        return Result.ok(EntityMapper.continuityToDTO(continuity));
    }
}