import { EntityID } from "../value-objects/EntityID";
import { EntityCreatedEvent, EntityDeletedEvent, EntityForkedEvent, EntityUpdatedEvent } from "./entityLifecycleEvents";
import { EntityIndexedEvent, EntityRemovedFromIndexEvent } from "./searchEvents";

/**
 * Abstract base class for all domain events.
 * Domain events represent somethign that has happened in the domain that
 * other parts of the system might want to react to. They're immutable
 * records of facts.
 */
export abstract class DomainEvent {
    /**
     * When this event occurred.
     */
    readonly occurredAt: Date;

    /**
     * Unique type identifier for this event (used for routing/subscriptions).
     */
    abstract readonly eventType: string;

    /**
     * The ID of the entity this event relates to (optional for global events).
     */
    abstract readonly aggregateID: EntityID | null;

    constructor() {
        this.occurredAt = new Date();
    }
}

export type DomainEventType =
    | EntityCreatedEvent
    | EntityUpdatedEvent
    | EntityDeletedEvent
    | EntityForkedEvent
    | EntityIndexedEvent
    | EntityRemovedFromIndexEvent;

export type DomainEventTypeName = DomainEventType['eventType'];