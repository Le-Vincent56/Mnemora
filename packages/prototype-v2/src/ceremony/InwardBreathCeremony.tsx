import { useState, useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { GatheringThreads } from './GatheringThreads';
import { Vignette, type VignettePhase } from './Vignette';
import { HeldBreath } from './HeldBreath';
import { RadialBurst } from './RadialBurst';
import { SettlingPhase } from './SettlingPhase';

// ===============================
//     TIMELINE CONFIGURATION
// ===============================

/**
 * The Inward Breath ceremony timeline
 * Each phase has a start time and the component(s) it activates
 * Phases can overlap
 */
const TIMELINE = {
    // Phase boundaries (ms)
    gather: { start: 0, end: 450 },
    peak: { start: 450, end: 550 },
    transform: { start: 550, end: 900 },
    settle: { start: 900, end: 1900 },

    // Key moments
    modeSwitch: 500,
    totalDuration: 1900,

    // Component activation windows
    threads: { start: 0, end: 450 },
    vignette: { start: 100, end: 1200 },
    heldBreath: { start: 450, end: 550 },
    burst: { start: 550, end: 950 },
    settling: { start: 850, end: 1900 },
    memorySurfacing: { start: 200, end: 1000 },
} as const;

// ===============================
//              TYPES
// ===============================

type CeremonyPhase = 'idle' | 'gather' | 'peak' | 'transform' | 'settle' | 'complete';

interface InwardBreathCeremonyProps {
    /** Whether the ceremony is active */
    isActive: boolean;
    /** Origin point for effects (button position in viewport px) */
    originX: number;
    originY: number;
    /** Callback when mode should switch (at 500ms) */
    onModeSwitch?: () => void;
    /** Callback when ceremony completes */
    onComplete?: () => void;
}

interface PhaseState {
    current: CeremonyPhase;
    elapsed: number;
    threads: boolean;
    vignette: VignettePhase;
    heldBreath: boolean;
    burst: boolean;
    settling: boolean;
    memorySurfacing: boolean;
}

// ===============================
//         PHASE CALCULATOR
// ===============================

/**
 * Calculates which components should be active at a given elapsed time.
 */
function calculatePhaseState(elapsed: number, isActive: boolean): PhaseState {
    if (!isActive || elapsed < 0) {
        return {
            current: 'idle',
            elapsed: 0,
            threads: false,
            vignette: 'idle',
            heldBreath: false,
            burst: false,
            settling: false,
            memorySurfacing: false,
        };
    }

    // Determine current macro phase
    let current: CeremonyPhase = 'gather';
    if (elapsed >= TIMELINE.settle.start) {
        current = 'settle';
    } else if (elapsed >= TIMELINE.transform.start) {
        current = 'transform';
    } else if (elapsed >= TIMELINE.peak.start) {
        current = 'peak';
    }

    if (elapsed >= TIMELINE.totalDuration) {
        current = 'complete';
    }

    // Determine vignette phase
    let vignette: VignettePhase = 'idle';
    if (elapsed >= TIMELINE.vignette.start && elapsed < TIMELINE.peak.start) {
        vignette = 'gathering';
    } else if (elapsed >= TIMELINE.peak.start && elapsed < TIMELINE.transform.start) {
        vignette = 'peak';
    } else if (elapsed >= TIMELINE.transform.start && elapsed < TIMELINE.vignette.end) {
        vignette = 'releasing';
    }

    return {
        current,
        elapsed,
        threads: elapsed >= TIMELINE.threads.start && elapsed < TIMELINE.threads.end,
        vignette,
        heldBreath: elapsed >= TIMELINE.heldBreath.start && elapsed < TIMELINE.heldBreath.end,
        burst: elapsed >= TIMELINE.burst.start && elapsed < TIMELINE.burst.end,
        settling: elapsed >= TIMELINE.settling.start,
        memorySurfacing: elapsed >= TIMELINE.memorySurfacing.start && elapsed < TIMELINE.memorySurfacing.end,
    };
}

// ===============================
//         MAIN ORCHESTRATOR
// ===============================

/**
 * The Inward Breath Ceremony Orchestrator
 * 
 * Coordinates all ceremony components according to the master timeline:
 * 0-450ms: Gather - Threads flow inward, vignette darkness
 * 450-550ms: Peak - Held breath crystallization, Mode switch at 500ms
 * 550-900ms: Transform - Radial burst, vignette releases
 * 900-1400ms: Settle - Shimmer, embers, graceful fade
 * 
 * Components overlap intentionally to create layered richness.
 */
export function InwardBreathCeremony({
    isActive,
    originX,
    originY,
    onModeSwitch,
    onComplete,
}: InwardBreathCeremonyProps) {
    const [elapsed, setElapsed] = useState(0);
    const startTimeRef = useRef<number | null>(null);
    const rafRef = useRef<number | null>(null);
    const modeSwitchFiredRef = useRef(false);
    const completeFiredRef = useRef(false);

    // Reset refs when ceremony starts
    useEffect(() => {
        if (!isActive) return;

        modeSwitchFiredRef.current = false;
        completeFiredRef.current = false;
        startTimeRef.current = null;
    }, [isActive]);

    // Animation loop
    useEffect(() => {
        if (!isActive) {
            setElapsed(0);
            startTimeRef.current = null;
            if (rafRef.current !== null) {
                cancelAnimationFrame(rafRef.current);
                rafRef.current = null;
            }
            return;
        }

        const tick = (timestamp: number) => {
            if (startTimeRef.current === null) {
                startTimeRef.current = timestamp;
            }

            const currentElapsed = timestamp - startTimeRef.current;
            setElapsed(currentElapsed);

            // Fire mode switch callback at 500ms (once)
            if (
                currentElapsed >= TIMELINE.modeSwitch &&
                !modeSwitchFiredRef.current
            ) {
                modeSwitchFiredRef.current = true;
                onModeSwitch?.();
            }

            // Continue until settling phase signals completion
            rafRef.current = requestAnimationFrame(tick);
        };

        rafRef.current = requestAnimationFrame(tick);

        return () => {
            if (rafRef.current === null) return;

            cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        };
    }, [isActive, onModeSwitch, onComplete]);

    // Calculate current phase state
    const state = calculatePhaseState(elapsed, isActive);

    // Shift vignette focal point toward the button
    const vignetteFocalX = 10 + (originX * 0.3);
    const vignetteFocalY = originY;

    return (
        <AnimatePresence>
            {isActive && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        pointerEvents: 'none',
                        zIndex: 9999,
                        overflow: 'hidden',
                        // Performance: isolate from the main document
                        contain: 'layout paint',
                        isolation: 'isolate',
                    }}
                    aria-hidden="true"
                >
                    {/* Layer 1: Vignette (background) */}
                    <Vignette
                        phase={state.vignette}
                        focalX={vignetteFocalX}
                        focalY={vignetteFocalY}
                    />

                    {/* Layer 2: Gathering Threads */}
                    <GatheringThreads
                        isActive={state.threads}
                        targetX={originX}
                        targetY={originY}
                    />

                    {/* Layer 3: Held Breath Crystallization */}
                    <HeldBreath
                        isActive={state.heldBreath}
                        originX={originX}
                        originY={originY}
                        onMidpoint={onModeSwitch}
                    />

                    {/* Layer 4: Radial Burst */}
                    <RadialBurst
                        isActive={state.burst}
                        originX={originX}
                        originY={originY}
                    />

                    {/* Layer 5: Settling Phase */}
                    <SettlingPhase
                        isActive={state.settling}
                        onSettleComplete={onComplete}
                    />
                </div>
            )}
        </AnimatePresence>
    );
}

// ===============================
//         TIMELINE EXPORT
// ===============================

export { TIMELINE as INWARD_BREATH_TIMELINE };
export default InwardBreathCeremony;