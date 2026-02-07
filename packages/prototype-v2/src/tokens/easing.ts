/**
 * Easing curves for animations.
 * 
 * Framer Motion accepts easing as:
 * - String: "easeOut", "easeIn", etc.
 * - Array: [x1, y1, x2, y2] cubic-bezier values
 * 
 * We use arrays for precise control matching our CSS custom properties.
 * These values mirror --ease-* in globals.css
 */

/**
 * Cubic bezier tuple type for Framer Motion
 */
export type EasingTuple = [number, number, number, number];

export const EASING = {
    /**
     * Ease out - Quick start, gentle finish.
     * Use for: Elements entering, appearing, expanding.
     */
    out: [0.33, 1, 0.68, 1] as EasingTuple,

    /**
     * Ease in - Gentle start, quick finish.
     * Use for: Elements leaving, disappearing, collapsing.
     */
    in: [0.32, 0, 0.67, 0] as EasingTuple,

    /**
     * Ease in-out - Gentle start and finish.
     * Use for: State changes, transforms that don't enter/exit.
     */
    inOut: [0.65, 0, 0.35, 1] as EasingTuple,

    /**
     * Memory easing - Signature Mnemora curve.
     * Slightly more dramatic than standard ease-out.
     * Use for: Memory surfacing, content appearing from below.
     */
    memory: [0.2, 0.8, 0.2, 1] as EasingTuple,

    /**
     * Standard - Material Design inspired default.
     * Use for: General-purpose when no specific feel is needed.
     */
    standard: [0.4, 0, 0.2, 1] as EasingTuple,

    /**
     * Out Quart - Immediate response, quick settle.
     * Physical sensation: Snappy, responsive, and confident.
     * Use for: Button press acknowledgement, immediate feedback
     */
    outQuart: [0.25, 1, 0.5, 1] as EasingTuple,

    /**
     * In Quad - Gentle start, accelerates to finish.
     * Physical sensation: Gathering momentum, building tension
     * Use for: Gathering threads flowing inward during ceremony.
     */
    inQuad: [0.55, 0.085, 0.68, 0.53] as EasingTuple,

    /**
     * Out Expo - Explosive start, very long tail.
     * Physical sensation: Burst of energy, satisfying release.
     * Use for: Radial burst expansion during ceremony transform.
     */
    outExpo: [0.16, 1, 0.3, 1] as EasingTuple,

    /**
     * In-Out Sine - Organic, wave-like acceleration.
     * Physical sensation: Natural rhythm, breathing quality.
     * Use for: Shimmer pass, settling animations.
     */
    inOutSine: [0.37, 0, 0.63, 1] as EasingTuple,

    /**
     * Linear - No acceleration.
     * Physical sensation: Mechanical, uniform, held tension.
     * Use for: Held breath pause (stillness through absence of curve).
     */
    linear: [0, 0, 1, 1] as EasingTuple,
} as const;

/** Type for easing keys */
export type EasingKey = keyof typeof EASING;

/**
 * Spring configurations for physics-based animations.
 * Use with Framer Motion's `transition={{ type: "spring", ...SPRING.gentle }}`
 */
export const SPRING = {
    /** Snappy repsonse, minimal overshoot */
    snappy: {
        stiffness: 400,
        damping: 30,
        mass: 1,
    },

    /** Gentle, floaty feel - good for larger elements */
    gentle: {
        stiffness: 200,
        damping: 20,
        mass: 1,
    },

    /** Bouncy, playful - use sparingly */
    bouncy: {
        stiffness: 300,
        damping: 15,
        mass: 1,
    },
} as const;

/** Type for spring keys */
export type SpringKey = keyof typeof SPRING;