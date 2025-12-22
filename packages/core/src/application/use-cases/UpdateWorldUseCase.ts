import { Result } from '../../domain/core/Result';
import { EntityID } from '../../domain/value-objects/EntityID';
import { WorldUpdatedEvent } from '../../domain/events/worldCampaignEvents';
import type { IWorldRepository } from '../../domain/repositories/IWorldRepository';
import type { IEventBus } from '../../domain/events/IEventBus';
import type { IUseCase } from './IUseCase';
import { UseCaseError } from './UseCaseError';
import type { UpdateWorldRequest } from '../dtos/RequestDTOs';
import type { WorldDTO } from '../dtos/EntityDTOs';
import { EntityMapper } from '../mappers/EntityMapper';

export class UpdateWorldUseCase implements IUseCase<UpdateWorldRequest, WorldDTO> {
    constructor(
        private readonly worldRepository: IWorldRepository,
        private readonly eventBus: IEventBus
    ) { }

    async execute(request: UpdateWorldRequest): Promise<Result<WorldDTO, UseCaseError>> {
        // 1. Validate ID
        if (!request.id?.trim()) {
            return Result.fail(UseCaseError.validation('World ID is required', 'id'));
        }

        const idResult = EntityID.fromString(request.id);
        if (idResult.isFailure) {
            return Result.fail(UseCaseError.validation('Invalid world ID', 'id'));
        }

        // 2. Find existing world
        const findResult = await this.worldRepository.findById(idResult.value);
        if (findResult.isFailure) {
            return Result.fail(UseCaseError.repositoryError('Failed to find world', findResult.error));
        }

        const world = findResult.value;
        if (!world) {
            return Result.fail(UseCaseError.notFound('World', request.id));
        }

        // 3. Apply changes
        const changedFields: string[] = [];

        if (request.name !== undefined) {
            const renameResult = world.rename(request.name);
            if (renameResult.isFailure) {
                return Result.fail(UseCaseError.validation(renameResult.error.message, 'name'));
            }
            changedFields.push('name');
        }

        if (request.tagline !== undefined) {
            const taglineResult = world.updateTagline(request.tagline);
            if (taglineResult.isFailure) {
                return Result.fail(UseCaseError.validation(taglineResult.error.message, 'tagline'));
            }
            changedFields.push('tagline');
        }

        // 4. Persist (only if changes were made)
        if (changedFields.length > 0) {
            const saveResult = await this.worldRepository.save(world);
            if (saveResult.isFailure) {
                return Result.fail(UseCaseError.repositoryError('Failed to save world', saveResult.error));
            }

            // 5. Publish event
            await this.eventBus.publish(
                new WorldUpdatedEvent(world.id, changedFields)
            );
        }

        // 6. Return DTO
        return Result.ok(EntityMapper.worldToDTO(world));
    }
}