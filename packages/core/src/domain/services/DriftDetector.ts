import type { IEntityRepository } from '../repositories/IEntityRepository';
import type { IDriftRepository } from '../repositories/IDriftRepository';
import { Event } from '../entities/Event';
import { EntityType } from '../entities/EntityType';
import { EntityID } from '../value-objects/EntityID';
import { parseEventOutcomes } from '../value-objects/EventOutcome';
import { createDrift } from '../types/Drift';

export interface DriftCheckInput {
    readonly entityID: EntityID;
    readonly worldID: EntityID;
    readonly changedFields: ReadonlyArray<{ field: string; newValue: string }>;
}

export interface DriftCheckResult {
    readonly driftsDetected: number;
    readonly driftsResolved: number;
}

/**
   * DriftDetector: Domain service that detects mismatches between
   * an entity's current state and the state that Events would derive.
   *
   * Called when a GM directly edits a non-Event entity. Does NOT block
   * the edit — only records drift for later reconciliation.
   */
export class DriftDetector {
    constructor(
        private readonly entityRepository: IEntityRepository,
        private readonly driftRepository: IDriftRepository
    ) { }

    /**
     * Checks for drifts after an entity has been updated.
     * For each changed field, finds the latest event-derived value
     * per continuity and compares with the new value.
     */
    async checkForDrifts(input: DriftCheckInput): Promise<DriftCheckResult> {
        let driftsDetected = 0;
        let driftsResolved = 0;

        // Load all events in the entity's world
        const eventsResult = await this.entityRepository.findByFilter(
            { worldID: input.worldID, types: [EntityType.EVENT] },
            { limit: 10000, offset: 0 }
        );

        if (eventsResult.isFailure) {
            return { driftsDetected: 0, driftsResolved: 0 };
        }

        const allEvents = eventsResult.value.items as Event[];

        // Group events by continuity
        const eventsByContinuity = new Map<string, Event[]>();
        for (const event of allEvents) {
            const contId = event.continuityID.toString();
            if (!eventsByContinuity.has(contId)) {
                eventsByContinuity.set(contId, []);
            }
            eventsByContinuity.get(contId)!.push(event);
        }

        const entityIdStr = input.entityID.toString();

        for (const { field, newValue } of input.changedFields) {
            // Check each continuity independently
            for (const [continuityIdStr, continuityEvents] of eventsByContinuity) {
                const derivedValue = this.findLatestDerivedValue(
                    continuityEvents, entityIdStr, field
                );

                const continuityId = EntityID.fromStringOrThrow(continuityIdStr);

                if (derivedValue === null) {
                    // No events target this entity+field in this continuity — no drift possible.
                    // Resolve any stale drifts.
                    await this.driftRepository.resolveByMatch(input.entityID, continuityId, field);
                    continue;
                }

                if (derivedValue !== newValue) {
                    // Drift detected
                    const drift = createDrift({
                        entityID: input.entityID,
                        continuityID: continuityId,
                        field,
                        eventDerivedValue: derivedValue,
                        currentValue: newValue,
                    });
                    await this.driftRepository.save(drift);
                    driftsDetected++;
                } else {
                    // Values match — resolve any existing drift
                    const resolveResult = await this.driftRepository.resolveByMatch(
                        input.entityID, continuityId, field
                    );
                    if (resolveResult.isSuccess) {
                        driftsResolved++;
                    }
                }
            }
        }

        return { driftsDetected, driftsResolved };
    }

    /**
     * Finds the latest event-derived value for an entity+field
     * within a set of events (single continuity).
     */
    private findLatestDerivedValue(
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
}