import type {
    EntityDTO,
    ListEntitiesRequest,
} from '../../application/dtos';
import type { ListEntitiesUseCase } from '../../application/use-cases/ListEntitiesUseCase';
import type { EntityType } from '../../domain/entities/EntityType';
import type { IViewModel, ViewModelError } from './types';
import { ViewModelError as VMError } from './types';

/**
 * Configuration options for EntityListViewModel.
 */
export interface EntityListViewModelOptions {
    pageSize?: number; // Page size for pagination
}

/**
 * ViewModel for paginated entity lists with filtering.
 */
export class EntityListViewModel implements IViewModel {
    private _entities: EntityDTO[] = [];
    private _total: number = 0;
    private _hasMore: boolean = false;
    private _isLoading: boolean = false;
    private _isLoadingMore: boolean = false;
    private _isRefreshing: boolean = false;
    private _error: ViewModelError | null = null;

    private _worldID: string | null = null;
    private _campaignID: string | null = null;
    private _typeFilter: EntityType[] = [];
    private _tagFilter: string[] = [];
    private _includeForked: boolean = true;

    private readonly _pageSize: number;

    get entities(): readonly EntityDTO[] {
        return this._entities;
    }

    get total(): number {
        return this._total;
    }

    get hasMore(): boolean {
        return this._hasMore;
    }

    get isLoading(): boolean {
        return this._isLoading;
    }

    get isLoadingMore(): boolean {
        return this._isLoadingMore;
    }

    get isRefreshing(): boolean {
        return this._isRefreshing;
    }

    get error(): ViewModelError | null {
        return this._error;
    }

    get isEmpty(): boolean {
        return this._entities.length === 0 && !this._isLoading;
    }

    get count(): number {
        return this._entities.length;
    }

    get hasContext(): boolean {
        return this._worldID !== null;
    }

    get worldID(): string | null {
        return this._worldID;
    }

    get campaignID(): string | null {
        return this._campaignID;
    }

    get typeFilter(): readonly EntityType[] {
        return this._typeFilter;
    }

    get tagFilter(): readonly string[] {
        return this._tagFilter;
    }

    get includeForked(): boolean {
        return this._includeForked;
    }

    constructor(
        private readonly _listEntitiesUseCase: ListEntitiesUseCase,
        options: EntityListViewModelOptions = {}
    ) {
        this._pageSize = options.pageSize ?? 20;
    }

    /**
     * Set the context (world and optional campaign).
     * Automatically reloads the list if context changes.
     */
    async setContext(worldID: string, campaignID?: string): Promise<void> {
        const contextChanged = this._worldID !== worldID || this._campaignID !== (campaignID ?? null);

        this._worldID = worldID;
        this._campaignID = campaignID ?? null;

        if (contextChanged) {
            await this.load();
        }
    }

    /**
     * Set the type filter.
     * Pass empty array to clear filter.
     */
    async setTypeFilter(types: EntityType[]): Promise<void> {
        this._typeFilter = [...types];
        await this.load();
    }

    /**
     * Set the tag filter.
     * Pass empty array to clear filter.
     */
    async setTagFilter(tags: string[]): Promise<void> {
        this._tagFilter = [...tags];
        await this.load();
    }

    /**
     * Set whether to include forked entities.
     */
    async setIncludeForked(include: boolean): Promise<void> {
        this._includeForked = include;
        await this.load();
    }

    /**
     * Clear all filters (type, tag, forked).
     */
    async clearFilters(): Promise<void> {
        this._typeFilter = [];
        this._tagFilter = [];
        this._includeForked = true;
        await this.load();
    }

