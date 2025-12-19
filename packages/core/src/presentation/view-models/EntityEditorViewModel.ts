import type {
    EntityDTO,
    UpdateEntityRequest,
    GetEntityRequest
} from '../../application/dtos';
import type { GetEntityUseCase } from '../../application/use-cases/GetEntityUseCase';
import type { UpdateEntityUseCase } from '../../application/use-cases/UpdateEntityUseCase';
import type { IEventBus, Unsubscribe } from '../../domain/events/IEventBus';
import { EntityUpdatedEvent } from '../../domain/events/entityLifecycleEvents';
import { TIMING } from '../animations';
import type { IViewModel, ViewModelError } from './types';
import { ViewModelError as VMError } from './types';

/**
 * Configuration options for EntityEditorViewModel.
 */
export interface EntityEditorViewModelOptions {
    primerDelay?: number;
}

/**
 * ViewModel for editing entities.
 */
export class EntityEditorViewModel implements IViewModel {
    private _entity: EntityDTO | null = null;
    private _originalEntity: EntityDTO | null = null;
    private _isDirty: boolean = false;
    private _isSaving: boolean = false;
    private _isLoading: boolean = false;
    private _errors: ViewModelError[] = [];
    private _primerVisible: boolean = false;
    private _currentField: string | null = null;

    private readonly _primerDelay: number;
    private _hesitationTimer: ReturnType<typeof setTimeout> | null = null;
    private readonly _unsubscribers: Unsubscribe[] = [];

    get entity(): EntityDTO | null {
        return this._entity;
    }

    get isDirty(): boolean {
        return this._isDirty;
    }

    get isSaving(): boolean {
        return this._isSaving;
    }

    get isLoading(): boolean {
        return this._isLoading;
    }

    get error(): ViewModelError | null {
        return this._errors[0] ?? null;
    }

    get primerVisible(): boolean {
        return this._primerVisible;
    }

    get currentField(): string | null {
        return this._currentField;
    }

    get canSave(): boolean {
        return this._isDirty && !this._isSaving && this._errors.length === 0 && this._entity !== null
    }

    get isLoaded(): boolean {
        return this._entity !== null
    }

    constructor(
        private readonly _getEntityUseCase: GetEntityUseCase,
        private readonly _updateEntityUseCase: UpdateEntityUseCase,
        private readonly _eventBus: IEventBus,
        options: EntityEditorViewModelOptions = {}
    ) {
        this._primerDelay = options.primerDelay ?? TIMING.primerDelay;
        this.subscribeToEvents();
    }

    async load(entityID: string): Promise<void> {
        this._isLoading = true;
        this._errors = [];

        const request: GetEntityRequest = { id: entityID };
        const result = await this._getEntityUseCase.execute(request);

        if (result.isSuccess) {
            this._entity = result.value;
            this._originalEntity = result.value;
            this._isDirty = false;
        } else {
            this._entity = null;
            this._originalEntity = null;
            this._errors = [VMError.fromUseCaseError(result.error)];
        }

        this._isLoading = false;
    }

    updateField<K extends keyof EntityDTO>(field: K, value: EntityDTO[K]): void {
        if (!this._entity) return;

        // Create a new entity object with updated field
        this._entity = {
            ...this._entity,
            [field]: value,
        };

        this._isDirty = true;
        this._errors = [];

        // Cancel hesitation timer and hide primer (user is typing)
        this.cancelHesitationTimer();
        this._primerVisible = false;
    }

    /**
     * Called when a field receives focus.
     * Starts the hesitation timer for primer display.
     */
    onFieldFocus(field: string): void {
        this._currentField = field;
        this.startHesitationTimer(field);
    }

    /**
     * Called when a field loses focus.
     * Cancels the hesitation timer and hides primer.
     */
    onFieldBlur(): void {
        this.cancelHesitationTimer();
        this._primerVisible = false;
        this._currentField = null;
    }

