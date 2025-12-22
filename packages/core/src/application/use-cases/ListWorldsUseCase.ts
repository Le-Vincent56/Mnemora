import { Result } from '../../domain/core/Result';
import type { IWorldRepository } from '../../domain/repositories/IWorldRepository';
import type { IUseCase } from './IUseCase';
import { UseCaseError } from './UseCaseError';
import type { ListWorldsRequest } from '../dtos/RequestDTOs';
import type { WorldDTO } from '../dtos/EntityDTOs';
import { EntityMapper } from '../mappers/EntityMapper';

export class ListWorldsUseCase implements IUseCase<ListWorldsRequest, WorldDTO[]> {
    constructor(private readonly worldRepository: IWorldRepository) { }

    async execute(_request: ListWorldsRequest): Promise<Result<WorldDTO[], UseCaseError>> {
        const findResult = await this.worldRepository.findAll();
        if (findResult.isFailure) {
            return Result.fail(UseCaseError.repositoryError('Failed to list worlds', findResult.error));
        }

        return Result.ok(EntityMapper.worldsToDTOs(findResult.value));
    }
}