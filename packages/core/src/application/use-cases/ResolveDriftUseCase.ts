import { Result } from '../../domain/core/Result';
import { EntityID } from '../../domain/value-objects/EntityID';
import type { IDriftRepository } from '../../domain/repositories/IDriftRepository';
import type { IUseCase } from './IUseCase';
import { UseCaseError } from './UseCaseError';
import type { ResolveDriftRequest } from '../dtos/DriftDTOs';

export class ResolveDriftUseCase implements IUseCase<ResolveDriftRequest, void> {
    constructor(
        private readonly driftRepository: IDriftRepository
    ) { }

    async execute(request: ResolveDriftRequest): Promise<Result<void, UseCaseError>> {
        if (!request.driftID?.trim()) {
            return Result.fail(UseCaseError.validation('Drift ID is required', 'driftId'));
        }

        const idResult = EntityID.fromString(request.driftID);
        if (idResult.isFailure) {
            return Result.fail(UseCaseError.validation('Invalid drift ID', 'driftId'));
        }

        const resolveResult = await this.driftRepository.resolve(idResult.value);
        if (resolveResult.isFailure) {
            return Result.fail(UseCaseError.repositoryError('Failed to resolve drift', resolveResult.error));
        }

        return Result.ok(undefined);
    }
}