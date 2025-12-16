/**
 * EntityType: Enum of all entity types in the domain.
 * Used for discriminating entity subtypes and for type-safe filtering.
 */
export enum EntityType {
    CHARACTER = 'character',
    LOCATION = 'location',
    FACTION = 'faction',
    SESSION = 'session',
    NOTE = 'note',
}

/**
 * Checks if a string is a valid EntityType.
 */
export function isEntityType(value: string): value is EntityType {
    return Object.values(EntityType).includes(value as EntityType);
}

/**
 * Converts a string to EntityType, returning undefined if invalid.
 */
export function toEntityType(value: string): EntityType | undefined {
    if(isEntityType(value)) {
        return value;
    }
    return undefined;
}