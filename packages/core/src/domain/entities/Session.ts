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
 * Props required to create a new Session.
 */
export interface CreateSessionProps {
    name: string;
    worldID: EntityID;
    campaignID: EntityID; // Required - sessions are always campaign-scoped
    sessionDate?: Date;
}

/**
 * Props for reconstructing a Session from persistence.
 */
export interface SessionProps {
    id: EntityID;
    name: Name;
    summary: RichText;
    notes: RichText;
    secrets: RichText;
    tags: TagCollection;
    worldID: EntityID;
    campaignID: EntityID;
    sessionDate: Date | null;
    timestamps: Timestamps;
}

/**
 * Session: Domain entity representing a game session.
 * Sessions are always Campaign-scoped and cannot be forked.
 * They track what happened (or will happen) during a play session.
 */
export class Session extends BaseEntity {
    private _name: Name;
    private _summary: RichText;
    private _notes: RichText;
    private _secrets: RichText;
    private _tags: TagCollection;
    private readonly _worldID: EntityID;
    private readonly _campaignID: EntityID;
    private _sessionDate: Date | null;

    get name(): Name {
        return this._name;
    }

    get summary(): RichText {
        return this._summary;
    }

    get notes(): RichText {
        return this._notes;
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

    get campaignID(): EntityID {
        return this._campaignID;
    }

    get sessionDate(): Date | null {
        return this._sessionDate;
    }

    /**
     * Sessions are always campaign-scoped.
     */
    get isCampaignScoped(): boolean {
        return true;
    }

    private constructor(props: SessionProps) {
        super(props.id, EntityType.SESSION, props.timestamps);
        this._name = props.name;
        this._summary = props.summary;
        this._notes = props.notes;
        this._secrets = props.secrets;
        this._tags = props.tags;
        this._worldID = props.worldID;
        this._campaignID = props.campaignID;
        this._sessionDate = props.sessionDate;
    }

    /**
     * Creates a new Session with validated props.
     * Sessions are always campaign-scoped.
     */
    static create(props: CreateSessionProps): Result<Session, ValidationError> {
        const nameResult = Name.create(props.name);
        if (nameResult.isFailure) {
            return Result.fail(nameResult.error);
        }

        const session = new Session({
            id: EntityID.generate(),
            name: nameResult.value,
            summary: RichText.empty(),
            notes: RichText.empty(),
            secrets: RichText.empty(),
            tags: TagCollection.empty(),
            worldID: props.worldID,
            campaignID: props.campaignID,
            sessionDate: props.sessionDate ?? null,
            timestamps: Timestamps.now()
        });

        return Result.ok(session);
    }

    /**
     * Reconstructs a Session from persistence data.
     * Use when hydrating from database.
     */
    static fromProps(props: SessionProps): Session {
        return new Session(props);
    }

    /**
     * Renames the Session.
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
     * Updates the Session's summary (what happened).
     */
    updateSummary(content: string): void {
        this._summary = RichText.fromString(content);
        this.touch();
    }

    /**
     * Updates the Session's notes (GM prep notes).
     */
    updateNotes(content: string): void {
        this._notes = RichText.fromString(content);
        this.touch();
    }

    /**
     * Updates the Session's secrets (GM-only content).
     */
    updateSecrets(content: string): void {
        this._secrets = RichText.fromString(content);
        this.touch();
    }

    /**
     * Sets or clears the session date.
     */
    setSessionDate(date: Date | null): void {
        this._sessionDate = date;
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