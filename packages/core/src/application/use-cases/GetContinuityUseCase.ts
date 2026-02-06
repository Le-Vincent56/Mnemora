import { Result } from '../../domain/core/Result';
import { EntityID } from '../../domain/value-objects/EntityID';
import type { IContinuityRepository } from '../../domain/repositories/IContinuityRepository';
import type { IUseCase } from './IUseCase';
import { UseCaseError } from './UseCaseError';
import type { GetContinuityRequest } from '../dtos/RequestDTOs';
import type { ContinuityDTO } from '../dtos/EntityDTOs';
import { EntityMapper } from '../mappers/EntityMapper';

export class GetContinuityUseCase implements IUseCase<GetContinuityRequest, ContinuityDTO> {
    constructor(private readonly continuityRepository: IContinuityRepository) { }

    async execute(request: GetContinuityRequest): Promise<Result<ContinuityDTO, UseCaseError>> {
        if (!request.id?.trim()) {
            return Result.fail(UseCaseError.validation('Continuity ID is required', 'id'));
        }

        const idResult = EntityID.fromString(request.id);
        if (idResult.isFailure) {
            return Result.fail(UseCaseError.validation('Invalid continuity ID', 'id'));
        }

        const findResult = await this.continuityRepository.findById(idResult.value);
        if (findResult.isFailure) {
            return Result.fail(UseCaseError.repositoryError('Failed to load continuity', findResult.error));
        }

        if (!findResult.value) {
            return Result.fail(UseCaseError.notFound('Continuity', request.id));
        }

        return Result.ok(EntityMapper.continuityToDTO(findResult.value));
    }
}