    /**
     * Load entities from the beginning.
     */
    async load(): Promise<void> {
        if (!this._worldID) {
            this._error = VMError.operation('Context not set. Call setContext() first.');
            return;
        }

        this._isLoading = true;
        this._error = null;

        const request = this.buildRequest(0);
        const result = await this._listEntitiesUseCase.execute(request);

        if (result.isSuccess) {
            const response = result.value;
            this._entities = [...response.entities];
            this._total = response.total;
            this._hasMore = response.hasMore;
        } else {
            this._error = VMError.fromUseCaseError(result.error);
            this._entities = [];
            this._total = 0;
            this._hasMore = false;
        }

        this._isLoading = false;
    }

    /**
     * Load more entities (for infinite scroll / pagination).
     */
    async loadMore(): Promise<void> {
        if (!this._hasMore || this._isLoading || this._isLoadingMore) {
            return;
        }

        if (!this._worldID) {
            this._error = VMError.operation('Context not set');
            return;
        }

        this._isLoadingMore = true;
        this._error = null;

        const request = this.buildRequest(this._entities.length);
        const result = await this._listEntitiesUseCase.execute(request);

        if (result.isSuccess) {
            const response = result.value;
            this._entities = [...this._entities, ...response.entities];
            this._total = response.total;
            this._hasMore = response.hasMore;
        } else {
            this._error = VMError.fromUseCaseError(result.error);
        }

        this._isLoadingMore = false;
    }

    /**
     * Refresh the list (pull-to-refresh pattern).
     * Reloads from the beginning but uses different loading state.
     */
    async refresh(): Promise<void> {
        if (!this._worldID) {
            this._error = VMError.operation('Context not set');
            return;
        }

        this._isRefreshing = true;
        this._error = null;

        const request = this.buildRequest(0);
        const result = await this._listEntitiesUseCase.execute(request);

        if (result.isSuccess) {
            const response = result.value;
            this._entities = [...response.entities];
            this._total = response.total;
            this._hasMore = response.hasMore;
        } else {
            this._error = VMError.fromUseCaseError(result.error);
        }

        this._isRefreshing = false;
    }

    /**
     * Find an entity by ID in the current list.
     */
    findById(id: string): EntityDTO | undefined {
        return this._entities.find((e) => e.id === id);
    }

    /**
     * Remove an entity from the local list (after delete).
     * Does not call the repository - just updates local state.
     */
    removeLocally(id: string): void {
        const index = this._entities.findIndex((e) => e.id === id);
        if (index !== -1) {
            this._entities = [
                ...this._entities.slice(0, index),
                ...this._entities.slice(index + 1),
            ];
            this._total = Math.max(0, this._total - 1);
        }
    }

    /**
     * Update an entity in the local list.
     * Does not call the repository - just updates local state.
     */
    updateLocally(entity: EntityDTO): void {
        const index = this._entities.findIndex((e) => e.id === entity.id);
        if (index !== -1) {
            this._entities = [
                ...this._entities.slice(0, index),
                entity,
                ...this._entities.slice(index + 1),
            ];
        }
    }

    /**
     * Add an entity to the beginning of the local list.
     * Does not call the repository - just updates local state.
     */
    addLocally(entity: EntityDTO): void {
        this._entities = [entity, ...this._entities];
        this._total += 1;
    }

    /**
     * Clear the list.
     */
    clear(): void {
        this._entities = [];
        this._total = 0;
        this._hasMore = false;
        this._error = null;
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
        // No timers or subscriptions to clean up
    }

    /**
     * Build a ListEntitiesRequest with current filters and pagination.
     */
    private buildRequest(offset: number): ListEntitiesRequest {
        if (!this._worldID) {
            throw new Error('Cannot build request: worldID not set');
        }

        return {
            worldID: this._worldID,
            limit: this._pageSize,
            offset,
            ...(this._campaignID !== null && {
                campaignID: this._campaignID
            }),
            ...(this._typeFilter.length > 0 && {
                types: [...this._typeFilter]
            }),
            ...(this._tagFilter.length > 0 && {
                tags: [...this._tagFilter]
            }),
            includeForked: this._includeForked,
        };
    }
}