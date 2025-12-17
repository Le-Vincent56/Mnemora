import { Result } from '../../domain/core/Result';
import { EntityID } from '../../domain/value-objects/EntityID';
import type { IEntityRepository } from '../../domain/repositories/IEntityRepository';
import type { IUseCase } from './IUseCase';
import { UseCaseError } from './UseCaseError';
import type { GetEntityRequest } from '../dtos/RequestDTOs';
import type { EntityDTO } from '../dtos/EntityDTOs';
import { EntityMapper } from '../mappers/EntityMapper';

/**
 * Use case: Get a single entity by ID.
 * Simple retrieval; lados entity and returns as DTO.
 */
export class GetEntityUseCase
    implements IUseCase<GetEntityRequest, EntityDTO> {
    constructor(private readonly entityRepository: IEntityRepository) { }

    async execute(
        request: GetEntityRequest
    ): Promise<Result<EntityDTO, UseCaseError>> {
        // 1. Validate request
        if (!request.id?.trim()) {
            return Result.fail(UseCaseError.validation('Entity ID is required', 'id'));
        }

        // 2. Parse ID
        const entityIDResult = EntityID.fromString(request.id);
        if (entityIDResult.isFailure) {
            return Result.fail(UseCaseError.validation('Invalid entity ID', 'id'));
        }

        // 3. Load entity
        const findResult = await this.entityRepository.findByID(entityIDResult.value);
        if (findResult.isFailure) {
            return Result.fail(
                UseCaseError.repositoryError('Failed to load entity', findResult.error)
            );
        }

        const entity = findResult.value;
        if (!entity) {
            return Result.fail(UseCaseError.notFound('Entity', request.id));
        }

        // 4. Return DTO
        return Result.ok(EntityMapper.toDTO(entity));
    }
}