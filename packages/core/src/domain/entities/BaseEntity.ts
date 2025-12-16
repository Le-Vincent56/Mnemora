import { EntityID } from "../value-objects/EntityID";
import { Timestamps } from "../value-objects/Timestamps";
import { EntityType } from "./EntityType";

/**
 * BaseEntity: Abstract base class for all domain entities.
 * Entities are objects with identity that persists over time.
 * Two entities are equal if they have the same ID, regardless of other attributes.
 */
export abstract class BaseEntity {
    private readonly _id: EntityID;
    private readonly _type: EntityType;
    private _timestamps: Timestamps;

    /**
     * The unique identifier for this entity.
     */
    get id(): EntityID {
        return this._id;
    }

    /**
     * The type discriminator for this entity.
     */
    get type(): EntityType {
        return this._type;
    }

    /**
     * The creation and modification timestamps for this entity.
     */
    get timestamps(): Timestamps {
        return this._timestamps;
    }

    /**
     * Shorthand for timestamps.createdAt
     */
    get createdAt(): Date {
        return this._timestamps.createdAt;
    }

    /**
     * Shorthand for timestamps.modifiedAt
     */
    get modifiedAt(): Date {
        return this._timestamps.modifiedAt;
    }

    protected constructor(id: EntityID, type: EntityType, timestamps: Timestamps) {
        this._id = id;
        this._type = type;
        this._timestamps = timestamps;
    }

    /**
     * Updates the modifiedAt timestamp to now.
     * Call this in subclass methods that modify entity state.
     */
    protected touch(): void {
        this._timestamps = this._timestamps.touch();
    }

    /**
     * Checks equality by ID only.
     * Two entities with the same ID are considered equal.
     */
    equals(other: BaseEntity): boolean {
        if(other === null || other === undefined) {
            return false;
        }
        return this._id.equals(other._id);
    }
}