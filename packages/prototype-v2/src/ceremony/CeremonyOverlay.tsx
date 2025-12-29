import { useMemo } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, type Variants } from 'framer-motion';

import { EASING, toSeconds, TIMING } from '@/tokens';

import { useCeremony } from './CeremonyProvider';
import { BokehParticle, useBokehParticles } from './BokehParticle';
import type { CeremonyPhase } from './types';
import { BOKEH_COLORS } from './types';

// ===============================
//          PHASE MAPPING
// ===============================

type ParticlePhase = 'idle' | 'entering' | 'color-shift' | 'exiting';

function getParticlePhase(ceremonyPhase: CeremonyPhase): ParticlePhase {
    switch (ceremonyPhase) {
        case 'bokeh-in':
            return 'entering';
        case 'color-shift':
            return 'color-shift';
        case 'bokeh-out':
            return 'exiting';
        default:
            return 'idle';
    }
}

function getPhaseDuration(ceremonyPhase: CeremonyPhase): number {
    switch (ceremonyPhase) {
        case 'bokeh-in':
            return 300;
        case 'color-shift':
            return 400;
        case 'bokeh-out':
            return 250;
        default:
            return 300;
    }
}

function getStaggerDelay(ceremonyPhase: CeremonyPhase): number {
    switch (ceremonyPhase) {
        case 'bokeh-in':
            return 300; // Particles stagger over 200ms
        case 'bokeh-out':
            return 200;
        default:
            return 0;
    }
}

function getStaggerDirection(
    ceremonyPhase: CeremonyPhase
): 'left-to-right' | 'right-to-left' {
    return ceremonyPhase === 'bokeh-out' ? 'right-to-left' : 'left-to-right';
}

// ===============================
//              STYLES
// ===============================

const overlayStyles: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    zIndex: 9999,
    pointerEvents: 'none',
    overflow: 'hidden',
};

// ===============================
//         GRADIENT WASH
// ===============================

/**
 * Creates a sweeping color wash effect from left to right.
 * Uses multiple gradient layers with staggered timing for depth.
 */
