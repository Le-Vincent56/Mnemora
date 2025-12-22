import { Result } from "../core/Result";
import { ValidationError } from "../core/errors";
import { EntityID } from "../value-objects/EntityID";
import { Name } from "../value-objects/Name";
import { RichText } from "../value-objects/RichText";
import { Timestamps } from "../value-objects/Timestamps";

/**
 * Props required to create a new Campaign.
 */
export interface CreateCampaignProps {
    name: string;
    worldID: EntityID;
    description?: string;
}

/**
 * Props for reconstructing a Campaign from persistence.
 */
export interface CampaignProps {
    id: EntityID;
    name: Name;
    description: RichText;
    worldID: EntityID;
    timestamps: Timestamps;
}

/**
 * Campaign: Aggregate root representing a game campaign within a World.
 * A Campaign is a container within a World that holds:
 * - Campaign-scoped entities (Characters, Sessions, Notes)
 * - Safety tool configurations (future feature)
 * Campaign is NOT an EntityType and does NOT extend BaseEntity.
 * It's a separate aggregate root with its own table.
 * When a World is deleted, its Campaigns are cascade-deleted via SQL.
 */
export class Campaign {
    private readonly _id: EntityID;
    private _name: Name;
    private _description: RichText;
    private readonly _worldID: EntityID;
    private _timestamps: Timestamps;

    /**
     * The unique identifier for this campaign.
     */
    get id(): EntityID {
        return this._id;
    }

    /**
     * The display name of this campaign.
     */
    get name(): Name {
        return this._name;
    }

    /**
     * The description/notes for this campaign.
     */
    get description(): RichText {
        return this._description;
    }

    /**
     * The ID of the World this campaign belongs to.
     * Immutable - a campaign cannot be moved between worlds.
     */
    get worldID(): EntityID {
        return this._worldID;
    }

    /**
     * The creation and modification timestamps.
     */
    get timestamps(): Timestamps {
        return this._timestamps;
    }

    /**
     * Shorthand for timestamps.createdAt.
     */
    get createdAt(): Date {
        return this._timestamps.createdAt;
    }

    /**
     * Shorthand for timestamps.modifiedAt.
     */
    get modifiedAt(): Date {
        return this._timestamps.modifiedAt;
    }

    private constructor(props: CampaignProps) {
        this._id = props.id;
        this._name = props.name;
        this._description = props.description;
        this._worldID = props.worldID;
        this._timestamps = props.timestamps;
    }

    /**
     * Creates a new Campaign with validated props.
     */
    static create(props: CreateCampaignProps): Result<Campaign, ValidationError> {
        const nameResult = Name.create(props.name);
        if (nameResult.isFailure) {
            return Result.fail(nameResult.error);
        }

        const campaign = new Campaign({
            id: EntityID.generate(),
            name: nameResult.value,
            description: props.description
                ? RichText.fromString(props.description)
                : RichText.empty(),
            worldID: props.worldID,
            timestamps: Timestamps.now()
        });

        return Result.ok(campaign);
    }

    /**
     * Reconstructs a Campaign from persistence data.
     * Use when hydrating from database.
     */
    static fromProps(props: CampaignProps): Campaign {
        return new Campaign(props);
    }

    /**
     * Renames this campaign.
     */
    rename(newName: string): Result<void, ValidationError> {
        const nameResult = Name.create(newName);
        if (nameResult.isFailure) {
            return Result.fail(nameResult.error);
        }

        this._name = nameResult.value;
        this.touch();
        return Result.okVoid();
    }

    /**
     * Updates the description.
     */
    updateDescription(content: string): void {
        this._description = RichText.fromString(content);
        this.touch();
    }

    /**
     * Updates the modifiedAt timestamp to now.
     */
    private touch(): void {
        this._timestamps = this._timestamps.touch();
    }

    /**
     * Checks equality by ID only.
     */
    equals(other: Campaign): boolean {
        if (other === null || other === undefined) {
            return false;
        }
        return this._id.equals(other._id);
    }
}
