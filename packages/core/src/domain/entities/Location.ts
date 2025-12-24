import { Result } from "../core/Result";
import { ValidationError } from "../core/errors";
import { EntityID } from "../value-objects/EntityID";
import { Name } from "../value-objects/Name";
import { RichText } from "../value-objects/RichText";
import { TagCollection } from "../value-objects/TagCollection";
import { Timestamps } from "../value-objects/Timestamps";
import { BaseEntity } from "./BaseEntity";
import { EntityType } from "./EntityType";
import { TypeSpecificFieldsWrapper, LocationFields } from '../value-objects/TypeSpecificFields';

/**
 * Props required to create a new Location.
 */
export interface CreateLocationProps {
    name: string;
    worldID: EntityID;
    campaignID?: EntityID;
}

/**
 * Props for reconstructing a Location from persistence
 */
export interface LocationProps {
    id: EntityID;
    name: Name;
    description: RichText;
    secrets: RichText;
    tags: TagCollection;
    worldID: EntityID;
    campaignID: EntityID | null;
    forkedFrom: EntityID | null;
    timestamps: Timestamps;
    typeSpecificFields?: TypeSpecificFieldsWrapper<EntityType.LOCATION>;
}

/**
 * Location: Domain entity representing a place in the world.
 * Locations default to World Level (shared across Campaigns).
 * They can be forked from World-level to Campaign-level for local modifications.
 */
export class Location extends BaseEntity {
    private _name: Name;
    private _description: RichText;
    private _secrets: RichText;
    private _tags: TagCollection;
    private readonly _worldID: EntityID;
    private readonly _campaignID: EntityID | null;
    private readonly _forkedFrom: EntityID | null;
    private _typeSpecificFields: TypeSpecificFieldsWrapper<EntityType.LOCATION>;

    get name(): Name {
        return this._name;
    }

    get description(): RichText {
        return this._description;
    }

    get secrets(): RichText {
        return this._secrets;
    }

    get tags(): TagCollection {
        return this._tags;
    }

    get worldID(): EntityID {
        return this._worldID;
    }

    get campaignID(): EntityID | null {
        return this._campaignID;
    }

    get forkedFrom(): EntityID | null {
        return this._forkedFrom;
    }

    /**
     * True if this Location belongs to a specific campaign.
     */
    get isCampaignScoped(): boolean {
        return this._campaignID !== null;
    }

    /**
     * True if this location is a fork of a world-level Location.
     */
    get isForked(): boolean {
        return this._forkedFrom !== null;
    }

    /**
     * Type-specific fields for this location.
     */
    get typeSpecificFields(): LocationFields {
        return this._typeSpecificFields.toFields();
    }

    /**
     * Returns the raw wrapper for persistence.
     */
    get typeSpecificFieldsWrapper(): TypeSpecificFieldsWrapper<EntityType.LOCATION> {
        return this._typeSpecificFields;
    }

    private constructor(props: LocationProps) {
        super(props.id, EntityType.LOCATION, props.timestamps);
        this._name = props.name;
        this._description = props.description;
        this._secrets = props.secrets;
        this._tags = props.tags;
        this._worldID = props.worldID;
        this._campaignID = props.campaignID;
        this._forkedFrom = props.forkedFrom;
        this._typeSpecificFields = props.typeSpecificFields ?? TypeSpecificFieldsWrapper.createForType(EntityType.LOCATION);
    }

    /**
     * Creates a new Location with validated props.
     * By default, creates a World-level location unless campaignID is provided.
     */
    static create(props: CreateLocationProps): Result<Location, ValidationError> {
        const nameResult = Name.create(props.name);
        if (nameResult.isFailure) {
            return Result.fail(nameResult.error);
        }

        const location = new Location({
            id: EntityID.generate(),
            name: nameResult.value,
            description: RichText.empty(),
            secrets: RichText.empty(),
            tags: TagCollection.empty(),
            worldID: props.worldID,
            campaignID: props.campaignID ?? null,
            forkedFrom: null,
            timestamps: Timestamps.now(),
            typeSpecificFields: TypeSpecificFieldsWrapper.createForType(EntityType.LOCATION),
        });

        return Result.ok(location);
    }

    /**
     * Reconstructs a Location from persistence data.
     * Use when hydrating from database.
     */
    static fromProps(props: LocationProps): Location {
        return new Location(props);
    }

    /**
     * Renames the Location.
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
     * Updates the Location's description.
     */
    updateDescription(content: string): void {
        this._description = RichText.fromString(content);
        this.touch();
    }

    /**
     * Updates the Location's secrets (GM-only content).
     */
    updateSecrets(content: string): void {
        this._secrets = RichText.fromString(content);
        this.touch();
    }

    /**
     * Replaces all tags.
     */
    setTags(tags: string[]): Result<void, ValidationError> {
        const tagsResult = TagCollection.fromArray(tags);
        if (tagsResult.isFailure) {
            return Result.fail(tagsResult.error);
        }

        this._tags = tagsResult.value;
        this.touch();
        return Result.okVoid();
    }

    /**
     * Adds a single tag.
     */
    addTag(tag: string): Result<void, ValidationError> {
        const tagsResult = this._tags.add(tag);
        if (tagsResult.isFailure) {
            return Result.fail(tagsResult.error);
        }

        this._tags = tagsResult.value;
        this.touch();
        return Result.okVoid();
    }

    /**                                                               
     * Removes a single tag.                                          
     */
    removeTag(tag: string): void {
        this._tags = this._tags.remove(tag);
        this.touch();
    }

    /**
     * Creates a fork of this location for a specific campaign.
     * The fork is a new entity that references this one as its source.
     */
    fork(intoCampaign: EntityID): Location {
        return new Location({
            id: EntityID.generate(),
            name: this._name,
            description: this._description,
            secrets: this._secrets,
            tags: this._tags.clone(),
            worldID: this._worldID,
            campaignID: intoCampaign,
            forkedFrom: this.id,
            typeSpecificFields: this._typeSpecificFields, timestamps: Timestamps.now()
        });
    }

    /**
     * Sets a type-specific field value.
     * Returns failure if the field name is not valid for locations.
     */
    setTypeSpecificField(field: string, value: string | undefined): Result<void, ValidationError> {
        const updated = this._typeSpecificFields.setField(field, value);
        if (updated === null) {
            return Result.fail(
                ValidationError.invalid('field', `'${field}' is not a valid location field`)
            );
        }
        this._typeSpecificFields = updated;
        this.touch();
        return Result.okVoid();
    }

    /**
     * Gets a type-specific field value by name.
     */
    getTypeSpecificField(field: keyof Omit<LocationFields, 'type'>): string | undefined {
        return this._typeSpecificFields.getField(field);
    }
}