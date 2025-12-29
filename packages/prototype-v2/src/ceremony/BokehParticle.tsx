import { memo, useMemo, useState } from 'react';
import { motion, type Variants } from 'framer-motion';
import { EASING, toSeconds } from '@/tokens';
import { BOKEH_COLORS, type BokehParticleData, type BokehColor } from './types';

// ===============================
//              TYPES
// ===============================

interface BokehParticleProps {
    /** Pre-computed particle data */
    particle: BokehParticleData;
    /** Current animation phase */
    phase: 'entering' | 'color-shift' | 'exiting' | 'idle';
    /** Stagger delay in ms (applied based on staggerOffset) */
    staggerDelay: number;
    /** Direction of the stagger wave */
    staggerDirection: 'left-to-right' | 'right-to-left'
    /** Duration of the current phase in ms */
    phaseDuration: number;
}

// ===============================
//          COLOR SEQUENCE
// ===============================

/**
 * Order of colors during color-shift phase.
 * Each particle starts at its initialColor, then cycles through.
 */
const COLOR_SEQUENCE: BokehColor[] = ['violet', 'cornflower', 'turquoise', 'blush'];

/**
 * Get the color sequence starting from a given initial color.
 */
function getColorSequence(startColor: BokehColor): string[] {
    const startIndex = COLOR_SEQUENCE.indexOf(startColor);
    const sequence: string[] = [];

    for(let i = 0; i < COLOR_SEQUENCE.length; i++) {
        const index = (startIndex + i) % COLOR_SEQUENCE.length;
        const colorKey = COLOR_SEQUENCE[index] as BokehColor;
        sequence.push(BOKEH_COLORS[colorKey]);
    }

    return sequence;
}

// ===============================
//          COMPONENT
// ===============================

export const BokehParticle = memo(function BokehParticle({
    particle,
    phase,
    staggerDelay,
    staggerDirection,
    phaseDuration,
}: BokehParticleProps) {
    const delay = useMemo(() => {
        const offset = staggerDirection === 'left-to-right'
            ? particle.staggerOffset
            : 1 - particle.staggerOffset;

        return offset * staggerDelay;
    }, [particle.staggerOffset, staggerDelay, staggerDirection]);

    // Get color sequence for this particle
    const colorSequence = useMemo(
        () => getColorSequence(particle.initialColor),
        [particle.initialColor]
    );

    // Animation variants
    const variants: Variants = useMemo(
        () => ({
            idle: {
                opacity: 0,
                scale: 0.8,
            },
            entering: {
                opacity: 1,
                scale: 1,
                transition: {
                    duration: toSeconds(phaseDuration),
                    delay: toSeconds(delay),
                    ease: EASING.memory,
                },
            },
            'color-shift': {
                opacity: 1,
                scale: 1,
            },
            exiting: {
                opacity: 0,
                scale: 1.1,
                transition: {
                    duration: toSeconds(phaseDuration),
                    delay: toSeconds(delay),
                    ease: EASING.out,
                },
            },
        }),
        [phaseDuration, delay]
    );

    // Background color animation for color-shift phase
    const colorVariants: Variants = useMemo(
        () => ({
            idle: {
                backgroundColor: colorSequence[0],
            },
            entering: {
                backgroundColor: colorSequence[0],
            },
            'color-shift': {
                backgroundColor: colorSequence,
                transition: {
                    duration: toSeconds(phaseDuration),
                    ease: 'linear',
                    times: [0, 0.33, 0.66, 1],
                },
            },
            exiting: {
                backgroundColor: colorSequence[colorSequence.length - 1],
            },
        }),
        [colorSequence, phaseDuration]
    );

    return (
        <motion.div
            className="bokeh-particle"
            style={{
                position: 'absolute',
                left: `${particle.x}%`,
                top: `${particle.y}%`,
                width: particle.size,
                height: particle.size,
                borderRadius: '50%',
                filter: `blur(${particle.blur}px)`,
                willChange: phase !== 'idle' ? 'transform, opacity' : 'auto',
                pointerEvents: 'none',
            }}
            variants={variants}
            initial="idle"
            animate={phase}
        >
            {/* Inner color layer - handles color shift animation */}
            <motion.div
                style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '50%',
                }}
                variants={colorVariants}
                initial="idle"
                animate={phase}
            />
        </motion.div>
    );
});

