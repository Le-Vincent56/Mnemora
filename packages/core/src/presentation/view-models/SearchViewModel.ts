import type {
    SearchEntitiesRequest,
    SearchResultDTO,
} from '../../application/dtos';
import type { SearchEntitiesUseCase } from '../../application/use-cases/SearchEntitiesUseCase';
import type { EntityType } from '../../domain/entities/EntityType';
import type { IViewModel, ViewModelError } from './types';
import { ViewModelError as VMError } from './types';

/**
 * Configuration options for SearchViewModel.
 */
export interface SearchViewModelOptions {
    debounceMs?: number;        // Debounce delay in ms before executing search
    maxRecentSearches?: number; // Maximum number of recent searches to keep
    pageSize?: number;          // Default page size for results
}

/**
 * ViewModel for search functionality.
 */
export class SearchViewModel implements IViewModel {
    private _query: string = '';
    private _results: SearchResultDTO[] = [];
    private _total: number = 0;
    private _hasMore: boolean = false;
    private _queryTimeMs: number | null = null;
    private _isSearching: boolean = false;
    private _isLoadingMore: boolean = false;
    private _error: ViewModelError | null = null;
    private _recentSearches: string[] = [];

    private _worldID: string | null = null;
    private _campaignID: string | null = null;
    private _typeFilter: EntityType[] = [];
    private _tagFilter: string[] = [];

    private readonly _debounceMs: number;
    private readonly _maxRecentSearches: number;
    private readonly _pageSize: number;
    private _debounceTimer: ReturnType<typeof setTimeout> | null = null;

    get query(): string {
        return this._query;
    }

    get results(): readonly SearchResultDTO[] {
        return this._results;
    }

    get total(): number {
        return this._total;
    }

    get hasMore(): boolean {
        return this._hasMore;
    }

    get queryTimeMs(): number | null {
        return this._queryTimeMs;
    }

    get isSearching(): boolean {
        return this._isSearching;
    }

    get isLoadingMore(): boolean {
        return this._isLoadingMore;
    }

    get isLoading(): boolean {
        return this._isSearching || this._isLoadingMore;
    }

    get error(): ViewModelError | null {
        return this._error;
    }

    get recentSearches(): readonly string[] {
        return this._recentSearches;
    }

    get isEmpty(): boolean {
        return this._results.length === 0 && !this._isSearching
            && this._query.length > 0;
    }

    get hasContext(): boolean {
        return this._worldID !== null;
    }

    get resultCount(): number {
        return this._results.length;
    }

    constructor(
        private readonly _searchUseCase: SearchEntitiesUseCase,
        options: SearchViewModelOptions = {}
    ) {
        this._debounceMs = options.debounceMs ?? 150;
        this._maxRecentSearches = options.maxRecentSearches ??
            10;
        this._pageSize = options.pageSize ?? 20;
    }

    /**
     * Set the search context (world and optional campaign).
     * Clears results if context changes.
     */
    setContext(worldID: string, campaignID?: string): void {
        const contextChanged = this._worldID !== worldID ||
            this._campaignID !== (campaignID ?? null);

        this._worldID = worldID;
        this._campaignID = campaignID ?? null;

        if (contextChanged) {
            this.clearResults();
        }
    }

    /**
     * Set type filter for search results.
     */
    setTypeFilter(types: EntityType[]): void {
        this._typeFilter = [...types];
    }

    /**
     * Set tag filter for search results.
     */
    setTagFilter(tags: string[]): void {
        this._tagFilter = [...tags];
    }

    /**
     * Clear all filters.
     */
    clearFilters(): void {
        this._typeFilter = [];
        this._tagFilter = [];
    }

    /**
     * Update the search query.
     * Triggers a debounced search.
     */
    setQuery(query: string): void {
        this._query = query;
        this._error = null;

        this.cancelDebounce();

        if (query.trim().length === 0) {
            this.clearResults();
            return;
        }

        this._debounceTimer = setTimeout(() => {
            this.executeSearch();
        }, this._debounceMs);
    }

