import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef, useCallback } from 'react';
import { EASING } from '@/tokens';

// ===============================
//          CONFIGURATION
// ===============================

const HELD_BREATH_CONFIG = {
    /** Duration of the held moment (ms) */
    holdDuration: 100,
    /** Time for crystallization to appear (ms) */
    appearDuration: 50,
    /** Size of the crystallization ring (px) */
    ringSize: 56,
    /** Glow intensity at peak */
    glowIntensity: 24,
    /** Colors for the crystallization effect */
    colors: {
        ring: 'rgba(255, 255, 255, 0.9)',
        glow: 'rgba(255, 248, 230, 0.8)', // Warm golden-white
        core: 'rgba(255, 255, 255, 1)',
    },
} as const;

// ===============================
//              TYPES
// ===============================

interface HeldBreathProps {
    /** Whether the held breath phase is active */
    isActive: boolean;
    /** Position of the crystallization (viewport pixels) */
    originX: number;
    originY: number;
    /** Callback when the held moment completes */
    onHoldComplete?: () => void;
    /** Callback at the midpoint (for mode switch) */
    onMidpoint?: () => void;
}

// ===============================
//          MAIN COMPONENT
// ===============================

/**
 * The held breath moment - 100ms of crystallized stillness
 * at the peak of gathered energy before the burst release.
 * 
 * Renders a luminous ring that appears instantly and holds,
 * signaling that energy has reached maximum compression.
 */
export function HeldBreath({
    isActive,
    originX,
    originY,
    onHoldComplete,
    onMidpoint,
}: HeldBreathProps) {
    const holdTimerRef = useRef<number | null>(null);
    const midpointerTimerRef = useRef<number | null>(null);

    // Clean up timers on unmount or deactivation
    const clearTimers = useCallback(() => {
        if (holdTimerRef.current !== null) {
            clearTimeout(holdTimerRef.current);
            holdTimerRef.current = null;
        }
        if (midpointerTimerRef.current !== null) {
            clearTimeout(midpointerTimerRef.current);
            midpointerTimerRef.current = null;
        }
    }, []);

    useEffect(() => {
        if (!isActive) {
            clearTimers();
            return;
        }

        // Fire midpoint callback at 50ms (for mode switch at 500ms total)
        if (onMidpoint) {
            midpointerTimerRef.current = window.setTimeout(() => {
                onMidpoint();
            }, HELD_BREATH_CONFIG.holdDuration / 2);
        }

        // Fire completion callback after full hold duration
        if (onHoldComplete) {
            holdTimerRef.current = window.setTimeout(() => {
                onHoldComplete();
            }, HELD_BREATH_CONFIG.holdDuration);
        }

        return clearTimers;
    }, [isActive, onHoldComplete, onMidpoint, clearTimers]);

    // Calculate position (center the ring on origin point)
    const ringOffset = HELD_BREATH_CONFIG.ringSize / 2;

    return (
        <AnimatePresence>
            {isActive && (
                <motion.div
                    key="held-breath"
                    style={{
                        position: 'absolute',
                        left: originX - ringOffset,
                        top: originY - ringOffset,
                        width: HELD_BREATH_CONFIG.ringSize,
                        height: HELD_BREATH_CONFIG.ringSize,
                        pointerEvents: 'none',
                    }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: 0 } }} // Instant exit — burst takes over
                >
                    {/* Outer glow — soft golden halo */}
                    <motion.div
                        style={{
                            position: 'absolute',
                            inset: -HELD_BREATH_CONFIG.glowIntensity,
                            borderRadius: '50%',
                            background: `radial-gradient(
                                  circle at center,
                                  ${HELD_BREATH_CONFIG.colors.glow} 0%,
                                  transparent 70%
                              )`,
                            filter: `blur(${HELD_BREATH_CONFIG.glowIntensity / 2}px)`,
                        }}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{
                            opacity: 1,
                            scale: 1,
                        }}
                        transition={{
                            duration: HELD_BREATH_CONFIG.appearDuration / 1000,
                            ease: EASING.linear, // No acceleration — stillness
                        }}
                    />

                    {/* Crystallization ring — crisp luminous boundary */}
                    <motion.div
                        style={{
                            position: 'absolute',
                            inset: 0,
                            borderRadius: '50%',
                            border: `2px solid ${HELD_BREATH_CONFIG.colors.ring}`,
                            boxShadow: `
                                  0 0 ${HELD_BREATH_CONFIG.glowIntensity}px ${HELD_BREATH_CONFIG.colors.glow},
                                  inset 0 0 ${HELD_BREATH_CONFIG.glowIntensity / 2}px ${HELD_BREATH_CONFIG.colors.glow}
                              `,
                        }}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{
                            opacity: 1,
                            scale: 1,
                        }}
                        transition={{
                            duration: HELD_BREATH_CONFIG.appearDuration / 1000,
                            ease: EASING.linear,
                        }}
                    />

                    {/* Core point — concentrated energy */}
                    <motion.div
                        style={{
                            position: 'absolute',
                            left: '50%',
                            top: '50%',
                            width: 6,
                            height: 6,
                            marginLeft: -3,
                            marginTop: -3,
                            borderRadius: '50%',
                            backgroundColor: HELD_BREATH_CONFIG.colors.core,
                            boxShadow: `0 0 12px 4px ${HELD_BREATH_CONFIG.colors.glow}`,
                        }}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{
                            opacity: 1,
                            scale: 1,
                        }}
                        transition={{
                            duration: HELD_BREATH_CONFIG.appearDuration / 1000,
                            delay: 0.02, // Tiny delay — core appears last
                            ease: EASING.linear,
                        }}
                    />

                    {/* Subtle pulse — the only motion, barely perceptible */}
                    <motion.div
                        style={{
                            position: 'absolute',
                            inset: -4,
                            borderRadius: '50%',
                            border: `1px solid ${HELD_BREATH_CONFIG.colors.ring}`,
                            opacity: 0.3,
                        }}
                        animate={{
                            scale: [1, 1.08, 1],
                            opacity: [0.3, 0.15, 0.3],
                        }}
                        transition={{
                            duration: HELD_BREATH_CONFIG.holdDuration / 1000,
                            ease: EASING.inOutSine,
                            repeat: 0,
                        }}
                    />
                </motion.div>
            )}
        </AnimatePresence>
    )
}