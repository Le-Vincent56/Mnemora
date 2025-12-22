import { Result } from '../../domain/core/Result';
import { EntityID } from '../../domain/value-objects/EntityID';
import type { IWorldRepository } from '../../domain/repositories/IWorldRepository';
import type { IUseCase } from './IUseCase';
import { UseCaseError } from './UseCaseError';
import type { GetWorldRequest } from '../dtos/RequestDTOs';
import type { WorldDTO } from '../dtos/EntityDTOs';
import { EntityMapper } from '../mappers/EntityMapper';

export class GetWorldUseCase implements IUseCase<GetWorldRequest, WorldDTO> {
    constructor(private readonly worldRepository: IWorldRepository) { }

    async execute(request: GetWorldRequest): Promise<Result<WorldDTO, UseCaseError>> {
        // 1. Validate ID
        if (!request.id?.trim()) {
            return Result.fail(UseCaseError.validation('World ID is required', 'id'));
        }

        const idResult = EntityID.fromString(request.id);
        if (idResult.isFailure) {
            return Result.fail(UseCaseError.validation('Invalid world ID', 'id'));
        }

        // 2. Find world
        const findResult = await this.worldRepository.findById(idResult.value);
        if (findResult.isFailure) {
            return Result.fail(UseCaseError.repositoryError('Failed to find world', findResult.error));
        }

        const world = findResult.value;
        if (!world) {
            return Result.fail(UseCaseError.notFound('World', request.id));
        }

        // 3. Return DTO
        return Result.ok(EntityMapper.worldToDTO(world));
    }
}