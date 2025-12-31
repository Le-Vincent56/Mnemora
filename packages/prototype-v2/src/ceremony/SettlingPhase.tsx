import { motion, AnimatePresence } from 'framer-motion';
import { useMemo } from 'react';
import { EASING } from '@/tokens';

// ===============================
//         CONFIGURATION
// ===============================

const SETTLING_CONFIG = {
    /** Duration of the shimmer sweep (ms) */
    shimmerDuration: 300,
    /** Duration of ember drift (ms) */
    emberDuration: 500,
    /** Number of cooling embers */
    emberCount: 8,
    /** Delay before shimmer starts (after burst peak) */
    shimmerDelay: 100,
    /** Total settling phase duration (ms) */
    totalDuration: 500,
} as const;

const EMBER_COLORS = [
    'rgba(255, 248, 230, 0.6)',
    'rgba(180, 160, 220, 0.5)',
    'rgba(100, 149, 237, 0.4)',
    'rgba(72, 209, 204, 0.3)',
] as const;

// ===============================
//              TYPES
// ===============================

interface SettlingPhaseProps {
    /** Whether the settling phase is active */
    isActive: boolean;
    /** Callback when settling completes */
    onSettleComplete?: () => void;
}

interface Ember {
    id: number;
    startX: number;
    startY: number;
    driftX: number;
    driftY: number;
    size: number;
    color: string;
    delay: number;
    duration: number;
}

// ===============================
//         SHIMMER PASS
// ===============================

/**
 * A diagonal wave of light that sweeps across the viewport,
 * like sunlight moving across a surface after the dust settles.
 */

function ShimmerPass() {
    return (
        <motion.div
            style={{
                position: 'absolute',
                inset: 0,
                overflow: 'hidden',
                pointerEvents: 'none',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
        >
            {/* Primary shimmer band */}
            <motion.div
                style={{
                    position: 'absolute',
                    top: '-50%',
                    left: '-100%',
                    width: '60%',
                    height: '200%',
                    background: `linear-gradient(
                          105deg,
                          transparent 0%,
                          transparent 40%,
                          rgba(255, 255, 255, 0.03) 45%,
                          rgba(255, 255, 255, 0.08) 50%,
                          rgba(255, 255, 255, 0.03) 55%,
                          transparent 60%,
                          transparent 100%
                      )`,
                    transform: 'skewX(-15deg)',
                }}
                initial={{ x: '0%' }}
                animate={{ x: '400%' }}
                transition={{
                    duration: SETTLING_CONFIG.shimmerDuration / 1000,
                    delay: SETTLING_CONFIG.shimmerDelay / 1000,
                    ease: EASING.inOutSine,
                }}
            />

            {/* Secondary shimmer (softer, slightly delayed) */}
            <motion.div
                style={{
                    position: 'absolute',
                    top: '-50%',
                    left: '-100%',
                    width: '40%',
                    height: '200%',
                    background: `linear-gradient(
                          105deg,
                          transparent 0%,
                          transparent 42%,
                          rgba(100, 149, 237, 0.02) 48%,
                          rgba(100, 149, 237, 0.05) 50%,
                          rgba(100, 149, 237, 0.02) 52%,
                          transparent 58%,
                          transparent 100%
                      )`,
                    transform: 'skewX(-15deg)',
                }}
                initial={{ x: '0%' }}
                animate={{ x: '450%' }}
                transition={{
                    duration: (SETTLING_CONFIG.shimmerDuration + 100) / 1000,
                    delay: (SETTLING_CONFIG.shimmerDelay + 80) / 1000,
                    ease: EASING.inOutSine,
                }}
            />
        </motion.div>
    );
}

// ===============================
//          COOLING EMBERS
// ===============================

/**
 * Generates ember particles that drift upward and fade,
 * like the last sparks after a fire settles.
 */
function generateEmbers(count: number): Ember[] {
    const defaultColor = EMBER_COLORS[0];

    return Array.from({ length: count }, (_, i) => {
        // Dstribute across lower portion of viewport
        const startX = 15 + Math.random() * 70;
        const startY = 50 + Math.random() * 40;

        return {
            id: i,
            startX,
            startY,
            driftX: (Math.random() - 0.5) * 30,
            driftY: -(40 + Math.random() * 60),
            size: 2 + Math.random() * 4,
            color: EMBER_COLORS[i % EMBER_COLORS.length] ?? defaultColor,
            delay: Math.random() * 0.15,
            duration: 0.4 + Math.random() * 0.2,
        };
    });
}

function CoolingEmbers() {
    const embers = useMemo(() => generateEmbers(SETTLING_CONFIG.emberCount), []);

    return (
        <>
            {embers.map((ember) => (
                <motion.div
                    key={ember.id}
                    style={{
                        position: 'absolute',
                        left: `${ember.startX}%`,
                        top: `${ember.startY}%`,
                        width: ember.size,
                        height: ember.size,
                        borderRadius: '50%',
                        backgroundColor: ember.color,
                        boxShadow: `0 0 ${ember.size * 3}px ${ember.color}`,
                        pointerEvents: 'none',
                    }}
                    initial={{
                        opacity: 0.8,
                        scale: 1,
                        x: 0,
                        y: 0,
                    }}
                    animate={{
                        opacity: 0,
                        scale: 0.3,
                        x: ember.driftX,
                        y: ember.driftY,
                    }}
                    transition={{
                        duration: ember.duration,
                        delay: ember.delay,
                        ease: EASING.outQuart,
                        opacity: {
                            duration: ember.duration * 0.8,
                            delay: ember.delay + ember.duration * 0.2
                        },
                    }}
                />
            ))}
        </>
    );
}

// ===============================
//         SURFACE RIPPLE
// ===============================

/**
 * A subtle expanding ripple that suggests the surface
 * settling after being disturbed, like water calming.
 */
function SurfaceRipple() {
    return (
        <motion.div
            style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: 200,
                height: 200,
                marginLeft: -100,
                marginTop: -100,
                borderRadius: '50%',
                border: '1px solid rgba(100, 149, 237, 0.15)',
                pointerEvents: 'none',
            }}
            initial={{
                scale: 1,
                opacity: 0.4,
            }}
            animate={{
                scale: 8,
                opacity: 0,
            }}
            transition={{
                duration: 0.6,
                delay: 0.05,
                ease: EASING.outQuart,
            }}
        />
    )
}

