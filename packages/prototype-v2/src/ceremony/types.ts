import type { EasingTuple } from '@/tokens';

// ===============================
//          CEREMONY TYPES
// ===============================

/**
 * All ceremony types in Mnemora.
 * Using `as const` for literal types and tree-shaking
 */
export const CeremonyType = {
    APP_LOAD: 'app-load',
    WORLD_ENTER: 'world-enter',
    PREP_TO_SESSION: 'prep-to-session',
    SESSION_TO_PREP: 'session-to-prep',
    KEYBOARD_BYPASS: 'keyboard-bypass',
    ENTITY_CREATION: 'entity-creation',
} as const;

export type CeremonyType = (typeof CeremonyType)[keyof typeof CeremonyType];

// ===============================
//          CEREMONY STATE
// ===============================

/**
 * Lifecycle stage of a ceremony.
 * - idle: No ceremony active
 * - running: Ceremony is in progress
 * - complete: Ceremony just finished (reset to idle on next tick)
 */
export type CeremonyStatus = 'idle' | 'running' | 'complete';

/**
 * Granular phases within a ceremony timeline.
 * Not all ceremonies use all phases.
 */
export type CeremonyPhase =
    | 'idle'
    | 'softening'       // Current content blurs/fades
    | 'bokeh-in'        // Particles fade in (left to right stagger)
    | 'color-shift'     // Particles shift through color sequence
    | 'mode-switch'     // data-mode attribute changes
    | 'bokeh-out'       // Particles fade out (right to left stagger)
    | 'surfacing'       // New content enters from below
    | 'crossfade'       // Simple opacity swap (bypass/reduced motion)
    | 'exit'            // Quick exit animation (session -> prep)
    | 'enter'           // Quick enter animation (session -> prep)

/**
 * Complete ceremony state for context consumers.
 */
export interface CeremonyState {
    /** Current ceremony type, or null if idle */
    type: CeremonyType | null;
    /** Broad lifecycle stage */
    status: CeremonyStatus;
    /** Current animation phase within the timeline */
    phase: CeremonyPhase;
    /** Normalized progress 0-1 */
    progress: number;
    /** Timestamp when ceremony started (for interpolation) */
    startedAt: number | null;
}

/** Initial ceremony state (idle, no ceremony). */
export const INITIAL_CEREMONY_STATE: CeremonyState = {
    type: null,
    status: 'idle',
    phase: 'idle',
    progress: 0,
    startedAt: null,
};

// ===============================
//          TIMELINE TYPES
// ===============================

/**
 * Animation target for a timeline phase.
 * - outgoing: Current content being replaced
 * - incoming: New content appearing
 * - overlay: Bokeh particle layer
 * - particles: Individual particle animations
 * - mode: The data-mode attribute (imperative action, not animation)
 * - both: Simultaneous outgoing/incoming (crossfade)
 */
export type AnimationTarget = 
    | 'outgoing'
    | 'incoming'
    | 'overlay'
    | 'particles'
    | 'mode'
    | 'both';

/**
 * Keyframe values for animation properties.
 * Arrays represent [from, ...intermediates, to].
 */
export interface AnimationKeyframes {
    opacity?: number[];
    y?: number[];
    x?: number[];
    scale?: number[];
    blur?: number[];    // filter: blur(Npx)
    rotate?: number[];  // degrees
}

/**
 * Configuration for bokeh particles in a phase.
 */
export interface BokehConfig {
    /** Number of particles (default: 20-25) */
    count?: number;
    /** Stagger delay between particles in ms */
    stagger?: number;
    /** Scale animation [from, to] */
    scale?: [number, number];
    /** Color bias for particle generation */
    colorBias?: 'warm' | 'cool' | 'neutral';
    /** Direction of stagger */
    staggerDirection?: 'left-to-right' | 'right-to-left';
}

/** A single phase within a ceremony timeline. */
export interface TimelinePhase {
    /** Unique identifier for the phase */
    id: CeremonyPhase;
    /** Start time in ms from ceremony start */
    start: number;
    /** Duration in ms (0 for imperative actions like mode-switch) */
    duration: number;
    /** What element(s) this phase animates */
    target: AnimationTarget;
    /** Animation keyframes (if applicable) */
    animation?: AnimationKeyframes | 'color-sequence';
    /** Imperative action (for mode-switch phase) */
    action?: 'SWITCH-MODE'
    /** Bokeh particle configuration (if applicable) */
    particleConfig?: BokehConfig;
    /** Easing curve override (default: memory easing) */
    ease?: EasingTuple;
}

/** Complete ceremony timeline definition. */
export interface CeremonyTimeline {
    /** Ceremony type this timeline is for */
    id: CeremonyType;
    /** Total duration in ms */
    totalDuration: number;
    /** Whether this ceremony uses bokeh particles */
    hasBokeh: boolean;
    /** Ordered list of phases */
    phases: TimelinePhase[];
}

// ===============================
//          CEREMONY CONFIG
// ===============================

/**
 * Configuration for triggering a ceremony.
 */
export interface CeremonyConfig {
    /** Ceremony type to trigger */
    type: CeremonyType;
    /** Use bypass mode (keyboard shortcut, reduced motion) */
    bypass?: boolean;
    /** Callbakc when ceremony completes */
    onComplete?: () => void;
    /** Callback when mode should switch (at 60% for prep-to-session) */
    onModeSwitch?: () => void;
}

// ===============================
//          PARTICLE TYPES
// ===============================

/**
 * Color stops for bokeh particle color shift animation.
 * These match --ceremony-bokeh-* tokens.
 */
export const BOKEH_COLORS = {
    violet: 'rgba(147, 112, 219, 0.4)',
    cornflower: 'rgba(100, 149, 237, 0.4)',
    turquoise: 'rgba(72, 209, 204, 0.4)',
    blush: 'rgba(255, 182, 193, 0.3)',
} as const;

export type BokehColor = keyof typeof BOKEH_COLORS;

/**
 * Pre-computed particle data for the particle pool.
 * Generated once, reused across ceremonies.
 */
export interface BokehParticleData {
    /** Unique ID for React key */
    id: string;
    /** Initial X position (0-100 viewportt %) */
    x: number;
    /** Initial Y position (0-100 viewport %) */
    y: number;
    /** Particle size in px */
    size: number;
    /** Initial color from BOKEH_COLORS */
    initialColor: BokehColor;
    /** Blur amount in px */
    blur: number;
    /** Animation delay offset for stagger (0-1) */
    staggerOffset: number;
}

// ===============================
//          REDUCER ACTIONS
// ===============================

/**
 * Actions for ceremony state reducer.
 */
export type CeremonyAction = 
    | { type: 'START_CEREMONY'; ceremony: CeremonyType; bypass: boolean }
    | { type: 'PHASE_CHANGE'; phase: CeremonyPhase }
    | { type: 'PROGRESS_UPDATE'; progress: number }
    | { type: 'CEREMONY_COMPLETE '}
    | { type: 'RESET' }