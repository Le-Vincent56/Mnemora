/**
 * Animation duration constants in milliseconds.
 * 
 * For Framer Motion, divide by 1000 to convert to seconds:
 * `duration: TIMING.fast / 1000`
 * Can also use the `toSeconds(ms: number)` method
 * 
 * These values mirror --duration-* in globals.css
 */
export const TIMING = {
    instant: 100,       // Instant feedback (button press, toggle)
    fast: 150,          // Quick transitions (hover states, small movements)
    normal: 200,        // Standard transitions (most UI state changes)
    gentle: 300,        // Gentle transitions (panels, larger movements)
    ceremony: 1000,     // Full ceremony (Prep -> Session transition)
    release: 350,       // Quick release (Session -> Prep transition)
    bypass: 250,        // Keyboard bypass (instant mode switch)
    creation: 400,      // Entity creation awakening
    appLoad: 700,       // App load ceremony
    worldEnter: 800,    // World enter ceremony
} as const;

export type TimingKey = keyof typeof TIMING;

/**
 * Convert milliseconds to seconds for Framer Motion.
 * 
 * @example
 * transition={{ duration: toSeconds(TIMING.fast) }}
 */
export function toSeconds(ms: number): number {
    return ms / 1000;
}