import { Result } from '../../domain/core/Result';
import { World } from '../../domain/entities/World';
import { WorldCreatedEvent } from '../../domain/events/worldCampaignEvents';
import type { IWorldRepository } from '../../domain/repositories/IWorldRepository';
import type { IEventBus } from '../../domain/events/IEventBus';
import type { IUseCase } from './IUseCase';
import { UseCaseError } from './UseCaseError';
import type { CreateWorldRequest } from '../dtos/RequestDTOs';
import type { WorldDTO } from '../dtos/EntityDTOs';
import { EntityMapper } from '../mappers/EntityMapper';

export class CreateWorldUseCase implements IUseCase<CreateWorldRequest, WorldDTO> {
    constructor(
        private readonly worldRepository: IWorldRepository,
        private readonly eventBus: IEventBus
    ) { }

    async execute(request: CreateWorldRequest): Promise<Result<WorldDTO, UseCaseError>> {
        // 1. Validate request
        if (!request.name?.trim()) {
            return Result.fail(UseCaseError.validation('Name is required', 'name'));
        }

        // 2. Create domain entity
        const worldResult = World.create({
            name: request.name,
            ...(request.tagline !== undefined && { tagline: request.tagline }),
        });

        if (worldResult.isFailure) {
            return Result.fail(UseCaseError.validation(worldResult.error.message));
        }

        const world = worldResult.value;

        // 3. Persist
        const saveResult = await this.worldRepository.save(world);
        if (saveResult.isFailure) {
            return Result.fail(UseCaseError.repositoryError('Failed to save world', saveResult.error));
        }

        // 4. Publish event
        await this.eventBus.publish(
            new WorldCreatedEvent(world.id, world.name.toString())
        );

        // 5. Return DTO
        return Result.ok(EntityMapper.worldToDTO(world));
    }
}