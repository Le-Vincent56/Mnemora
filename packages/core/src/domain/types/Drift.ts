import { EntityID } from '../value-objects/EntityID';

/**
 * Drift: A detected mismatch between an entity's current state and the
 * state that Events would derive for a specific field.
 *
 * Created when a GM directly edits an entity and the new value differs
 * from the latest event-derived value for that entity+field+continuity.
 */
export interface Drift {
    readonly id: EntityID;
    readonly entityID: EntityID;
    readonly continuityID: EntityID;
    readonly field: string;
    readonly eventDerivedValue: string;
    readonly currentValue: string;
    readonly detectedAt: Date;
    readonly resolvedAt: Date | null;
}

export function createDrift(props: {
    entityID: EntityID;
    continuityID: EntityID;
    field: string;
    eventDerivedValue: string;
    currentValue: string;
}): Drift {
    return {
        id: EntityID.generate(),
        entityID: props.entityID,
        continuityID: props.continuityID,
        field: props.field,
        eventDerivedValue: props.eventDerivedValue,
        currentValue: props.currentValue,
        detectedAt: new Date(),
        resolvedAt: null,
    };
}