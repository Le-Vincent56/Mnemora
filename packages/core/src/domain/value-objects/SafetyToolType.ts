/**
   * SafetyToolType: Enum for the types of safety tools available.
   * String values are used for database storage and serialization.
   */
export enum SafetyToolType {
    LINES_AND_VEILS = 'lines_and_veils',
    X_CARD = 'x_card',
    STARS_AND_WISHES = 'stars_and_wishes',
    OPEN_DOOR = 'open_door',
    SCRIPT_CHANGE = 'script_change',
    CUSTOM = 'custom'
}

/**
 * Type guard to check if a string is a valid SafetyToolType.
 */
export function isSafetyToolType(value: string): value is SafetyToolType {
    return Object.values(SafetyToolType).includes(value as SafetyToolType);
}