import { Result } from "../core/Result";
import { ValidationError } from "../core/errors";
import { EntityID } from "../value-objects/EntityID";
import { Name } from "../value-objects/Name";
import { Timestamps } from "../value-objects/Timestamps";

/**
 * Maximum length for world tagline.
 */
const MAX_TAGLINE_LENGTH = 200;

/**
 * Props required to create a new World.
 */
export interface CreateWorldProps {
    name: string;
    tagline?: string;
}

/**
 * Props for reconstructing a World from persistence.
 */
export interface WorldProps {
    id: EntityID;
    name: Name;
    tagline: string | null;
    timestamps: Timestamps;
}

/**
 * World: Aggregate root representing a game world/setting.
 * A World is a top-level container that holds:
 * - World-level entities (Locations, Factions)
 * - Campaigns (which contain campaign-scoped entities)
 * World is NOT an EntityType and does NOT extend BaseEntity.
 * It's a separate aggregate root with its own table.
 */
export class World {
    private readonly _id: EntityID;
    private _name: Name;
    private _tagline: string | null;
    private _timestamps: Timestamps;

    /**
     * The unique identifier for this world.
     */
    get id(): EntityID {
        return this._id;
    }

    /**
     * The display name of this world.
     */
    get name(): Name {
        return this._name;
    }

    /**
     * An optional short tagline/description for this world.
     */
    get tagline(): string | null {
        return this._tagline;
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

    private constructor(props: WorldProps) {
        this._id = props.id;
        this._name = props.name;
        this._tagline = props.tagline;
        this._timestamps = props.timestamps;
    }

    /**
     * Creates a new World with validated props.
     */
    static create(props: CreateWorldProps): Result<World, ValidationError> {
        const nameResult = Name.create(props.name);
        if (nameResult.isFailure) {
            return Result.fail(nameResult.error);
        }

        // Validate tagline length
        if (props.tagline && props.tagline.length > MAX_TAGLINE_LENGTH) {
            return Result.fail(
                ValidationError.tooLong('Tagline', MAX_TAGLINE_LENGTH)
            );
        }

        const world = new World({
            id: EntityID.generate(),
            name: nameResult.value,
            tagline: props.tagline?.trim() || null,
            timestamps: Timestamps.now()
        });

        return Result.ok(world);
    }

    /**
     * Reconstructs a World from persistence data.
     * Use when hydrating from database.
     */
    static fromProps(props: WorldProps): World {
        return new World(props);
    }

    /**
     * Renames this world.
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
     * Updates the tagline.
     * Pass null to clear the tagline.
     */
    updateTagline(tagline: string | null): Result<void, ValidationError> {
        if (tagline && tagline.length > MAX_TAGLINE_LENGTH) {
            return Result.fail(
                ValidationError.tooLong('Tagline', MAX_TAGLINE_LENGTH)
            );
        }

        this._tagline = tagline?.trim() || null;
        this.touch();
        return Result.okVoid();
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
    equals(other: World): boolean {
        if (other === null || other === undefined) {
            return false;
        }
        return this._id.equals(other._id);
    }
}