// ===============================
//         AMBIENT FADE
// ===============================

/**
 * A very subtle overall brightness adjustment
 * that signals the transition is complete and normal state is restored.
 */
function AmbientFade() {
    return (
        <motion.div
            style={{
                position: 'absolute',
                inset: 0,
                background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.02) 0%, transparent 70%)',
                pointerEvents: 'none',
            }}
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{
                duration: 0.5,
                delay: 0.2,
                ease: EASING.outQuart,
            }}
        />
    );
}

// ===============================
//         MAIN COMPONENT
// ===============================

/**
 * The settling phase - graceful resolution after the burst.
 * 
 * Combines multiple subtle effects to create a polished ending:
 * - Shimmer pass: Diagonal light sweep across viewport
 * - Cooling embers: Particles drifting upward and fading
 * - Surface ripple: Expanding ring suggesting calm returning
 * - Ambient fade: Overall brightness returning to normal
 * 
 * This prevents an abrupt ending
 */
export function SettlingPhase({
    isActive,
    onSettleComplete,
}: SettlingPhaseProps) {
    return (
        <AnimatePresence>
            {isActive && (
                <motion.div
                    key="settling-phase"
                    style={{
                        position: 'absolute',
                        inset: 0,
                        pointerEvents: 'none',
                        overflow: 'hidden',
                    }}
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: 0.2 } }}
                    onAnimationComplete={() => {
                        // Fire completion after all settling effects finish
                        if (onSettleComplete) {
                            setTimeout(onSettleComplete, SETTLING_CONFIG.totalDuration);
                        }
                    }}
                >
                    {/* Surface ripple — expanding calm */}
                    <SurfaceRipple />

                    {/* Shimmer pass — light sweep */}
                    <ShimmerPass />

                    {/* Cooling embers — final particles */}
                    <CoolingEmbers />

                    {/* Ambient fade — brightness normalization */}
                    <AmbientFade />
                </motion.div>
            )}
        </AnimatePresence>
    );
}