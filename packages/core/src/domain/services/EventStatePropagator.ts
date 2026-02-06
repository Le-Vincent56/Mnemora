import { Result } from '../core/Result';
import { ValidationError } from '../core/errors';
import type { IEntityRepository } from '../repositories/IEntityRepository';
import { BaseEntity } from '../entities/BaseEntity';
import { Event } from '../entities/Event';
import { EntityType } from '../entities/EntityType';
import { EntityID } from '../value-objects/EntityID';
import { parseEventOutcomes } from '../value-objects/EventOutcome';

export interface PropagationWarning {
    readonly entityID: string;
    readonly field: string;
    readonly reason: string;
}

export interface PropagationResult {
    readonly applied: ReadonlyArray<{ entityID: string; field: string; toValue: string }>;
    readonly warnings: readonly PropagationWarning[];
}

/**
 * EventStatePropagator: Domain service that propagates Event outcomes
 * to the referenced entities.
 *
 * Resolution rule: if multiple Events in the same continuity affect
 * the same entity+field, the Event with the latest inWorldTime wins.
 */
export class EventStatePropagator {
    constructor(
        private readonly entityRepository: IEntityRepository
    ) { }

    /**
     * Propagates the outcomes of the given event to target entities.
     * Called synchronously from CreateEventUseCase and UpdateEntityUseCase.
     */
    async propagateOutcomes(event: Event): Promise<PropagationResult> {
        const outcomes = parseEventOutcomes(event.typeSpecificFields.outcomes);
        if (outcomes.length === 0) {
            return { applied: [], warnings: [] };
        }

        const continuityID = event.continuityID;

        // Load all events in this continuity to determine latest state per field
        const allEventsResult = await this.entityRepository.findByFilter(
            { continuityID, types: [EntityType.EVENT] },
            { limit: 10000, offset: 0 }
        );

        if (allEventsResult.isFailure) {
            return {
                applied: [],
                warnings: [{ entityID: '', field: '', reason: 'Failed to load continuity events for resolution' }],
            };
        }

        const allEvents = allEventsResult.value.items as Event[];
        const applied: Array<{ entityID: string; field: string; toValue: string }> = [];
        const warnings: PropagationWarning[] = [];

        // Collect unique entity+field pairs affected by THIS event's outcomes
        const affectedPairs = new Map<string, { entityIDStr: string; field: string }>();
        for (const o of outcomes) {
            const key = `${o.entityID}:${o.field}`;
            if (!affectedPairs.has(key)) {
                affectedPairs.set(key, { entityIDStr: o.entityID, field: o.field });
            }
        }

        for (const { entityIDStr, field } of affectedPairs.values()) {

            // Find the winning value across all events for this entity+field
            const winningValue = this.findLatestValue(allEvents, entityIDStr, field);
            if (winningValue === null) {
                warnings.push({
                    entityID: entityIDStr, field, reason: 'No events with inWorldTime found for this entity+field'
                });
                continue;
            }

            // Load target entity
            const entityIdResult = EntityID.fromString(entityIDStr);
            if (entityIdResult.isFailure) {
                warnings.push({ entityID: entityIDStr, field, reason: 'Invalid entity ID in outcome' });
                continue;
            }

            const findResult = await this.entityRepository.findByID(entityIdResult.value);
            if (findResult.isFailure || !findResult.value) {
                warnings.push({ entityID: entityIDStr, field, reason: 'Referenced entity not found' });
                continue;
            }

            const targetEntity = findResult.value;

            // Apply the winning value
            const applyResult = this.applyFieldToEntity(targetEntity, field, winningValue);
            if (!applyResult.success) {
                warnings.push({ entityID: entityIDStr, field, reason: applyResult.warning! });
                continue;
            }

            // Save updated entity
            const saveResult = await this.entityRepository.save(targetEntity);
            if (saveResult.isFailure) {
                warnings.push({ entityID: entityIDStr, field, reason: 'Failed to save updated entity' });
                continue;
            }

            applied.push({ entityID: entityIDStr, field, toValue: winningValue });
        }

        return { applied, warnings };
    }

    /**
     * Finds the latest (by inWorldTime) event-derived value for an entity+field
     * across all events in a set.
     */
    findLatestValue(
        events: Event[],
        targetEntityId: string,
        targetField: string
    ): string | null {
        let latestTime: string | null = null;
        let latestValue: string | null = null;

        for (const event of events) {
            const eventTime = event.typeSpecificFields.inWorldTime;
            if (!eventTime) continue;

            const outcomes = parseEventOutcomes(event.typeSpecificFields.outcomes);
            for (const outcome of outcomes) {
                if (outcome.entityID === targetEntityId && outcome.field === targetField) {
                    if (latestTime === null || eventTime > latestTime) {
                        latestTime = eventTime;
                        latestValue = outcome.toValue;
                    }
                }
            }
        }

        return latestValue;
    }

    /**
     * Routes a field name to the appropriate entity setter.
     * Core fields: name → rename(), description → updateDescription(), secrets → updateSecrets()
     * All others: setTypeSpecificField()
     */
    private applyFieldToEntity(
        entity: BaseEntity,
        field: string,
        value: string
    ): { success: boolean; warning?: string } {
        if (field === 'name') {
            const typed = entity as BaseEntity & { rename(v: string): Result<void, ValidationError> };
            if (typeof typed.rename !== 'function') {
                return { success: false, warning: `Entity type ${entity.type} does not support rename` };
            }
            const result = typed.rename(value);
            return result.isSuccess
                ? { success: true }
                : { success: false, warning: result.error.message };
        }

        if (field === 'description') {
            const typed = entity as BaseEntity & { updateDescription?: (v: string) => void };
            if (typeof typed.updateDescription !== 'function') {
                return { success: false, warning: `Entity type ${entity.type} does not support 'description'` };
            }
            typed.updateDescription(value);
            return { success: true };
        }

        if (field === 'secrets') {
            const typed = entity as BaseEntity & { updateSecrets?: (v: string) => void };
            if (typeof typed.updateSecrets !== 'function') {
                return { success: false, warning: `Entity type ${entity.type} does not support 'secrets'` };
            }
            typed.updateSecrets(value);
            return { success: true };
        }

        // Type-specific field
        const typed = entity as BaseEntity & {
            setTypeSpecificField?: (f: string, v: string | undefined) => Result<void, ValidationError> | null;
        };
        if (typeof typed.setTypeSpecificField !== 'function') {
            return { success: false, warning: `Entity type ${entity.type} does not support type-specific fields` };
        }

        const result = typed.setTypeSpecificField(field, value);
        if (result === null) {
            return { success: false, warning: `'${field}' is not a valid field for entity type ${entity.type}` };
        }
        return result.isSuccess
            ? { success: true }
            : { success: false, warning: result.error.message };
    }
}