import { Result } from '../../domain/core/Result';
import { EntityID } from '../../domain/value-objects/EntityID';
import type { IContinuityRepository } from '../../domain/repositories/IContinuityRepository';
import type { IUseCase } from './IUseCase';
import { UseCaseError } from './UseCaseError';
import type { ListContinuitiesRequest } from '../dtos/RequestDTOs';
import type { ContinuityDTO } from '../dtos/EntityDTOs';
import { EntityMapper } from '../mappers/EntityMapper';

export class ListContinuitiesUseCase implements IUseCase<ListContinuitiesRequest, ContinuityDTO[]> {
    constructor(private readonly continuityRepository: IContinuityRepository) { }

    async execute(request: ListContinuitiesRequest): Promise<Result<ContinuityDTO[], UseCaseError>> {
        if (!request.worldID?.trim()) {
            return Result.fail(UseCaseError.validation('World ID is required', 'worldID'));
        }

        const worldIDResult = EntityID.fromString(request.worldID);
        if (worldIDResult.isFailure) {
            return Result.fail(UseCaseError.validation('Invalid world ID', 'worldID'));
        }

        const findResult = await this.continuityRepository.findByWorld(worldIDResult.value);
        if (findResult.isFailure) {
            return Result.fail(UseCaseError.repositoryError('Failed to load continuities', findResult.error));
        }

        return Result.ok(findResult.value.map(c => EntityMapper.continuityToDTO(c)));
    }
}