// ===============================
//       PARTICLE GENERATION
// ===============================

/**
 * Generate a pool of bokeh particles.
 * Called once and reused across all ceremonies.
 * 
 * @param count - Number of particles to generate (default 25)
 * @param colorBias - Favor warm or cool colors (default neutral)
 */
export function generateBokehParticles(
    count: number = 30,
    colorBias: 'warm' | 'cool' | 'neutral' = 'neutral'
): BokehParticleData[] {
    const particles: BokehParticleData[] = [];

    // Color distribution based on bias
    const colorWeights: Record<BokehColor, number> =
        colorBias === 'warm'
            ? { violet: 0.35, blush: 0.35, cornflower: 0.15, turquoise: 0.15 }
            : colorBias === 'cool'
                ? { cornflower: 0.35, turquoise: 0.35, violet: 0.15, blush: 0.15 }
                : { violet: 0.25, cornflower: 0.25, turquoise: 0.25, blush: 0.25 };

    // Weighted random color selection
    function pickColor(): BokehColor {
        const rand = Math.random();
        let cumulative = 0;

        for(const [color, weight] of Object.entries(colorWeights)) {
            cumulative += weight;
            if(rand <= cumulative) {
                return color as BokehColor;
            }
        }

        // Fallback
        return 'violet';
    }

    for(let i = 0; i < count; i++) {
        // Full viewport coverage with overflow for edge-to-edge wash
        // Extend beyond 0-100 so blurred edges still cover screen edges
        const x = -20 + Math.random() * 140;    // -20% to 120%
        const y = -20 + Math.random() * 140     // -20% to 120%

        // Large particles for overlapping wash effect
        const sizeRand = Math.random();
        const size =
            sizeRand < 0.3
                ? 200 + Math.random() * 150         // Medium: 200-350 px (30%)
                : sizeRand < 0.7
                    ? 350 + Math.random() * 150     // Medium: 350-500px (35%)
                    : 500 + Math.random() * 200;    // Large: 500-700px (15%)

        // Heavy blur for dreamy wash
        const blur = 60 + (size / 700) * 100;    // 60-160px range
        
        // Stagger offset based on horizontal position (for left-to-right wave)
        const staggerOffset = Math.max(0, Math.min(1, (x + 20) / 140));

        particles.push({
            id: `bokeh-${i}-${Date.now()}`,
            x: Math.max(0, Math.min(100, x)),
            y,
            size,
            initialColor: pickColor(),
            blur,
            staggerOffset,
        });
    }

    return particles;
}

// ===============================
//        PARTICLE POOL HOOK
// ===============================

/**
 * Hook to get a stable pool of bokeh particles.
 * Particles are generated once and reused.
 */
export function useBokehParticles(
    count: number = 22,
    colorBias: 'warm' | 'cool' | 'neutral' = 'neutral'
): BokehParticleData[] {
    const [particles] = useState(() => generateBokehParticles(count, colorBias));
    return particles;
}

// ===============================
//        PARTICLE FIELD
// ===============================

interface ParticleFieldProps {
    particles: BokehParticleData[];
    phase: 'idle' | 'entering' | 'color-shift' | 'exiting';
    phaseDuration?: number;
    staggerDelay?: number;
    staggerDirection?: 'left-to-right' | 'right-to-left';
}

export function ParticleField({
    particles,
    phase,
    phaseDuration = 300,
    staggerDelay = 200,
    staggerDirection = 'left-to-right',
}: ParticleFieldProps) {
    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            pointerEvents: 'none',
            overflow: 'hidden',
        }}>
            {particles.map((particle) => (
                <BokehParticle
                    key={particle.id}
                    particle={particle}
                    phase={phase}
                    staggerDelay={staggerDelay}
                    staggerDirection={staggerDirection}
                    phaseDuration={phaseDuration}
                />
            ))}
        </div>
    );
}