    /**
     * Execute search immediately (bypassing debounce).
     * Useful for "search on enter" or selecting recent search.
     */
    async searchNow(): Promise<void> {
        this.cancelDebounce();

        if (this._query.trim().length === 0) {
            this.clearResults();
            return;
        }

        await this.executeSearch();
    }

    /**
     * Load more results (pagination).
     */
    async loadMore(): Promise<void> {
        if (!this._hasMore || this._isSearching ||
            this._isLoadingMore) {
            return;
        }

        if (!this._worldID) {
            this._error = VMError.operation('Search context not set');
            return;
        }

        this._isLoadingMore = true;
        this._error = null;

        const request: SearchEntitiesRequest = {
            query: this._query,
            worldID: this._worldID,
            limit: this._pageSize,
            offset: this._results.length,
            ...(this._campaignID !== null && {
                campaignID: this._campaignID
            }),
            ...(this._typeFilter.length > 0 && {
                types: this._typeFilter
            }),
            ...(this._tagFilter.length > 0 && {
                tags: this._tagFilter
            }),
        };

        const result = await this._searchUseCase.execute(request);

        if (result.isSuccess) {
            const response = result.value;
            this._results = [...this._results, ...response.results];
            this._total = response.total;
            this._hasMore = response.hasMore;
        } else {
            this._error = VMError.fromUseCaseError(result.error);
        }

        this._isLoadingMore = false;
    }

    /**
     * Clear search results.
     */
    clearResults(): void {
        this._results = [];
        this._total = 0;
        this._hasMore = false;
        this._queryTimeMs = null;
        this._error = null;
    }

    /**
     * Clear recent search history.
     */
    clearRecentSearches(): void {
        this._recentSearches = [];
    }

    /**
     * Select a recent search query.
     * Sets the query and executes search immediately.
     */
    async selectRecentSearch(query: string): Promise<void> {
        this._query = query;
        await this.searchNow();
    }

    /**
     * Clear the current query and results.
     */
    clear(): void {
        this.cancelDebounce();
        this._query = '';
        this.clearResults();
    }

    /**
     * Clear error state.
     */
    clearError(): void {
        this._error = null;
    }

    /**
     * Clean up resources.
     */
    dispose(): void {
        this.cancelDebounce();
    }

    /**
       * Execute the search.
       */
    private async executeSearch(): Promise<void> {
        if (!this._worldID) {
            this._error = VMError.operation('Search context not set');
            return;
        }

        const trimmedQuery = this._query.trim();
        if (trimmedQuery.length === 0) {
            this.clearResults();
            return;
        }

        this._isSearching = true;
        this._error = null;

        const request: SearchEntitiesRequest = {
            query: trimmedQuery,
            worldID: this._worldID,
            limit: this._pageSize,
            offset: 0,
            ...(this._campaignID !== null && {
                campaignID:
                    this._campaignID
            }),
            ...(this._typeFilter.length > 0 && {
                types:
                    this._typeFilter
            }),
            ...(this._tagFilter.length > 0 && {
                tags:
                    this._tagFilter
            }),
        };

        const result = await this._searchUseCase.execute(request);

        if (result.isSuccess) {
            const response = result.value;
            this._results = [...response.results];
            this._total = response.total;
            this._hasMore = response.hasMore;
            this._queryTimeMs = response.queryTimeMs;

            // Add to recent searches (if not duplicate)
            this.addToRecentSearches(trimmedQuery);
        } else {
            this._error = VMError.fromUseCaseError(result.error);
            this._results = [];
            this._total = 0;
            this._hasMore = false;
        }

        this._isSearching = false;
    }

    /**
     * Cancel the debounce timer.
     */
    private cancelDebounce(): void {
        if (this._debounceTimer === null) {
            return;
        }

        clearTimeout(this._debounceTimer);
        this._debounceTimer = null;
    }

    /**
     * Add a query to recent searches.
     */
    private addToRecentSearches(query: string): void {
        // Remove if already exists (will re-add at front)
        const filtered = this._recentSearches.filter((q) => q !== query);

        // Add to front
        this._recentSearches = [query, ...filtered].slice(0, this._maxRecentSearches);
    }
}