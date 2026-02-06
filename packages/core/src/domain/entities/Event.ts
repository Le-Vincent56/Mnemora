import { Result } from "../core/Result";
import { ValidationError } from "../core/errors";
import { EntityID } from "../value-objects/EntityID";
import { Name } from "../value-objects/Name";
import { RichText } from "../value-objects/RichText";
import { TagCollection } from "../value-objects/TagCollection";
import { Timestamps } from "../value-objects/Timestamps";
import { BaseEntity } from "./BaseEntity";
import { EntityType } from "./EntityType";
import { TypeSpecificFieldsWrapper, EventFields } from "../value-objects/TypeSpecificFields";

export interface CreateEventProps {
    name: string;
    worldID: EntityID;
    continuityID: EntityID;
    campaignID?: EntityID;
}

export interface EventProps {
    id: EntityID;
    name: Name;
    description: RichText;
    secrets: RichText;
    tags: TagCollection;
    worldID: EntityID;
    campaignID: EntityID | null;
    continuityID: EntityID;
    forkedFrom: EntityID | null;
    timestamps: Timestamps;
    typeSpecificFields?: TypeSpecificFieldsWrapper<EntityType.EVENT>;
}

/**
 * Event: A canon occurrence within a Continuity's timeline.
 * Events are continuity-scoped and represent things that actually happened.
 * They can record outcomes/changes to entities via structured JSON in type-specific fields.
 */
export class Event extends BaseEntity {
    private _name: Name;
    private _description: RichText;
    private _secrets: RichText;
    private _tags: TagCollection;
    private readonly _worldID: EntityID;
    private readonly _campaignID: EntityID | null;
    private readonly _continuityID: EntityID;
    private readonly _forkedFrom: EntityID | null;
    private _typeSpecificFields: TypeSpecificFieldsWrapper<EntityType.EVENT>;

    get name(): Name { return this._name; }
    get description(): RichText { return this._description; }
    get secrets(): RichText { return this._secrets; }
    get tags(): TagCollection { return this._tags; }
    get worldID(): EntityID { return this._worldID; }
    get campaignID(): EntityID | null { return this._campaignID; }
    get continuityID(): EntityID { return this._continuityID; }
    get forkedFrom(): EntityID | null { return this._forkedFrom; }

    get typeSpecificFields(): EventFields {
        return this._typeSpecificFields.toFields();
    }

    get typeSpecificFieldsWrapper(): TypeSpecificFieldsWrapper<EntityType.EVENT> {
        return this._typeSpecificFields;
    }

    private constructor(props: EventProps) {
        super(props.id, EntityType.EVENT, props.timestamps);
        this._name = props.name;
        this._description = props.description;
        this._secrets = props.secrets;
        this._tags = props.tags;
        this._worldID = props.worldID;
        this._campaignID = props.campaignID;
        this._continuityID = props.continuityID;
        this._forkedFrom = props.forkedFrom;
        this._typeSpecificFields = props.typeSpecificFields
            ?? TypeSpecificFieldsWrapper.createForType(EntityType.EVENT);
    }

    static create(props: CreateEventProps): Result<Event, ValidationError> {
        const nameResult = Name.create(props.name);
        if (nameResult.isFailure) {
            return Result.fail(nameResult.error);
        }

        const event = new Event({
            id: EntityID.generate(),
            name: nameResult.value,
            description: RichText.empty(),
            secrets: RichText.empty(),
            tags: TagCollection.empty(),
            worldID: props.worldID,
            campaignID: props.campaignID ?? null,
            continuityID: props.continuityID,
            forkedFrom: null,
            timestamps: Timestamps.now(),
            typeSpecificFields: TypeSpecificFieldsWrapper.createForType(EntityType.EVENT),
        });

        return Result.ok(event);
    }

    static fromProps(props: EventProps): Event {
        return new Event(props);
    }

    rename(newName: string): Result<void, ValidationError> {
        const nameResult = Name.create(newName);
        if (nameResult.isFailure) return Result.fail(nameResult.error);
        this._name = nameResult.value;
        this.touch();
        return Result.okVoid();
    }

    updateDescription(content: string): void {
        this._description = RichText.fromString(content);
        this.touch();
    }

    updateSecrets(content: string): void {
        this._secrets = RichText.fromString(content);
        this.touch();
    }

    setTags(tags: string[]): Result<void, ValidationError> {
        const tagsResult = TagCollection.fromArray(tags);
        if (tagsResult.isFailure) return Result.fail(tagsResult.error);
        this._tags = tagsResult.value;
        this.touch();
        return Result.okVoid();
    }

    addTag(tag: string): Result<void, ValidationError> {
        const tagsResult = this._tags.add(tag);
        if (tagsResult.isFailure) return Result.fail(tagsResult.error);
        this._tags = tagsResult.value;
        this.touch();
        return Result.okVoid();
    }

    removeTag(tag: string): void {
        this._tags = this._tags.remove(tag);
        this.touch();
    }

    setTypeSpecificField(field: string, value: string | undefined): Result<void, ValidationError> {
        const updated = this._typeSpecificFields.setField(field, value);
        if (updated === null) {
            return Result.fail(
                ValidationError.invalid('field', `'${field}' is not a valid event field`)
            );
        }
        this._typeSpecificFields = updated;
        this.touch();
        return Result.okVoid();
    }

    getTypeSpecificField(field: keyof Omit<EventFields, 'type'>): string | undefined {
        return this._typeSpecificFields.getField(field);
    }
}