import { motion, AnimatePresence, Variants } from 'framer-motion';
import { EASING } from '@/tokens';

// ===============================
//          CONFIGURATION
// ===============================

const VIGNETTE_CONFIG = {
    /** Maximum darkness at edges (0-1) */
    peakOpacity: 0.35,
    /** Time to reach peak darkness (ms) */
    darkenDuration: 250,
    /** Time to release back to transparent (ms) */
    releaseDuration: 300,
    /** Gradient stops for smooth falloff */
    gradientStops: {
        transparent: 45,    // Center stays clear until 45%
        fade: 65,           // Gradual fade from 45-65%
        dark: 100,          // Full darkness at edges
    },
} as const;

// ===============================
//              TYPES
// ===============================

export type VignettePhase = 'idle' | 'gathering' | 'peak' | 'releasing';

interface VignetteProps {
    /** Current phase of the vignette animation */
    phase: VignettePhase;
    /** Optional focal point offset (viewport percentages) */
    focalX?: number;
    focalY?: number;
}

// ===============================
//             VARIANTS
// ===============================

const vignetteVariants: Variants = {
    idle: {
        opacity: 0,
    },
    gathering: {
        opacity: VIGNETTE_CONFIG.peakOpacity,
        transition: {
            duration: VIGNETTE_CONFIG.darkenDuration / 1000,
            ease: EASING.inQuad,
        },
    },
    peak: {
        opacity: VIGNETTE_CONFIG.peakOpacity,
        transition: {
            duration: 0.1,
            ease: EASING.linear,
        }
    },
    releasing: {
        opacity: 0,
        transition: {
            duration: VIGNETTE_CONFIG.releaseDuration / 1000,
            ease: EASING.outQuart,
        },
    },
};

// ===============================
//           COMPONENT
// ===============================

/**
 * Cinematic vignette overlay that darkens screen edges
 * during the ceremony's gathering phase.
 * 
 * Creates focus effect by dimming peripheral vision,
 * then releases as the burst expands outward.
 */
export function Vignette({
    phase,
    focalX = 50,
    focalY = 50,
}: VignetteProps) {
    // Only render when not idle
    const isVisible = phase !== 'idle';

    // Build gradient with configurable focal point
    const gradient = `radial-gradient(
        ellipse 80% 70% at ${focalX}% ${focalY}%,
        transparent ${VIGNETTE_CONFIG.gradientStops.transparent}%,
        rgba(0, 0, 0, 0.4) ${VIGNETTE_CONFIG.gradientStops.fade}%,
        rgba(0, 0, 0, 0.7) ${VIGNETTE_CONFIG.gradientStops.dark}%
    )`;

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    key="ceremony-vignette"
                    variants={vignetteVariants}
                    initial="idle"
                    animate={phase}
                    exit="releasing"
                    style={{
                        position: 'absolute',
                        inset: 0,
                        background: gradient,
                        pointerEvents: 'none',
                        willChange: 'opacity',
                    }}
                    aria-hidden="true"
                />
            )}
        </AnimatePresence>
    );
}

// ===============================
//  ALTERNATE: SHIFTED FOCAL POINT
// ===============================

/** 
 * Vignette variant with focal point shifted toward the IconRail.
 * Use this when the ceremony originates from the mode-switch button.
 */
export function VignetteForIconRail({ phase }: { phase: VignettePhase }) {
    return (
        <Vignette
            phase={phase}
            focalX={15}
            focalY={75}
        />
    )
}

export default Vignette;