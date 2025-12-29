import { TIMING } from '@/tokens';
import {
    CeremonyTimeline,
    CeremonyType,
    TimelinePhase,
} from './types';

// ===============================
//          PREP -> SESSION
// ===============================

/**
 * The signature ceremony: Prep Mode to Session Mode.
 */
export const PREP_TO_SESSION_TIMELINE: CeremonyTimeline = {
    id: CeremonyType.PREP_TO_SESSION,
    totalDuration: TIMING.ceremony,
    hasBokeh: true,
    phases: [
        {
            id: 'softening',
            start: 0,
            duration: 200,
            target: 'outgoing',
            animation: {
                opacity: [1, 0.6],
                blur: [0, 4],
            },
        },
        {
            id: 'bokeh-in',
            start: 100,
            duration: 300,
            target: 'overlay',
            animation: {
                opacity: [0, 1],
            },
            particleConfig: {
                count: 22,
                stagger: 55,
                scale: [0.8, 1],
                staggerDirection: 'left-to-right',
            },
        },
        {
            id: 'color-shift',
            start: 200,
            duration: 400,
            target: 'particles',
            animation: 'color-sequence',
        },
        {
            id: 'mode-switch',
            start: 500,
            duration: 0,
            target: 'mode',
            action: 'SWITCH_MODE',
        },
        {
            id: 'bokeh-out',
            start: 600,
            duration: 250,
            target: 'overlay',
            animation: {
                opacity: [1, 0],
            },
            particleConfig: {
                stagger: 45,
                scale: [1, 1.1],
                staggerDirection: 'right-to-left',
            },
        },
        {
            id: 'surfacing',
            start: 750,
            duration: 250,
            target: 'incoming',
            animation: {
                opacity: [0, 1],
                y: [12, 0],
            },
        },
    ],
};

// ===============================
//          SESSION -> PREP
// ===============================

/**
 * Quick release: Session Mode back to Prep Mode.
 * No bokeh, just a snappy exit/enter.
 */
export const SESSION_TO_PREP_TIMELINE: CeremonyTimeline = {
    id: CeremonyType.SESSION_TO_PREP,
    totalDuration: TIMING.release,
    hasBokeh: false,
    phases: [
        {
            id: 'exit',
            start: 0,
            duration: 150,
            target: 'outgoing',
            animation: {
                opacity: [1, 0],
                y: [0, -8],
            },
        },
        {
            id: 'mode-switch',
            start: 100,
            duration: 0,
            target: 'mode',
            action: 'SWITCH_MODE',
        },
        {
            id: 'enter',
            start: 150,
            duration: 200,
            target: 'incoming',
            animation: {
                opacity: [0, 1],
                y: [8, 0],
            },
        },
    ],
};

// ===============================
//          KEYBOARD BYPASS
// ===============================

/**
 * Keyboard bypass: Instant mode switch via keyboard shortcut.
 * Simple crossfade, no ceremony. Also used for reduced motion.
 */
export const KEYBOARD_BYPASS_TIMELINE: CeremonyTimeline = {
    id: CeremonyType.KEYBOARD_BYPASS,
    totalDuration: TIMING.bypass,
    hasBokeh: false,
    phases: [
        {
            id: 'crossfade',
            start: 0,
            duration: 250,
            target: 'both',
            animation: {
                opacity: [1, 0],
            },
        },
        {
            id: 'mode-switch',
            start: 125,
            duration: 0,
            target: 'mode',
            action: 'SWITCH_MODE',
        },
    ],
};

// ===============================
//             APP LOAD
// ===============================

/**
 * App load ceremony: Initial reveal when the app starts.
 * Bokeh wash -> Mnemora title -> World list surfaces.
 */
export const APP_LOAD_TIMELINE: CeremonyTimeline = {
    id: CeremonyType.APP_LOAD,
    totalDuration: TIMING.appLoad,
    hasBokeh: true,
    phases: [
        {
            id: 'bokeh-in',
            start: 0,
            duration: 350,
            target: 'overlay',
            animation: {
                opacity: [0, 0.6, 0.6, 0],
            },
            particleConfig: {
                count: 10,
                stagger: 30,
                colorBias: 'warm',
                staggerDirection: 'left-to-right',
            },
        },
        {
            id: 'surfacing',
            start: 150,
            duration: 300,
            target: 'incoming',
            animation: {
                opacity: [0, 1],
                y: [12, 0],
            },
        },
    ],
};

// ===============================
//          WORLD ENTER
// ===============================

/**
 * World enter ceremony: Selecting a world from the title page.
 * World grid fades -> Bokeh wash -> Workspace surfaces.
 */
