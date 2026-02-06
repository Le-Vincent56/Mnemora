import { DomainEvent } from "./DomainEvent";
import { EntityID } from "../value-objects/EntityID";

/**
 * Event raised when a new Continuity is created.
 */
export class ContinuityCreatedEvent extends DomainEvent {
    readonly eventType = 'CONTINUITY_CREATED' as const;

    constructor(
        readonly aggregateID: EntityID,
        readonly worldID: EntityID,
        readonly continuityName: string
    ) {
        super();
    }
}

/**
 * Event raised when a Continuity is updated (renamed, description changed).
 */
export class ContinuityUpdatedEvent extends DomainEvent {
    readonly eventType = 'CONTINUITY_UPDATED' as const;

    constructor(
        readonly aggregateID: EntityID,
        readonly changedFields: readonly string[]
    ) {
        super();
    }
}

/**
 * Event raised when a Continuity is deleted.
 */
export class ContinuityDeletedEvent extends DomainEvent {
    readonly eventType = 'CONTINUITY_DELETED' as const;

    constructor(
        readonly aggregateID: EntityID,
        readonly worldID: EntityID
    ) {
        super();
    }
}