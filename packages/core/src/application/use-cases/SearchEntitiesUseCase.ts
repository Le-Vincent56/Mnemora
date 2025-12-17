import { Result } from '../../domain/core/Result';
import { EntityID } from '../../domain/value-objects/EntityID';
import type {
    ISearchRepository,
    SearchQuery,
} from '../../domain/repositories/ISearchRepository';
import { SearchMode as SearchModeEnum } from '../../domain/repositories/ISearchRepository';
import type { IUseCase } from './IUseCase';
import { UseCaseError } from './UseCaseError';
import type { SearchEntitiesRequest } from '../dtos';
import type {
    SearchResponse,
    SearchResultDTO,
    SearchHighlightDTO,
} from '../dtos/ResponseDTOs';
import { EntityMapper } from '../mappers/EntityMapper';

// Default limit for search results
const DEFAULT_LIMIT = 20;

// Maximum limit for search results
const MAX_LIMIT = 100;

/**
 * Use case: Search for entities.
 */
export class SearchEntitiesUseCase implements IUseCase<SearchEntitiesRequest, SearchResponse> {
    constructor(private readonly searchRepository: ISearchRepository) { }

    async execute(
        request: SearchEntitiesRequest
    ): Promise<Result<SearchResponse, UseCaseError>> {
        // 1. Validate request
        if (!request.query?.trim()) {
            return Result.fail(UseCaseError.validation('Search query is required', 'query'));
        }

        if (!request.worldID?.trim()) {
            return Result.fail(UseCaseError.validation('World ID is required', 'worldID'));
        }

        // 2. Parse world ID
        const worldIDResult = EntityID.fromString(request.worldID);
        if (worldIDResult.isFailure) {
            return Result.fail(UseCaseError.validation('Invalid world ID', 'worldID'));
        }

        // 3. Parse optional campaign ID
        let campaignID: EntityID | undefined;
        if (request.campaignID) {
            const campaignIDResult = EntityID.fromString(request.campaignID);
            if (campaignIDResult.isFailure) {
                return Result.fail(UseCaseError.validation('Invalid campaign ID', 'campaignID'));
            }

            campaignID = campaignIDResult.value;
        }

        // 4. Detect search mode from query syntax
        const mode = this.detectSearchMode(request.query);

        // 5. Build the search query
        const limit = Math.min(request.limit ?? DEFAULT_LIMIT, MAX_LIMIT);
        const offset = request.offset ?? 0;

        const searchQuery: SearchQuery = {
            raw: request.query.trim(),
            mode,
            worldID: worldIDResult.value,
            limit,
            offset,
            ...(campaignID && { campaignID }),
            ...(request.types && request.types.length > 0 && { types: [...request.types] }),
            ...(request.tags && request.tags.length > 0 && { tags: [...request.tags] }),
        };

        // 6. Execute search
        const startTime = performance.now();
        const searchResult = await this.searchRepository.search(searchQuery);
        const queryTimeMs = performance.now() - startTime;

        if (searchResult.isFailure) {
            return Result.fail(UseCaseError.repositoryError('Search failed', searchResult.error));
        }

        const response = searchResult.value;

        // 7. Map results to DTOs
        const results: SearchResultDTO[] = response.results.map((result) => ({
            entity: EntityMapper.toDTO(result.entity),
            score: result.score,
            highlights: result.highlights.map(
                (h): SearchHighlightDTO => ({
                    field: h.field,
                    snippet: h.snippet,
                })
            ),
        }));

        // 8. Return response
        return Result.ok({
            results,
            total: response.total,
            hasMore: response.hasMore,
            queryTimeMs: Math.round(queryTimeMs * 100) / 100 // Round to 2 decimal places
        });
    }

    /**
     * Detect search mode from query syntax.
     */
    private detectSearchMode(query: string): SearchModeEnum {
        const trimmed = query.trim();

        // Check for boolean operators
        // Note: we check for operators with surrounding context to avoid
        // false positives (e.g., "don't" containing "!")
        if (
            trimmed.includes(' && ') ||
            trimmed.includes(' || ') ||
            trimmed.startsWith('!') ||
            trimmed.includes(' !')
        ) {
            return SearchModeEnum.BOOLEAN;
        }

        // Check for filter prefixes
        if (
            trimmed.includes('type:') ||
            trimmed.includes('tag:')
        ) {
            return SearchModeEnum.FILTER;
        }

        // Default to natural language search
        return SearchModeEnum.NATURAL;
    }
}