    /**
     * Save the current entity.
     * @returns True if the save succeeded, otherwise false.
     */
    async save(): Promise<boolean> {
        if (!this._entity || !this._isDirty) {
            return true;
        }

        this._isSaving = true;
        this._errors = [];

        const request: UpdateEntityRequest = this.buildUpdateRequest();
        const result = await this._updateEntityUseCase.execute(request);

        if (result.isSuccess) {
            this._entity = result.value;
            this._originalEntity = result.value;
            this._isDirty = false;
            this._isSaving = false;
            return true;
        } else {
            this._errors = [VMError.fromUseCaseError(result.error)];
            this._isSaving = false;
            return false;
        }
    }

    /**
     * Discard changes and revert to the original entity state.
     */
    discardChanges(): void {
        if (!this._originalEntity) return;

        this._entity = this._originalEntity;
        this._isDirty = false;
        this._errors = [];
    }

    /**
     * Hide the primer hint.
     */
    hidePrimer(): void {
        this._primerVisible = false;
    }

    /**
     * Show the primer hint (called after shuffle or manual trigger).
     */
    showPrimer(): void {
        this._primerVisible = true;
    }

    /**
     * Clear all errors.
     */
    clearErrors(): void {
        this._errors = [];
    }

    /**
     * Reset the ViewModel to its initial state.
     */
    reset(): void {
        this.cancelHesitationTimer();
        this._entity = null;
        this._originalEntity = null;
        this._isDirty = false;
        this._isSaving = false;
        this._isLoading = false;
        this._errors = [];
        this._primerVisible = false;
        this._currentField = null;
    }

    /**
     * Clean up resources.
     */
    dispose(): void {
        this.cancelHesitationTimer();
        this._unsubscribers.forEach((unsub) => unsub());
        this._unsubscribers.length = 0;
    }

    /**
     * Subscribe to relevant domain events.
     */
    private subscribeToEvents(): void {
        // Listen for external updates to the entity we're editing
        const unsub = this._eventBus.subscribe(
            'ENTITY_UPDATED',
            (event: EntityUpdatedEvent) => {
                if (!this._entity || event.aggregateID.toString() !== this._entity.id) {
                    return;
                }

                if (this._isDirty) {
                    return;
                }

                this.load(this._entity.id);
            }
        );
        this._unsubscribers.push(unsub);
    }

    /**
     * Start the hesitation timer for the primer display.
     */
    private startHesitationTimer(field: string): void {
        this.cancelHesitationTimer();

        this._hesitationTimer = setTimeout(() => {
            // Only show primer if the field is empty
            if (!this._entity || !this.isFieldEmpty(field)) {
                return;
            }
            this._primerVisible = true;
        }, this._primerDelay);
    }

    /**
     * Cancel the hesitation timer.
     */
    private cancelHesitationTimer(): void {
        if (this._hesitationTimer === null) {
            return;
        }

        clearTimeout(this._hesitationTimer);
        this._hesitationTimer = null;
    }

    /**
     * Check if a field is empty (for primer logic).
     */
    private isFieldEmpty(field: string): boolean {
        if (!this.entity) return false;

        const value = (this._entity as unknown as Record<string, unknown>)[field];

        if (value === null || value === undefined) return true;
        if (typeof value === 'string') return value.trim().length === 0;
        if (Array.isArray(value)) return value.length === 0;

        return false;
    }

    /**
     * Build an UpdateEntityRequest from the current entity state.
     */
    private buildUpdateRequest(): UpdateEntityRequest {
        if (!this._entity) {
            throw new Error('Cannot build update request: no entity loaded');
        }

        // Build request with all editable fields
        // The use case will determine which fields actually changed
        return {
            id: this._entity.id,
            name: this._entity.name,
            tags: [...this._entity.tags],
            ...this.getTypeSpecificFields(),
        };
    }

    private getTypeSpecificFields():
        Partial<UpdateEntityRequest> {
        if (!this._entity) return {};

        const entity = this._entity as unknown as Record<string, unknown>;
        const fields: Record<string, unknown> = {};

        // Common optional fields
        if ('description' in entity) {
            fields.description = entity.description;
        }
        if ('secrets' in entity) {
            fields.secrets = entity.secrets;
        }
        if ('content' in entity) {
            fields.content = entity.content;
        }
        if ('summary' in entity) {
            fields.summary = entity.summary;
        }
        if ('notes' in entity) {
            fields.notes = entity.notes;
        }
        if ('sessionDate' in entity) {
            fields.sessionDate = entity.sessionDate;
        }

        return fields;
    }
}