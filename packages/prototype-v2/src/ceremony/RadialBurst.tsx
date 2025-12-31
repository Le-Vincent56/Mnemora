import { motion, AnimatePresence } from 'framer-motion';
import { useMemo } from 'react';
import { EASING } from '@/tokens';

// ===============================
//         CONFIGURATION
// ===============================

const BURST_CONFIG = {
    /** Duration of the burst expansion (ms) */
    expandDuration: 350,
    /** Duration of the fade out (ms) */
    fadeDuration: 400,
    /** Maximum scale of the burst */
    maxScale: 4,
    /** Number of concentric rings */
    ringCount: 3,
    /** Stagger between rings (ms) */
    ringStagger: 40,
    /** Initial size of the burst (px) */
    initialSize: 60,
} as const;

/** Color layers for the burst - warm center to cool edges */
const BURST_COLORS = {
    // Core: Golden white
    core: {
        inner: 'rgba(255, 250, 240, 0.95)',
        outer: 'rgba(255, 220, 180, 0.6)',
    },
    // Middle: Transitional violet
    middle: {
        inner: 'rgba(180, 160, 220, 0.7)',
        outer: 'rgba(147, 112, 219, 0.3)',
    },
    // Edge: Cool session blues
    edge: {
        inner: 'rgba(100, 149, 237, 0.5)',
        outer: 'rgba(72, 180, 200, 0.1)',
    },
} as const;

// ===============================
//              TYPES
// ===============================

interface RadialBurstProps {
    /** Whether the burst is active */
    isActive: boolean;
    /** Origin point X (viewport pixels) */
    originX: number;
    /** Origin point Y (viewport pixels) */
    originY: number;
    /** Callback when burst animation completes */
    onBurstComplete?: () => void;
}

interface BurstRingProps {
    index: number;
    originX: number;
    originY: number;
    colors: { inner: string, outer: string };
    delay: number;
}

// ===============================
//          BURST RING
// ===============================

function BurstRing({
    index,
    originX,
    originY,
    colors,
    delay
}: BurstRingProps) {
    // Each ring expands slightly more than the previous
    const scaleMultiplier = 1 + (index * 0.3);
    const targetScale = BURST_CONFIG.maxScale * scaleMultiplier;

    // Outer rings are larger and more diffuse
    const ringSize = BURST_CONFIG.initialSize + (index * 20);
    const blurAmount = 8 + (index * 12);

    return (
        <motion.div
            style={{
                position: 'absolute',
                left: originX - ringSize / 2,
                top: originY - ringSize / 2,
                width: ringSize,
                height: ringSize,
                borderRadius: '50%',
                background: `radial-gradient(
                    circle at center,
                    ${colors.inner} 0%,
                    ${colors.outer} 60%,
                    transparent 100%
                )`,
                filter: `blur(${blurAmount}px)`,
                willChange: 'transform, opacity',
                transform: 'translateZ(0)',
            }}
            initial={{
                scale: 0,
                opacity: 0.9,
            }}
            animate={{
                scale: targetScale,
                opacity: 0,
            }}
            transition={{
                scale: {
                    duration: BURST_CONFIG.expandDuration / 1000,
                    delay,
                    ease: EASING.outExpo,
                },
                opacity: {
                    duration: BURST_CONFIG.fadeDuration / 1000,
                    delay: delay + 0.05,
                    ease: EASING.outQuart,
                },
            }}
        />
    );
}

// ===============================
//         SHOCKWAVE RING
// ===============================

/**
 * A crisp expanding ring that creates a "shockwave" effect.
 * More defined than the soft burst rings.
 */
function ShockwaveRing({ originX, originY }: { originX: number, originY: number }) {
    const size = 40;

    return (
        <motion.div
            style={{
                position: 'absolute',
                left: originX - size / 2,
                top: originY - size / 2,
                width: size,
                height: size,
                borderRadius: '50%',
                border: '2px solid rgba(255, 255, 255, 0.8)',
                boxShadow: `
                    0 0 20px rgba(255, 255, 255, 0.6),
                    0 0 40px rgba(147, 112, 219, 0.4),
                    inset 0 0 20px rgba(255, 255, 255, 0.3)
                `,
                willChange: 'transform, opacity',
            }}
            initial={{
                scale: 0.5,
                opacity: 1,
            }}
            animate={{
                scale: BURST_CONFIG.maxScale * 1.5,
                opacity: 0,
            }}
            transition={{
                scale: {
                    duration: (BURST_CONFIG.expandDuration + 500) / 1000,
                    ease: EASING.outExpo,
                },
                opacity: {
                    duration: BURST_CONFIG.fadeDuration / 1000,
                    delay: 0.1,
                    ease: EASING.outQuart,
                },
            }}
            exit={{
                opacity: 0,
                transition: { duration: 0.1 },
                // Clean up will-change on exit
                willChange: 'auto',
            }}
        />
    );
}

// ===============================
//         PARTICLE SPRAY
// ===============================

