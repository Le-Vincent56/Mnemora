import { SafetyToolType } from './SafetyToolType';

/**
 * Lines & Veils configuration.
 * Lines: Content that should never appear in the game.
 * Veils: Content that should happen off-screen/fade-to-black.
 */
export interface LinesAndVeilsConfig {
    readonly type: typeof SafetyToolType.LINES_AND_VEILS;
    readonly lines: readonly string[];
    readonly veils: readonly string[];
}

/**
 * X-Card configuration.
 * Simple on/off tool with no additional config.
 */
export interface XCardConfig {
    readonly type: typeof SafetyToolType.X_CARD;
}

/**
 * Stars & Wishes configuration.
 * Stars: What went well this session.
 * Wishes: What players want more of.
 */
export interface StarsAndWishesConfig {
    readonly type: typeof SafetyToolType.STARS_AND_WISHES;
    readonly collectAtSessionEnd: boolean;
}

/**
 * Open Door configuration.
 * Players can step away at any time.
 */
export interface OpenDoorConfig {
    readonly type: typeof SafetyToolType.OPEN_DOOR;
}

/**
 * Script Change configuration.
 * Rewind, pause, fast-forward scene moments.
 */
export interface ScriptChangeConfig {
    readonly type: typeof SafetyToolType.SCRIPT_CHANGE;
}

/**
 * Custom tool configuration.
 * User-defined safety mechanics.
 */
export interface CustomToolConfig {
    readonly type: typeof SafetyToolType.CUSTOM;
    readonly notes: string;
    readonly quickRefText: string;
}

/**
 * Discriminated union of all safety tool configurations.
 */
export type SafetyToolConfig =
    | LinesAndVeilsConfig
    | XCardConfig
    | StarsAndWishesConfig
    | OpenDoorConfig
    | ScriptChangeConfig
    | CustomToolConfig;

/**
 * Creates a default configuration for a given tool type.
 */
export function createDefaultConfig(type: SafetyToolType): SafetyToolConfig {
    switch (type) {
        case SafetyToolType.LINES_AND_VEILS:
            return { type: SafetyToolType.LINES_AND_VEILS, lines: [], veils: [] };
        case SafetyToolType.X_CARD:
            return { type: SafetyToolType.X_CARD };
        case SafetyToolType.STARS_AND_WISHES:
            return { type: SafetyToolType.STARS_AND_WISHES, collectAtSessionEnd: true };
        case SafetyToolType.OPEN_DOOR:
            return { type: SafetyToolType.OPEN_DOOR };
        case SafetyToolType.SCRIPT_CHANGE:
            return { type: SafetyToolType.SCRIPT_CHANGE };
        case SafetyToolType.CUSTOM:
            return { type: SafetyToolType.CUSTOM, notes: '', quickRefText: '' };
    }
}