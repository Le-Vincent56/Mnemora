import { EntityType } from '../entities/EntityType';

/**
 * Type-specific fields for Character entities.
 */
export interface CharacterFields {
    readonly type: EntityType.CHARACTER;
    readonly appearance?: string;
    readonly personality?: string;
    readonly motivation?: string;
    readonly voiceMannerisms?: string;
}

/**
 * Type-specific fields for Location entities.
 */
export interface LocationFields {
    readonly type: EntityType.LOCATION;
    readonly appearance?: string;
    readonly atmosphere?: string;
    readonly notableFeatures?: string;
}

/**
 * Type-specific fields for Faction entities.
 */
export interface FactionFields {
    readonly type: EntityType.FACTION;
    readonly ideology?: string;
    readonly goals?: string;
    readonly resources?: string;
    readonly structure?: string;
}

/**
 * Type-specific fields for Note entities.
 */
export interface NoteFields {
    readonly type: EntityType.NOTE;
    readonly content?: string;
}

/**
 * Type-specific fields for Session entities.
 */
export interface SessionFields {
    readonly type: EntityType.SESSION;
    readonly prepNotes?: string;
}

/**
 * Type-specific fields for Event entities
 */
export interface EventFields {

    readonly type: EntityType.EVENT;
    readonly inWorldTime?: string;
    readonly realWorldAnchor?: string;
    readonly involvedEntityIDs?: string;
    readonly locationID?: string;
    readonly outcomes?: string;
}

/**
 * Discriminated union of all type-specific fields.
 */
export type TypeSpecificFields =
    | CharacterFields
    | LocationFields
    | FactionFields
    | NoteFields
    | SessionFields
    | EventFields;

/**
 * Maps EntityType to its corresponding fields interface.
 */
export type FieldsFor<T extends EntityType> =
    T extends EntityType.CHARACTER ? CharacterFields :
    T extends EntityType.LOCATION ? LocationFields :
    T extends EntityType.FACTION ? FactionFields :
    T extends EntityType.NOTE ? NoteFields :
    T extends EntityType.SESSION ? SessionFields :
    T extends EntityType.EVENT ? EventFields :
    never;

/**
 * Field names for each entity type (excluding the 'type' discriminant).
 */
export const TYPE_SPECIFIC_FIELD_NAMES: Record<EntityType, readonly string[]> = {
    [EntityType.CHARACTER]: ['appearance', 'personality', 'motivation', 'voiceMannerisms'],
    [EntityType.LOCATION]: ['appearance', 'atmosphere', 'notableFeatures'],
    [EntityType.FACTION]: ['ideology', 'goals', 'resources', 'structure'],
    [EntityType.NOTE]: ['content'],
    [EntityType.SESSION]: ['prepNotes'],
    [EntityType.EVENT]: ['inWorldTime', 'realWorldAnchor', 'involvedEntityIDs', 'locationID', 'outcomes'],
} as const;

/**
 * TypeSpecificFieldsWrapper: Immutable wrapper for type-specific entity fields.
 * Handles serialization/deserialization and provides type-safe field access.
 */
export class TypeSpecificFieldsWrapper<T extends EntityType = EntityType> {
    private constructor(
        private readonly entityType: T,
        private readonly fields: Omit<FieldsFor<T>, 'type'>
    ) {
        Object.freeze(this.fields);
    }

    /**
     * Creates empty type-specific fields for the given entity type.
     */
    static createForType<T extends EntityType>(type: T): TypeSpecificFieldsWrapper<T> {
        const emptyFields = {} as Omit<FieldsFor<T>, 'type'>;
        return new TypeSpecificFieldsWrapper(type, emptyFields);
    }

    /**
     * Deserializes type-specific fields from a JSON string.
     * Returns empty fields if JSON is null, empty, or invalid.
     */
    static fromJSON<T extends EntityType>(
        type: T,
        json: string | null | undefined
    ): TypeSpecificFieldsWrapper<T> {
        if (!json || json.trim() === '' || json === '{}') {
            return TypeSpecificFieldsWrapper.createForType(type);
        }

        try {
            const parsed = JSON.parse(json) as Record<string, unknown>;
            const validFieldNames = TYPE_SPECIFIC_FIELD_NAMES[type];
            const fields = {} as Record<string, string | undefined>;

            // Only include valid fields for this entity type
            for (const fieldName of validFieldNames) {
                const value = parsed[fieldName];
                if (typeof value === 'string') {
                    fields[fieldName] = value;
                }
            }

            return new TypeSpecificFieldsWrapper(type, fields as Omit<FieldsFor<T>, 'type'>);
        } catch {
            // Invalid JSON - return empty fields
            return TypeSpecificFieldsWrapper.createForType(type);
        }
    }

    /**
     * Serializes the fields to a JSON string.
     */
    toJSON(): string {
        return JSON.stringify(this.fields);
    }

    /**
     * Returns the full TypeSpecificFields object with type discriminant.
     */
    toFields(): FieldsFor<T> {
        return {
            type: this.entityType,
            ...this.fields,
        } as FieldsFor<T>;
    }

    /**
     * Gets a field value by name.
     * Returns undefined if the field doesn't exist or isn't set.
     */
    getField(fieldName: string): string | undefined {
        if (!this.isValidField(fieldName)) {
            return undefined;
        }
        return (this.fields as Record<string, string | undefined>)[fieldName];
    }

    /**
     * Creates a new wrapper with the specified field updated.
     * Returns null if the field name is not valid for this entity type.
     */
    setField(fieldName: string, value: string | undefined): TypeSpecificFieldsWrapper<T> | null {
        if (!this.isValidField(fieldName)) {
            return null;
        }

        const newFields = {
            ...this.fields,
            [fieldName]: value,
        };

        // Remove undefined values
        if (value === undefined) {
            delete (newFields as Record<string, unknown>)[fieldName];
        }

        return new TypeSpecificFieldsWrapper(this.entityType, newFields as Omit<FieldsFor<T>, 'type'>);
    }

    /**
     * Checks if a field name is valid for this entity type.
     */
    isValidField(fieldName: string): boolean {
        return TYPE_SPECIFIC_FIELD_NAMES[this.entityType].includes(fieldName);
    }

    /**
     * Returns the list of valid field names for this entity type.
     */
    getValidFieldNames(): readonly string[] {
        return TYPE_SPECIFIC_FIELD_NAMES[this.entityType];
    }

    /**
     * Returns true if all fields are empty/undefined.
     */
    isEmpty(): boolean {
        return Object.keys(this.fields).length === 0 ||
            Object.values(this.fields).every(v => v === undefined || v === '');
    }
}