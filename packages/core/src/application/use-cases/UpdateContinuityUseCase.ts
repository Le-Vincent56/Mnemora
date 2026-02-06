import { Result } from '../../domain/core/Result';
import { EntityID } from '../../domain/value-objects/EntityID';
import { ContinuityUpdatedEvent } from '../../domain/events/continuityEvents';
import type { IContinuityRepository } from '../../domain/repositories/IContinuityRepository';
import type { IEventBus } from '../../domain/events/IEventBus';
import type { IUseCase } from './IUseCase';
import { UseCaseError } from './UseCaseError';
import type { UpdateContinuityRequest } from '../dtos/RequestDTOs';
import type { ContinuityDTO } from '../dtos/EntityDTOs';
import { EntityMapper } from '../mappers/EntityMapper';

export class UpdateContinuityUseCase implements IUseCase<UpdateContinuityRequest, ContinuityDTO> {
    constructor(
        private readonly continuityRepository: IContinuityRepository,
        private readonly eventBus: IEventBus
    ) { }

    async execute(request: UpdateContinuityRequest): Promise<Result<ContinuityDTO, UseCaseError>> {
        // 1. Validate ID
        if (!request.id?.trim()) {
            return Result.fail(UseCaseError.validation('Continuity ID is required', 'id'));
        }

        const idResult = EntityID.fromString(request.id);
        if (idResult.isFailure) {
            return Result.fail(UseCaseError.validation('Invalid continuity ID', 'id'));
        }

        // 2. Find existing continuity
        const findResult = await this.continuityRepository.findById(idResult.value);
        if (findResult.isFailure) {
            return Result.fail(UseCaseError.repositoryError('Failed to find continuity', findResult.error));
        }

        const continuity = findResult.value;
        if (!continuity) {
            return Result.fail(UseCaseError.notFound('Continuity', request.id));
        }

        // 3. Apply changes
        const changedFields: string[] = [];

        if (request.name !== undefined) {
            const renameResult = continuity.rename(request.name);
            if (renameResult.isFailure) {
                return Result.fail(UseCaseError.validation(renameResult.error.message, 'name'));
            }
            changedFields.push('name');
        }

        if (request.description !== undefined) {
            continuity.updateDescription(request.description);
            changedFields.push('description');
        }

        // 4. Persist (only if changes were made)
        if (changedFields.length > 0) {
            const saveResult = await this.continuityRepository.save(continuity);
            if (saveResult.isFailure) {
                return Result.fail(UseCaseError.repositoryError('Failed to save continuity', saveResult.error));
            }

            // 5. Publish event
            await this.eventBus.publish(
                new ContinuityUpdatedEvent(continuity.id, changedFields)
            );
        }

        // 6. Return DTO
        return Result.ok(EntityMapper.continuityToDTO(continuity));
    }
}