function DirectionalWash({ isActive }: { isActive: boolean | undefined }) {
    // Base gradient: wide linear gradient containing all ceremony coloers
    // Positioned to sweep from off-screen left to off-screen right
    const baseGradient = `linear-gradient(
        90deg,
        transparent 0%,
        ${BOKEH_COLORS.violet} 15%,
        ${BOKEH_COLORS.cornflower} 35%,
        ${BOKEH_COLORS.turquoise} 55%,
        ${BOKEH_COLORS.blush} 75%,
        transparent 100%
    )`;

    // Softer overlay gradient for dreamy quality
    const softGradient = `linear-gradient(
        90deg,
        transparent 0%,
        ${BOKEH_COLORS.cornflower.replace('0.4', '0.25')} 25%,
        ${BOKEH_COLORS.turquoise.replace('0.4', '0.3')} 50%,
        ${BOKEH_COLORS.blush.replace('0.3', '0.2')} 75%,
        transparent 100%
    )`;

    // Accent gradient with vertical variation
    const accentGradient = `radial-gradient(
        ellipse 80% 120% at 50% 30%,
        ${BOKEH_COLORS.violet.replace('0.4', '0.35')} 0%,
        transparent 60%
    ), radial-gradient (
        ellipse 60% 80% at 50% 70%,
        ${BOKEH_COLORS.blush.replace('0.3', '0.25')} 0%,
        transparent 50%
    )`;

    // Animation: sweep from -100% to +100% (panel is 300vw wide)
    const sweepVariants: Variants = {
        initial: {
            x: '100%',
            opacity: 0,
        },
        animate: {
            x: '100%',
            opacity: [0, 1, 1, 1, 0],
            transition: {
                x: {
                    duration: 1,
                    ease: [0.23, 1, 0.32, 1],
                },
                opacity: {
                    duration: 1,
                    times: [0, 0.1, 0.5, 0.9, 1],
                    ease: 'easeInOut',
                },
            },
        },
        exit: {
            opacity: 0,
            transition: { duration: 0.15 },
        },
    };

    // Staggered layer variants (slight delay for depth)
    const layerVariants = (delay: number): Variants => ({
        initial: {
            x: '-100%',
            opacity: 0,
        },
        animate: {
            x: '100%',
            opacity: [0, 0.8, 0.8, 0.8, 0],
            transition: {
                x: {
                    duration: 1,
                    ease: [0.23, 1, 0.32, 1],
                    delay,
                },
                opacity: {
                    duration: 1,
                    times: [0, 0.15, 0.5, 0.85, 1],
                    ease: 'easeInOut',
                    delay,
                },
            },
        },
        exit: {
            opacity: 0,
            transition: { duration: 0.1 },
        },
    });

    // Shared layer styles
    const layerStyle: React.CSSProperties = {
        position: 'absolute',
        top: '-20%',
        left: 0,
        width: '300vw',
        height: '140%',
        willChange: 'transform, opacity',
    };

    return (
        <AnimatePresence>
            {isActive && (
                <>
                    {/* Layer 1: Main sweep (primary colors) */}
                    <motion.div
                        key="wash-main"
                        style={{
                            ...layerStyle,
                            background: baseGradient,
                            filter: 'blur(40px)',
                        }}
                        variants={sweepVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                    />

                    {/* Layer 2: Soft overlay (slightly delayed for depth) */}
                    <motion.div
                        key="wash-soft"
                        style={{
                            ...layerStyle,
                            background: softGradient,
                            filter: 'blur(60px)',
                        }}
                        variants={layerVariants(0.05)}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                    />

                    {/* Layer 3: Vertical accent shapes (more delay) */}
                    <motion.div
                        key="wash-accent"
                        style={{
                            ...layerStyle,
                            background: accentGradient,
                            filter: 'blur(30px)',
                            mixBlendMode: 'screen',
                        }}
                        variants={layerVariants(0.08)}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                    />
                </>
            )}
        </AnimatePresence>
    );
}

// ===============================
//         MAIN COMPONENT
// ===============================

export function CeremonyOverlay() {
    const { state, timeline, reducedMotion } = useCeremony();

    // Smaller accent particles (fewer, for depth)
    const particles = useBokehParticles(
        12,
        timeline?.phases.find((p) => p.particleConfig)?.particleConfig?.colorBias ?? 'neutral'
    );

    const shouldShowOverlay =
        !reducedMotion &&
        timeline?.hasBokeh &&
        state.status === 'running' &&
        ['bokeh-in', 'color-shift', 'bokeh-out'].includes(state.phase);

    const particlePhase = getParticlePhase(state.phase);
    const phaseDuration = getPhaseDuration(state.phase);
    const staggerDelay = getStaggerDelay(state.phase);
    const staggerDirection = getStaggerDirection(state.phase);

    if (!timeline?.hasBokeh || reducedMotion) {
        return null;
    }

    return createPortal(
        <div style={overlayStyles}>
            <DirectionalWash isActive={shouldShowOverlay}/>

            {/* Accent particles (follow the sweep) */}
            <AnimatePresence>
                {shouldShowOverlay && (
                    <motion.div
                        key="particles-container"
                        initial={{ opacity: 0}}
                        animate={{ opacity: 1}}
                        exit={{ opacity: 0}}
                        transition={{ duration: 0.2 }}
                        style={{ position: 'absolute', inset: 0 }}
                    >
                        {particles.map((particle) => (
                            <BokehParticle
                                key={particle.id}
                                particle={particle}
                                phase={particlePhase}
                                staggerDelay={staggerDelay}
                                staggerDirection={staggerDirection}
                                phaseDuration={phaseDuration}
                            />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>,
        document.body
    );
}

// ===============================
//    STANDALONE PARTICLE FIELD
// ===============================

interface ParticleFieldProps {
    particles: ReturnType<typeof useBokehParticles>;
    phase: ParticlePhase;
    phaseDuration?: number;
    staggerDelay?: number;
    staggerDirection?: 'left-to-right' | 'right-to-left'
}

export function ParticleField({
    particles,
    phase,
    phaseDuration = 300,
    staggerDelay = 300,
    staggerDirection = 'left-to-right',
}: ParticleFieldProps) {
    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                pointerEvents: 'none',
                overflow: 'hidden',
            }}
        >
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