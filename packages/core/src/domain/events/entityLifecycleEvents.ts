import { DomainEvent } from "./DomainEvent";
import { EntityID } from "../value-objects/EntityID";
import { EntityType } from "../entities/EntityType";

export class EntityCreatedEvent extends DomainEvent {
    readonly eventType = 'ENTITY_CREATED';

    constructor(
        readonly aggregateID: EntityID,
        readonly entityType: EntityType,
        readonly worldID: EntityID,
        readonly campaignID: EntityID | null
    ) {
        super();
    }
}

export class EntityUpdatedEvent extends DomainEvent {
    readonly eventType = 'ENTITY_UPDATED';

    constructor(
        readonly aggregateID: EntityID,
        readonly entityType: EntityType,
        readonly changedFields: readonly string[]
    ) {
        super();
    }
}

export class EntityDeletedEvent extends DomainEvent {
    readonly eventType = 'ENTITY_DELETED';
    
    constructor(
        readonly aggregateID: EntityID,
        readonly entityType: EntityType
    ) {
        super();
    }
}

export class EntityForkedEvent extends DomainEvent {
    readonly eventType = 'ENTITY_FORKED';

    constructor(
        readonly aggregateID: EntityID,
        readonly sourceEntityID: EntityID,
        readonly entityType: EntityType,
        readonly intoCampaignID: EntityID
    ) {
        super();
    }
}