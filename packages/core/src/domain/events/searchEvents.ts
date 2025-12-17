import { DomainEvent } from "./DomainEvent";
import { EntityID } from "../value-objects/EntityID";

export class EntityIndexedEvent extends DomainEvent {
    readonly eventType = 'ENTITY_INDEXED';

    constructor(readonly aggregateID: EntityID) {
        super();
    }
}

export class EntityRemovedFromIndexEvent extends DomainEvent {
    readonly eventType = 'ENTITY_REMOVED_FROM_INDEX';

    constructor(readonly aggregateID: EntityID) {
        super();
    }
}

