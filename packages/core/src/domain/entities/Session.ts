import { Result } from "../core/Result";
import { ValidationError } from "../core/errors";
import { EntityID } from "../value-objects/EntityID";
import { Name } from "../value-objects/Name";
import { RichText } from "../value-objects/RichText";
import { TagCollection } from "../value-objects/TagCollection";
import { Timestamps } from "../value-objects/Timestamps";
import { BaseEntity } from "./BaseEntity";
import { EntityType } from "./EntityType";
import { QuickNote } from '../value-objects/QuickNote';
import { StarsAndWishes } from '../value-objects/StarsAndWishes';
import { TypeSpecificFieldsWrapper, SessionFields } from "../value-objects/TypeSpecificFields";

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
    quickNotes: QuickNote[];
    starsAndWishes: StarsAndWishes | null;
    duration: number | null;
    startedAt: Date | null;
    endedAt: Date | null;
    typeSpecificFields?: TypeSpecificFieldsWrapper<EntityType.SESSION>;
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
    private _quickNotes: QuickNote[];
    private _starsAndWishes: StarsAndWishes | null;
    private _duration: number | null;
    private _startedAt: Date | null;
    private _endedAt: Date | null;
    private _typeSpecificFields: TypeSpecificFieldsWrapper<EntityType.SESSION>;

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

    get quickNotes(): readonly QuickNote[] {
        return [...this._quickNotes];
    }

    get starsAndWishes(): StarsAndWishes | null {
        return this._starsAndWishes;
    }

    get duration(): number | null {
        return this._duration;
    }

    /**
     * Session Mode run start timestamp (null if never started).
     */
    get startedAt(): Date | null {
        return this._startedAt ? new Date(this._startedAt.getTime()) : null;
    }
    /**
     * Session Mode run end timestamp (null if not ended).
     */
    get endedAt(): Date | null {
        return this._endedAt ? new Date(this._endedAt.getTime()) : null;
    }

    /**
     * Returns true if the session has ended (duration is set).
     */
    get hasEnded(): boolean {
        return this._duration !== null;
    }

    /**
         * Type-specific fields for this session.
         */
    get typeSpecificFields(): SessionFields {
        return this._typeSpecificFields.toFields();
    }

    /**
     * Returns the raw wrapper for persistence.
     */
    get typeSpecificFieldsWrapper(): TypeSpecificFieldsWrapper<EntityType.SESSION> {
        return this._typeSpecificFields;
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
        this._quickNotes = props.quickNotes;
        this._starsAndWishes = props.starsAndWishes;
        this._duration = props.duration;
        this._startedAt = props.startedAt;
        this._endedAt = props.endedAt;
        this._typeSpecificFields = props.typeSpecificFields ?? TypeSpecificFieldsWrapper.createForType(EntityType.SESSION);
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
            timestamps: Timestamps.now(),
            quickNotes: [],
            starsAndWishes: null,
            duration: null,
            startedAt: null,
            endedAt: null,
            typeSpecificFields: TypeSpecificFieldsWrapper.createForType(EntityType.SESSION),
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

    /**
       * Adds a quick note to the session.
       * Returns the created note's ID on success.
       */
    addQuickNote(
        content: string,
        linkedEntityIds?: string[],
        visibility?: 'gm_only' | 'players'
    ): Result<string, ValidationError> {
        const noteResult = QuickNote.create(content, linkedEntityIds, visibility);
        if (noteResult.isFailure) {
            return Result.fail(noteResult.error);
        }

        this._quickNotes = [...this._quickNotes, noteResult.value];
        this.touch();
        return Result.ok(noteResult.value.id);
    }

    /**
     * Removes a quick note by ID.
     */
    removeQuickNote(noteId: string): void {
        this._quickNotes = this._quickNotes.filter(n => n.id !== noteId);
        this.touch();
    }

    /**
     * Gets a quick note by ID.
     */
    getQuickNote(noteId: string): QuickNote | undefined {
        return this._quickNotes.find(n => n.id === noteId);
    }

    /**
     * Sets the Stars & Wishes feedback for the session.
     */
    setStarsAndWishes(starsAndWishes: StarsAndWishes): void {
        this._starsAndWishes = starsAndWishes;
        this.touch();
    }

    /**
     * Ends the session with the given duration.
     * Duration is in seconds.
     */
    endSession(durationSeconds: number): Result<void, ValidationError> {
        if (durationSeconds < 0) {
            return Result.fail(
                new ValidationError('Duration cannot be negative', 'duration')
            );
        }

        this._duration = durationSeconds;

        if (this._endedAt === null) {
            this._endedAt = new Date();
        }

        this.touch();
        return Result.okVoid();
    }

    /**
     * Sets a type-specific field value.
     * Returns failure if the field name is not valid for sessions.
     */
    setTypeSpecificField(field: string, value: string | undefined): Result<void, ValidationError> {
        const updated = this._typeSpecificFields.setField(field, value);
        if (updated === null) {
            return Result.fail(
                ValidationError.invalid('field', `'${field}' is not a valid session field`)
            );
        }
        this._typeSpecificFields = updated;
        this.touch();
        return Result.okVoid();
    }

    /**
     * Gets a type-specific field value by name.
     */
    getTypeSpecificField(field: keyof Omit<SessionFields, 'type'>): string | undefined {
        return this._typeSpecificFields.getField(field);
    }
}