import { Result } from "../core/Result";
import { ValidationError } from "../core/errors";
import { EntityID } from "../value-objects/EntityID";
import { Name } from "../value-objects/Name";
import { RichText } from "../value-objects/RichText";
import { Timestamps } from "../value-objects/Timestamps";

export interface CreateContinuityProps {
    name: string;
    worldID: EntityID;
    branchedFromID?: EntityID;
    branchPointEventID?: EntityID;
    description?: string;
}

export interface ContinuityProps {
    id: EntityID;
    name: Name;
    description: RichText;
    worldID: EntityID;
    branchedFromID: EntityID | null;
    branchPointEventID: EntityID | null;
    timestamps: Timestamps;
}

/**
 * Continuity: Aggregate root representing a timeline within a World.
 * A World has 1+ Continuities. Each Campaign points to exactly one Continuity.
 * Continuities can branch from another continuity at a chosen event/time point.
 * Campaigns sharing a Continuity share canon state.
 */
export class Continuity {
    private readonly _id: EntityID;
    private _name: Name;
    private _description: RichText;
    private readonly _worldID: EntityID;
    private readonly _branchedFromID: EntityID | null;
    private readonly _branchPointEventID: EntityID | null;
    private _timestamps: Timestamps;

    get id(): EntityID { return this._id; }
    get name(): Name { return this._name; }
    get description(): RichText { return this._description; }
    get worldID(): EntityID { return this._worldID; }
    get branchedFromID(): EntityID | null { return this._branchedFromID; }
    get branchPointEventID(): EntityID | null { return this._branchPointEventID; }
    get timestamps(): Timestamps { return this._timestamps; }
    get createdAt(): Date { return this._timestamps.createdAt; }
    get modifiedAt(): Date { return this._timestamps.modifiedAt; }

    private constructor(props: ContinuityProps) {
        this._id = props.id;
        this._name = props.name;
        this._description = props.description;
        this._worldID = props.worldID;
        this._branchedFromID = props.branchedFromID;
        this._branchPointEventID = props.branchPointEventID;
        this._timestamps = props.timestamps;
    }

    static create(props: CreateContinuityProps): Result<Continuity, ValidationError> {
        const nameResult = Name.create(props.name);
        if (nameResult.isFailure) {
            return Result.fail(nameResult.error);
        }

        const continuity = new Continuity({
            id: EntityID.generate(),
            name: nameResult.value,
            description: props.description
                ? RichText.fromString(props.description)
                : RichText.empty(),
            worldID: props.worldID,
            branchedFromID: props.branchedFromID ?? null,
            branchPointEventID: props.branchPointEventID ?? null,
            timestamps: Timestamps.now(),
        });

        return Result.ok(continuity);
    }

    static fromProps(props: ContinuityProps): Continuity {
        return new Continuity(props);
    }

    rename(newName: string): Result<void, ValidationError> {
        const nameResult = Name.create(newName);
        if (nameResult.isFailure) {
            return Result.fail(nameResult.error);
        }
        this._name = nameResult.value;
        this.touch();
        return Result.okVoid();
    }

    updateDescription(content: string): void {
        this._description = RichText.fromString(content);
        this.touch();
    }

    private touch(): void {
        this._timestamps = this._timestamps.touch();
    }

    equals(other: Continuity): boolean {
        if (other === null || other === undefined) return false;
        return this._id.equals(other._id);
    }
}