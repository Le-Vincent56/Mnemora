import { Result } from "../core/Result";
import { ValidationError } from "../core/errors";
import { EntityID } from "../value-objects/EntityID";
import { Name } from "../value-objects/Name";
import { RichText } from "../value-objects/RichText";
import { TagCollection } from "../value-objects/TagCollection";
import { Timestamps } from "../value-objects/Timestamps";
import { BaseEntity } from "./BaseEntity";
import { EntityType } from "./EntityType";
import { TypeSpecificFieldsWrapper, NoteFields } from "../value-objects/TypeSpecificFields";

/**
 * Props required to create a new Note.
 */
export interface CreateNoteProps {
    name: string;
    worldID: EntityID;
    campaignID: EntityID; // Required - notes are always campaign-scoped
}

/**
 * Props for reconstructing a Note from persistence.
 */
export interface NoteProps {
    id: EntityID;
    name: Name;
    content: RichText;
    tags: TagCollection;
    worldID: EntityID;
    campaignID: EntityID;
    timestamps: Timestamps;
    typeSpecificFields?: TypeSpecificFieldsWrapper<EntityType.NOTE>;
}

/**
 * Note: Domain entity representing a GM's note or idea.
 * Notes are always Campaign-scoped and cannot be forked.
 * They are the simplest entity type - just a named piece of content.
 */
export class Note extends BaseEntity {
    private _name: Name;
    private _content: RichText;
    private _tags: TagCollection;
    private readonly _worldID: EntityID;
    private readonly _campaignID: EntityID;
    private _typeSpecificFields: TypeSpecificFieldsWrapper<EntityType.NOTE>;

    get name(): Name {
        return this._name;
    }

    get content(): RichText {
        return this._content;
    }

    get tags(): TagCollection {
        return this._tags;
    }

    get worldID(): EntityID {
        return this._worldID;
    }

    get campaignID(): EntityID {
        return this._campaignID;
    }

    /**
     * Notes are always campaign-scoped.
     */
    get isCampaignScoped(): boolean {
        return true;
    }

    /**
     * Type-specific fields for this note.
     */
    get typeSpecificFields(): NoteFields {
        return this._typeSpecificFields.toFields();
    }

    /**
     * Returns the raw wrapper for persistence.
     */
    get typeSpecificFieldsWrapper(): TypeSpecificFieldsWrapper<EntityType.NOTE> {
        return this._typeSpecificFields;
    }

    private constructor(props: NoteProps) {
        super(props.id, EntityType.NOTE, props.timestamps);
        this._name = props.name;
        this._content = props.content;
        this._tags = props.tags;
        this._worldID = props.worldID;
        this._campaignID = props.campaignID;
        this._typeSpecificFields = props.typeSpecificFields ?? TypeSpecificFieldsWrapper.createForType(EntityType.NOTE);
    }

    /**
     * Creates a new Note with validated props.
     * Notes are always campaign-scoped.
     */
    static create(props: CreateNoteProps): Result<Note, ValidationError> {
        const nameResult = Name.create(props.name);
        if (nameResult.isFailure) {
            return Result.fail(nameResult.error);
        }

        const note = new Note({
            id: EntityID.generate(),
            name: nameResult.value,
            content: RichText.empty(),
            tags: TagCollection.empty(),
            worldID: props.worldID,
            campaignID: props.campaignID,
            timestamps: Timestamps.now(),
            typeSpecificFields: TypeSpecificFieldsWrapper.createForType(EntityType.NOTE),
        });

        return Result.ok(note);
    }

    /**
     * Reconstructs a Note from persistence data.
     * Use when hydrating from database.
     */
    static fromProps(props: NoteProps): Note {
        return new Note(props);
    }

    /**
     * Renames the Note.
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
       * Updates the Note's content.
       */
    updateContent(content: string): void {
        this._content = RichText.fromString(content);
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
     * Sets a type-specific field value.
     * Returns failure if the field name is not valid for notes.
     */
    setTypeSpecificField(field: string, value: string | undefined): Result<void, ValidationError> {
        const updated = this._typeSpecificFields.setField(field, value);
        if (updated === null) {
            return Result.fail(
                ValidationError.invalid('field', `'${field}' is not a valid note field`)
            );
        }
        this._typeSpecificFields = updated;
        this.touch();
        return Result.okVoid();
    }

    /**
     * Gets a type-specific field value by name.
     */
    getTypeSpecificField(field: keyof Omit<NoteFields, 'type'>): string | undefined {
        return this._typeSpecificFields.getField(field);
    }
}