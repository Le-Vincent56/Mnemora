import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef, useCallback } from 'react';
import { EASING } from '../tokens';

// ===============================
//          CONFIGURATION
// ===============================

const REDUCED_MOTION_CONFIG = {
    /** Total duration of the reduced ceremony (ms) */
    totalDuration: 300,
    /** When mode switch occurs (ms) */
    modeSwitchTime: 150,
    /** Crossfade duration (ms) */
    crossfadeDuration: 300,
    /** Glow pulse duration (ms) */
    glowDuration: 200,
} as const;

// ===============================
//          TYPES
// ===============================

interface ReducedMotionCeremonyProps {
    /** Whether the ceremony is active */
    isActive: boolean;
    /** Origin point for the glow (button position) */
    originX: number;
    originY: number;
    /** Callback when mode should switch (at 150ms) */
    onModeSwitch?: () => void;
    /** Callback when ceremony completes */
    onComplete?: () => void;
}

// ===============================
//          GLOW PULSE
// ===============================

/**
 * A simple, stationary glow that pulses once.
 * No motion through space—just light intensity change.
 */
function GlowPulse({ originX, originY }: { originX: number; originY: number }) {
    const size = 80;

    return (
        <motion.div
            style={{
                position: 'absolute',
                left: originX - size / 2,
                top: originY - size / 2,
                width: size,
                height: size,
                borderRadius: '50%',
                background: `radial-gradient(
                      circle at center,
                      rgba(255, 255, 255, 0.9) 0%,
                      rgba(147, 112, 219, 0.4) 40%,
                      transparent 70%
                  )`,
                filter: 'blur(12px)',
                pointerEvents: 'none',
            }}
            initial={{ opacity: 0 }}
            animate={{
                opacity: [0, 0.8, 0.8, 0],
            }}
            transition={{
                duration: REDUCED_MOTION_CONFIG.glowDuration / 1000,
                times: [0, 0.3, 0.7, 1],
                ease: EASING.inOutSine,
            }}
        />
    );
}

// ===============================
//          CROSSFADE VEIL
// ===============================

/**
 * A gentle screen-wide opacity shift that signals transition.
 * No movement, just a subtle brightness change.
 */
function CrossfadeVeil() {
    return (
        <motion.div
            style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                pointerEvents: 'none',
            }}
            initial={{ opacity: 0 }}
            animate={{
                opacity: [0, 1, 1, 0],
            }}
            transition={{
                duration: REDUCED_MOTION_CONFIG.crossfadeDuration / 1000,
                times: [0, 0.3, 0.7, 1],
                ease: EASING.inOutSine,
            }}
        />
    );
}

// ===============================
//          MAIN COMPONENT
// ===============================

/**
 * Reduced Motion Ceremony — accessible alternative to The Inward Breath.
 *
 * For users with `prefers-reduced-motion: reduce`, provides:
 * - Clean 300ms crossfade (no spatial motion)
 * - Subtle glow pulse at button location (feedback without movement)
 * - Mode switch at midpoint (150ms)
 *
 * This is a designed experience, not a degraded one.
 */
export function ReducedMotionCeremony({
    isActive,
    originX,
    originY,
    onModeSwitch,
    onComplete,
}: ReducedMotionCeremonyProps) {
    const modeSwitchFiredRef = useRef(false);
    const completeFiredRef = useRef(false);
    const startTimeRef = useRef<number | null>(null);

    // Reset refs when ceremony starts
    useEffect(() => {
        if (isActive) {
            modeSwitchFiredRef.current = false;
            completeFiredRef.current = false;
            startTimeRef.current = performance.now();
        }
    }, [isActive]);

    // Handle timing callbacks
    const handleAnimationUpdate = useCallback(() => {
        if (!isActive || startTimeRef.current === null) return;

        const elapsed = performance.now() - startTimeRef.current;

        // Fire mode switch at midpoint
        if (
            elapsed >= REDUCED_MOTION_CONFIG.modeSwitchTime &&
            !modeSwitchFiredRef.current
        ) {
            modeSwitchFiredRef.current = true;
            onModeSwitch?.();
        }

        // Fire completion at end
        if (
            elapsed >= REDUCED_MOTION_CONFIG.totalDuration &&
            !completeFiredRef.current
        ) {
            completeFiredRef.current = true;
            onComplete?.();
        }
    }, [isActive, onModeSwitch, onComplete]);

    // Set up timing loop
    useEffect(() => {
        if (!isActive) return;

        const interval = setInterval(handleAnimationUpdate, 16); // ~60fps check

        // Also set a timeout for guaranteed completion
        const timeout = setTimeout(() => {
            if (!completeFiredRef.current) {
                completeFiredRef.current = true;
                onComplete?.();
            }
        }, REDUCED_MOTION_CONFIG.totalDuration + 50);

        return () => {
            clearInterval(interval);
            clearTimeout(timeout);
        };
    }, [isActive, handleAnimationUpdate, onComplete]);

    return (
        <AnimatePresence>
            {isActive && (
                <motion.div
                    key="reduced-motion-ceremony"
                    style={{
                        position: 'fixed',
                        inset: 0,
                        pointerEvents: 'none',
                        zIndex: 9999,
                    }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: 0.1 } }}
                    aria-hidden="true"
                >
                    {/* Subtle screen-wide veil */}
                    <CrossfadeVeil />

                    {/* Glow pulse at button location */}
                    <GlowPulse originX={originX} originY={originY} />
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export default ReducedMotionCeremony;