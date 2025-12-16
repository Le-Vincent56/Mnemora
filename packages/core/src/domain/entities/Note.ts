import { Result } from "../core/Result";
import { ValidationError } from "../core/errors";
import { EntityID } from "../value-objects/EntityID";
import { Name } from "../value-objects/Name";
import { RichText } from "../value-objects/RichText";
import { TagCollection } from "../value-objects/TagCollection";
import { Timestamps } from "../value-objects/Timestamps";
import { BaseEntity } from "./BaseEntity";
import { EntityType } from "./EntityType";

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

    private constructor(props: NoteProps) {
        super(props.id, EntityType.NOTE, props.timestamps);
        this._name = props.name;
        this._content = props.content;
        this._tags = props.tags;
        this._worldID = props.worldID;
        this._campaignID = props.campaignID;
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
            timestamps: Timestamps.now()
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
}