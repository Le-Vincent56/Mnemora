import { Result } from '../../domain/core/Result';
import { EntityID } from '../../domain/value-objects/EntityID';
import type { IDriftRepository } from '../../domain/repositories/IDriftRepository';
import type { IUseCase } from './IUseCase';
import { UseCaseError } from './UseCaseError';
import type { ListDriftsRequest, DriftDTO } from '../dtos/DriftDTOs';

export class ListDriftsUseCase implements IUseCase<ListDriftsRequest, DriftDTO[]> {
    constructor(
        private readonly driftRepository: IDriftRepository
    ) { }

    async execute(request: ListDriftsRequest): Promise<Result<DriftDTO[], UseCaseError>> {
        let entityID: EntityID | undefined;
        let continuityID: EntityID | undefined;

        if (request.entityID) {
            const result = EntityID.fromString(request.entityID);
            if (result.isFailure) {
                return Result.fail(UseCaseError.validation('Invalid entity ID', 'entityId'));
            }
            entityID = result.value;
        }

        if (request.continuityID) {
            const result = EntityID.fromString(request.continuityID);
            if (result.isFailure) {
                return Result.fail(UseCaseError.validation('Invalid continuity ID', 'continuityId'));
            }
            continuityID = result.value;
        }

        const unresolvedOnly = request.unresolvedOnly !== false;

        const findResult = unresolvedOnly
            ? await this.driftRepository.findUnresolved({
                ...(entityID !== undefined && { entityID }),
                ...(continuityID !== undefined && { continuityID }),
            })
            : entityID
                ? await this.driftRepository.findByEntity(entityID)
                : continuityID
                    ? await this.driftRepository.findByContinuity(continuityID)
                    : await this.driftRepository.findUnresolved({});

        if (findResult.isFailure) {
            return Result.fail(UseCaseError.repositoryError('Failed to list drifts', findResult.error));
        }

        const dtos: DriftDTO[] = findResult.value.map(drift => ({
            id: drift.id.toString(),
            entityID: drift.entityID.toString(),
            continuityID: drift.continuityID.toString(),
            field: drift.field,
            eventDerivedValue: drift.eventDerivedValue,
            currentValue: drift.currentValue,
            detectedAt: drift.detectedAt.toISOString(),
            resolvedAt: drift.resolvedAt?.toISOString() ?? null,
        }));

        return Result.ok(dtos);
    }
}