import { Result } from '../../domain/core/Result';
import { Continuity } from '../../domain/entities/Continuity';
import { EntityID } from '../../domain/value-objects/EntityID';
import { ContinuityCreatedEvent } from '../../domain/events/continuityEvents';
import type { IContinuityRepository } from '../../domain/repositories/IContinuityRepository';
import type { IWorldRepository } from '../../domain/repositories/IWorldRepository';
import type { IEventBus } from '../../domain/events/IEventBus';
import type { IUseCase } from './IUseCase';
import { UseCaseError } from './UseCaseError';
import type { CreateContinuityRequest } from '../dtos/RequestDTOs';
import type { ContinuityDTO } from '../dtos/EntityDTOs';
import { EntityMapper } from '../mappers/EntityMapper';

export class CreateContinuityUseCase implements IUseCase<CreateContinuityRequest, ContinuityDTO> {
    constructor(
        private readonly continuityRepository: IContinuityRepository,
        private readonly worldRepository: IWorldRepository,
        private readonly eventBus: IEventBus,
    ) { }

    async execute(request: CreateContinuityRequest): Promise<Result<ContinuityDTO, UseCaseError>> {
        if (!request.name?.trim()) {
            return Result.fail(UseCaseError.validation('Name is required', 'name'));
        }
        if (!request.worldID?.trim()) {
            return Result.fail(UseCaseError.validation('World ID is required', 'worldID'));
        }

        const worldIDResult = EntityID.fromString(request.worldID);
        if (worldIDResult.isFailure) {
            return Result.fail(UseCaseError.validation('Invalid world ID', 'worldID'));
        }

        const worldExistsResult = await this.worldRepository.exists(worldIDResult.value);
        if (worldExistsResult.isFailure) {
            return Result.fail(UseCaseError.repositoryError('Failed to check world existence', worldExistsResult.error));
        }
        if (!worldExistsResult.value) {
            return Result.fail(UseCaseError.notFound('World', request.worldID));
        }

        let branchedFromID: EntityID | undefined;
        if (request.branchedFromID) {
            const result = EntityID.fromString(request.branchedFromID);
            if (result.isFailure) {
                return Result.fail(UseCaseError.validation('Invalid branched-from ID', 'branchedFromID'));
            }
            const exists = await this.continuityRepository.exists(result.value);
            if (exists.isFailure || !exists.value) {
                return Result.fail(UseCaseError.notFound('Continuity', request.branchedFromID));
            }
            branchedFromID = result.value;
        }

        let branchPointEventID: EntityID | undefined;
        if (request.branchPointEventID) {
            const result = EntityID.fromString(request.branchPointEventID);
            if (result.isFailure) {
                return Result.fail(UseCaseError.validation('Invalid branch point event ID', 'branchPointEventID'));
            }
            branchPointEventID = result.value;
        }

        const continuityResult = Continuity.create({
            name: request.name,
            worldID: worldIDResult.value,
            ...(branchedFromID !== undefined && { branchedFromID }),
            ...(branchPointEventID !== undefined && { branchPointEventID }),
            ...(request.description !== undefined && { description: request.description }),
        });

        if (continuityResult.isFailure) {
            return Result.fail(UseCaseError.validation(continuityResult.error.message));
        }

        const continuity = continuityResult.value;

        const saveResult = await this.continuityRepository.save(continuity);
        if (saveResult.isFailure) {
            return Result.fail(UseCaseError.repositoryError('Failed to save continuity', saveResult.error));
        }

        await this.eventBus.publish(
            new ContinuityCreatedEvent(continuity.id, continuity.worldID, continuity.name.toString())
        );

        return Result.ok(EntityMapper.continuityToDTO(continuity));
    }
}