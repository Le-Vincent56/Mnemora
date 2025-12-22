import { DomainEvent } from "./DomainEvent";
import { EntityID } from "../value-objects/EntityID";

/**
 * Event raised when a new World is created.
 */
export class WorldCreatedEvent extends DomainEvent {
    readonly eventType = 'WORLD_CREATED' as const;

    constructor(
        readonly aggregateID: EntityID,
        readonly worldName: string
    ) {
        super();
    }
}

/**
 * Event raised when a World is updated (renamed, tagline changed).
 */
export class WorldUpdatedEvent extends DomainEvent {
    readonly eventType = 'WORLD_UPDATED' as const;

    constructor(
        readonly aggregateID: EntityID,
        readonly changedFields: readonly string[]
    ) {
        super();
    }
}

/**
 * Event raised when a World is deleted.
 * Note: Associated Campaigns are cascade-deleted at the database level.
 */
export class WorldDeletedEvent extends DomainEvent {
    readonly eventType = 'WORLD_DELETED' as const;

    constructor(
        readonly aggregateID: EntityID
    ) {
        super();
    }
}

/**
 * Event raised when a new Campaign is created.
 */
export class CampaignCreatedEvent extends DomainEvent {
    readonly eventType = 'CAMPAIGN_CREATED' as const;

    constructor(
        readonly aggregateID: EntityID,
        readonly worldID: EntityID,
        readonly campaignName: string
    ) {
        super();
    }
}

/**
 * Event raised when a Campaign is updated (renamed, description changed).
 */
export class CampaignUpdatedEvent extends DomainEvent {
    readonly eventType = 'CAMPAIGN_UPDATED' as const;

    constructor(
        readonly aggregateID: EntityID,
        readonly changedFields: readonly string[]
    ) {
        super();
    }
}

/**
 * Event raised when a Campaign is deleted.
 */
export class CampaignDeletedEvent extends DomainEvent {
    readonly eventType = 'CAMPAIGN_DELETED' as const;

    constructor(
        readonly aggregateID: EntityID,
        readonly worldID: EntityID
    ) {
        super();
    }
}