export const WORLD_ENTER_TIMELINE: CeremonyTimeline = {
    id: CeremonyType.WORLD_ENTER,
    totalDuration: TIMING.worldEnter,
    hasBokeh: true,
    phases: [
        {
            id: 'exit',
            start: 0,
            duration: 200,
            target: 'outgoing',
            animation: {
                opacity: [1, 0],
                scale: [1, 0.98],
            },
        },
        {
            id: 'bokeh-in',
            start: 100,
            duration: 400,
            target: 'overlay',
            animation: {
                opacity: [0, 0.8, 0.8, 0], // Fade in, hold, fade out
            },
            particleConfig: {
                count: 12,
                stagger: 25,
                colorBias: 'warm',
                staggerDirection: 'left-to-right',
            },
        },
        {
            id: 'surfacing',
            start: 400,
            duration: 300,
            target: 'incoming',
            animation: {
                opacity: [0, 1],
                y: [20, 0],
                scale: [0.95, 1],
            },
        },
    ],
}

// ===============================
//          ENTITY CREATION
// ===============================

/**
 * Entity creation awakening: Brief acknowledgement when creating new entity.
 * No bokeh, just a subtle pulse with type-colored glow.
 */
export const ENTITY_CREATION_TIMELINE: CeremonyTimeline = {
    id: CeremonyType.ENTITY_CREATION,
    totalDuration: TIMING.creation,
    hasBokeh: false,
    phases: [
        {
            id: 'surfacing',
            start: 0,
            duration: 250,
            target: 'incoming',
            animation: {
                opacity: [0, 1],
                scale: [0.92, 1],
                y: [8, 0],
            },
        },
        // Note: Type icon pulse and border glow are handled by
        // the EntityCard component using CSS animations triggered
        // by a data-awakening attribute
    ],
};

// ===============================
//     REDUCED MOTION FALLBACK
// ===============================

/**
 * Reduced motion fallback: 250ms crossfade for all ceremonies.
 * This is a designed experience, not a truncated version.
 */
export const REDUCED_MOTION_TIMELINE: CeremonyTimeline = {
    id: CeremonyType.KEYBOARD_BYPASS, // Reuses bypass type
    totalDuration: 250,
    hasBokeh: false,
    phases: [
        {
            id: 'crossfade',
            start: 0,
            duration: 250,
            target: 'both',
            animation: {
                opacity: [1, 0],
            },
        },
        {
            id: 'mode-switch',
            start: 125,
            duration: 0,
            target: 'mode',
            action: 'SWITCH_MODE',
        },
    ],
};

// ===============================
//          TIMELINE LOOKUP
// ===============================

/**
 * Get the timeline for a ceremony type.
 * If reducedMotion is true, returns the 250ms crossfade fallback.
 */
export function getTimeline(
    type: CeremonyType,
    reducedMotion: boolean = false
): CeremonyTimeline {
    if(reducedMotion) {
        return REDUCED_MOTION_TIMELINE;
    }

    switch(type) {
        case CeremonyType.PREP_TO_SESSION:
            return PREP_TO_SESSION_TIMELINE;
        case CeremonyType.SESSION_TO_PREP:
            return SESSION_TO_PREP_TIMELINE;
        case CeremonyType.KEYBOARD_BYPASS:
            return KEYBOARD_BYPASS_TIMELINE;
        case CeremonyType.APP_LOAD:
            return APP_LOAD_TIMELINE;
        case CeremonyType.WORLD_ENTER:
            return WORLD_ENTER_TIMELINE;
        case CeremonyType.ENTITY_CREATION:
            return ENTITY_CREATION_TIMELINE;
        default:
            return KEYBOARD_BYPASS_TIMELINE;
    }
}

/**
 * Get the phase that should be active at a given progress point.
 */
export function getActivePhase(
    timeline: CeremonyTimeline,
    elapsedMs: number
): TimelinePhase | null {
    // Find phases that are currently active (started but not ended)
    const activePhases = timeline.phases.filter((phase) => {
        const phaseEnd = phase.start + phase.duration;
        return elapsedMs >= phase.start && elapsedMs < phaseEnd;
    });

    // Return the last active phase (highest priority)
    return activePhases[activePhases.length - 1] ?? null;
}

/**
 * Check if the mode switch should happen at the current elapsed time.
 * Returns true only once, at the exact frame when we cross the threshold.
 */
export function shouldSwitchMode(
    timeline: CeremonyTimeline,
    previousElapsedMs: number,
    currentElapsedMs: number
): boolean {
    const modeSwitchPhase = timeline.phases.find(
        (p) => p.action === 'SWITCH_MODE'
    );

    if(!modeSwitchPhase) return false;

    // Return true if we just crossed the mode switch time
    return (
        previousElapsedMs < modeSwitchPhase.start &&
        currentElapsedMs >= modeSwitchPhase.start
    );
}

/** Calculate phase-local progress (0-1) for animation interpolation. */
export function getPhaseProgress(
    phase: TimelinePhase,
    elapsedMs: number
): number {
    if(phase.duration === 0) return 1;

    const phaseElapsed = elapsedMs - phase.start;
    return Math.max(0, Math.min(1, phaseElapsed / phase.duration));
}