interface SprayParticle {
    id: number;
    angle: number;
    distance: number;
    size: number;
    color: string;
    delay: number;
}

function generateSprayParticles(count: number): SprayParticle[] {
    const defaultColor = 'rgba(255, 255, 255, 0.9)';
    const colors = [
        'rgba(255, 248, 230, 0.8)',
        'rgba(147, 112, 219, 0.7)',
        'rgba(100, 149, 237, 0.6)',
    ];

    return Array.from({ length: count }, (_, i) => ({
        id: i,
        angle: (i / count) * 360 + (Math.random() - 0.5) * 30,
        distance: 80 + Math.random() * 120,
        size: 3 + Math.random() * 4,
        color: colors[i % colors.length] ?? defaultColor,
        delay: Math.random() * 0.05,
    }));
}

function ParticleSpray({ originX, originY }: { originX: number; originY: number }) {
    const particles = useMemo(() => generateSprayParticles(12), []);

    return (
        <>
            {particles.map((particle) => {
                const radians = (particle.angle * Math.PI) / 180;
                const targetX = Math.cos(radians) * particle.distance;
                const targetY = Math.sin(radians) * particle.distance;

                return (
                    <motion.div
                        key={particle.id}
                        style={{
                            position: 'absolute',
                            left: originX - particle.size / 2,
                            top: originY - particle.size / 2,
                            width: particle.size,
                            height: particle.size,
                            borderRadius: '50%',
                            backgroundColor: particle.color,
                            boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`
                        }}
                        initial={{
                            x: 0,
                            y: 0,
                            scale: 0,
                            opacity: 1,
                        }}
                        animate={{
                            x: targetX,
                            y: targetY,
                            scale: [0, 1.5, 0.5],
                            opacity: [1, 0.8, 0],
                        }}
                        transition={{
                            duration: 0.4,
                            delay: particle.delay,
                            ease: EASING.outExpo,
                            opacity: {
                                duration: 0.35,
                                delay: particle.delay + 0.1,
                            },
                        }}
                    />
                );
            })}
        </>
    );
}

// ===============================
//         MAIN COMPONENT
// ===============================

/**
 * Radial burst effect - the explosive release of gathered energy.
 * Creates a multi-layered bloom expanding frmo the origin point:
 *  - Shockwave ring: Crisp expanding boundary
 *  - Burst rings: Soft color gradients (warm-to-cool)
 *  - Particle spray: Scattered luminous dots
 * 
 * The color shift (golden-to-violet-to-blue) visually carries
 * the transformation from Prep mode to Session mode
 */
export function RadialBurst({
    isActive,
    originX,
    originY,
    onBurstComplete,
}: RadialBurstProps) {
    // Ring configurations with colors
    const rings = useMemo(() => [
        { colors: BURST_COLORS.core, delay: 0 },
        { colors: BURST_COLORS.middle, delay: BURST_CONFIG.ringStagger / 1000 },
        { colors: BURST_COLORS.edge, delay: (BURST_CONFIG.ringStagger * 2) / 1000 },
    ], []);

    // Total animation duration for completion callback
    const totalDuration =
        BURST_CONFIG.expandDuration +
        BURST_CONFIG.fadeDuration +
        (BURST_CONFIG.ringStagger * (BURST_CONFIG.ringCount - 1));

    return (
        <AnimatePresence>
            {isActive && (
                <motion.div
                    key="radial-burst"
                    style={{
                        position: 'absolute',
                        inset: 0,
                        pointerEvents: 'none',
                        overflow: 'visible',
                    }}
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: 0.1 } }}
                    onAnimationComplete={() => {
                        // Fire completion after all rings have expanded and faded
                        if (onBurstComplete) {
                            setTimeout(onBurstComplete, totalDuration);
                        }
                    }}
                >
                    {/* Shockwave — crisp expanding boundary */}
                    <ShockwaveRing originX={originX} originY={originY} />

                    {/* Burst rings — soft color bloom */}
                    {rings.map((ring, index) => (
                        <BurstRing
                            key={index}
                            index={index}
                            originX={originX}
                            originY={originY}
                            colors={ring.colors}
                            delay={ring.delay}
                        />
                    ))}

                    {/* Particle spray — scattered energy */}
                    <ParticleSpray originX={originX} originY={originY} />

                    {/* Central flash — brief white-out at origin */}
                    <motion.div
                        style={{
                            position: 'absolute',
                            left: originX - 30,
                            top: originY - 30,
                            width: 60,
                            height: 60,
                            borderRadius: '50%',
                            background: 'radial-gradient(circle, rgba(255,255,255,0.95) 0%, transparent 70%)',
                            filter: 'blur(4px)',
                        }}
                        initial={{ scale: 0.5, opacity: 1 }}
                        animate={{ scale: 2, opacity: 0 }}
                        transition={{
                            duration: 0.2,
                            ease: EASING.outExpo,
                        }}
                    />
                </motion.div>
            )}
        </AnimatePresence>
    )
}