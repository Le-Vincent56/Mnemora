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
 * Props required to create a new Character.
 */
export interface CreateCharacterProps {
    name: string;
    worldID: EntityID;
    campaignID?: EntityID;
}

/**
 * Props for reconstructing a Character from persistence.
 */
export interface CharacterProps {
    id: EntityID;
    name: Name;
    description: RichText;
    secrets: RichText;
    tags: TagCollection;
    worldID: EntityID;
    campaignID: EntityID | null;
    forkedFrom: EntityID | null;
    timestamps: Timestamps;
}

/**
 * Character: Domain entity representing an NPC or notable character.
 * Characters belong to a World and optionally to a Campgin.
 * They can be forked from World-level to Campaign-level for local modifications.
 */
export class Character extends BaseEntity {
    private _name: Name;
    private _description: RichText;
    private _secrets: RichText;
    private _tags: TagCollection;
    private readonly _worldID: EntityID;
    private readonly _campaignID: EntityID | null;
    private readonly _forkedFrom: EntityID | null;

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
     * True if this character belongs to a specific campaign.
     */
    get isCampaignScoped(): boolean {
        return this._campaignID !== null;
    }

    /**
     * True if this character is a fork of a world-level character.
     */
    get isForked(): boolean {
        return this._forkedFrom !== null;
    }

    private constructor(props: CharacterProps) {
        super(props.id, EntityType.CHARACTER, props.timestamps);
        this._name = props.name;
        this._description = props.description;
        this._secrets = props.secrets;
        this._tags = props.tags;
        this._worldID = props.worldID;
        this._campaignID = props.campaignID;
        this._forkedFrom = props.forkedFrom;
    }

    /**
     * Creates a new Character with validated props.
     */
    static create(props: CreateCharacterProps): Result<Character, ValidationError> {
        const nameResult = Name.create(props.name);
        if(nameResult.isFailure) {
            return Result.fail(nameResult.error);
        }

        const character = new Character({
            id: EntityID.generate(),
            name: nameResult.value,
            description: RichText.empty(),
            secrets: RichText.empty(),
            tags: TagCollection.empty(),
            worldID: props.worldID,
            campaignID: props.campaignID ?? null,
            forkedFrom: null,
            timestamps: Timestamps.now()
        });

        return Result.ok(character);
    }

    /**
     * Reconstructs a Character from persistence data.
     * Use when hydrating from database.
     */
    static fromProps(props: CharacterProps): Character {
        return new Character(props);
    }

    /**
     * Renames the Character.
     */
    rename(newName: string): Result<void, ValidationError> {
        const nameResult = Name.create(newName);
        if(nameResult.isFailure) {
            return Result.fail(nameResult.error);
        }

        this._name = nameResult.value;
        this.touch();
        return Result.okVoid();
    }

    /**
     * Updates the Character's description
     */
    updateDescription(content: string): void {
        this._description = RichText.fromString(content);
        this.touch();
    }

    /**
     * Updates the Character's secrets (GM-only content).
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
        if(tagsResult.isFailure) {
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
        if(tagsResult.isFailure) {
            return Result.fail(tagsResult.error);
        }

        this._tags = tagsResult.value;
        this.touch();
        return Result.okVoid();
    }

    /**
     * Removes a single tag
     */
    removeTag(tag: string): void {
        this._tags = this._tags.remove(tag);
        this.touch();
    }

    /**
     * Creates a fork of this character for a specific campaign.
     * The fork is a new entity that references this one as its source.
     */
    fork(intoCampaign: EntityID): Character {
        return new Character({
            id: EntityID.generate(),
            name: this._name,
            description: this._description,
            secrets: this._secrets,
            tags: this._tags.clone(),
            worldID: this._worldID,
            campaignID: intoCampaign,
            forkedFrom: this.id,
            timestamps: Timestamps.now()
        });
    }
}