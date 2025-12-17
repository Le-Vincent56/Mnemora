import { Result } from '../../domain/core/Result';
import { EntityID } from '../../domain/value-objects/EntityID';
import type {
    IEntityRepository,
    EntityFilter,
    PaginationOptions,
} from '../../domain/repositories/IEntityRepository';
import type { IUseCase } from './IUseCase';
import { UseCaseError } from './UseCaseError';
import type { ListEntitiesRequest } from '../dtos/RequestDTOs';
import type { EntityListResponse } from '../dtos/ResponseDTOs';
import { EntityMapper } from '../mappers/EntityMapper';

/** Default limit for list results */
const DEFAULT_LIMIT = 50;

/** Maximum limit for list results */
const MAX_LIMIT = 200;

/**
 * Use case: List entities with filtering and pagination.
 * This use case retrieves entities based on:
 * - World scope (required)
 * - Campaign scope (optional)
 * - Entity types filter (optional)
 * - Tags filter (optional)
 * - Include/exclude forked entities
 * - Pagination (limit/offset)
 */
export class ListEntitiesUseCase
    implements IUseCase<ListEntitiesRequest, EntityListResponse> {
    constructor(private readonly entityRepository: IEntityRepository) { }

    async execute(
        request: ListEntitiesRequest
    ): Promise<Result<EntityListResponse, UseCaseError>> {
        // 1. Validate request
        if (!request.worldID?.trim()) {
            return Result.fail(UseCaseError.validation('World ID is required', 'worldId'));
        }

        // 2. Parse world ID
        const worldIDResult = EntityID.fromString(request.worldID);
        if (worldIDResult.isFailure) {
            return Result.fail(UseCaseError.validation('Invalid world ID', 'worldId'));
        }

        // 3. Parse optional campaign ID
        let campaignID: EntityID | undefined;
        if (request.campaignID) {
            const campaignIDResult = EntityID.fromString(request.campaignID);
            if (campaignIDResult.isFailure) {
                return Result.fail(UseCaseError.validation('Invalid campaign ID', 'campaignId'));
            }
            campaignID = campaignIDResult.value;
        }

        // 4. Build filter
        const filter: EntityFilter = {
            worldID: worldIDResult.value,
        };

        if (campaignID) {
            filter.campaignID = campaignID;
        }
        if (request.types && request.types.length > 0) {
            filter.types = [...request.types];
        }
        if (request.tags && request.tags.length > 0) {
            filter.tags = [...request.tags];
        }
        if (request.includeForked !== undefined) {
            filter.includeForked = request.includeForked;
        }

        // 5. Build pagination
        const pagination: PaginationOptions = {
            limit: Math.min(request.limit ?? DEFAULT_LIMIT, MAX_LIMIT),
            offset: request.offset ?? 0,
        };

        // 6. Execute query
        const listResult = await this.entityRepository.findByFilter(filter, pagination);
        if (listResult.isFailure) {
            return Result.fail(
                UseCaseError.repositoryError('Failed to list entities', listResult.error)
            );
        }

        const paginatedResult = listResult.value;

        // 7. Map to DTOs
        const entities = EntityMapper.toDTOs(paginatedResult.items);

        // 8. Return response
        return Result.ok({
            entities,
            total: paginatedResult.total,
            hasMore: paginatedResult.hasMore,
        });
    }
}