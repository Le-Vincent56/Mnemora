import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useCeremony } from './CeremonyProvider';

// ═══════════════════════════════════════════════════════════════════
// VIVID DREAM PALETTE (Much stronger colors)
// ═══════════════════════════════════════════════════════════════════

const DREAM_COLORS = {
    violet: 'rgba(147, 112, 219, 0.92)',
    violetDeep: 'rgba(127, 90, 199, 0.88)',
    cornflower: 'rgba(100, 149, 237, 0.9)',
    turquoise: 'rgba(72, 209, 204, 0.85)',
    blush: 'rgba(255, 182, 193, 0.82)',
    blushWarm: 'rgba(255, 160, 180, 0.78)',
};

// ═══════════════════════════════════════════════════════════════════
// ORB CONFIGURATION
// Larger orbs, more coverage, slower timing
// ═══════════════════════════════════════════════════════════════════

interface OrbConfig {
    id: string;
    x: string;
    y: string;
    size: string;
    color: string;
    delay: number;
    duration: number;
    drift: { x: number; y: number };
    blur: number;
    gradientStop: number; // Where gradient fades to transparent (higher = more coverage)
}

const MEMORY_ORBS: OrbConfig[] = [
    // === FOUNDATION LAYER (massive, diffuse, fills the space) ===
    {
        id: 'foundation-1',
        x: '50%',
        y: '50%',
        size: '250vh',
        color: DREAM_COLORS.violetDeep,
        delay: 0,
        duration: 1.4,
        drift: { x: 0, y: -20 },
        blur: 100,
        gradientStop: 85,
    },
    {
        id: 'foundation-2',
        x: '0%',
        y: '100%',
        size: '200vh',
        color: DREAM_COLORS.cornflower,
        delay: 0.05,
        duration: 1.35,
        drift: { x: 20, y: -30 },
        blur: 90,
        gradientStop: 80,
    },
    {
        id: 'foundation-3',
        x: '100%',
        y: '0%',
        size: '200vh',
        color: DREAM_COLORS.blush,
        delay: 0.08,
        duration: 1.3,
        drift: { x: -20, y: 25 },
        blur: 95,
        gradientStop: 80,
    },

    // === DEEP LAYER (large, set the mood) ===
    {
        id: 'deep-1',
        x: '25%',
        y: '75%',
        size: '160vh',
        color: DREAM_COLORS.violet,
        delay: 0.1,
        duration: 1.25,
        drift: { x: 10, y: -40 },
        blur: 80,
        gradientStop: 75,
    },
    {
        id: 'deep-2',
        x: '80%',
        y: '35%',
        size: '150vh',
        color: DREAM_COLORS.turquoise,
        delay: 0.12,
        duration: 1.2,
        drift: { x: -15, y: -25 },
        blur: 85,
        gradientStop: 75,
    },

    // === MID LAYER (build visual richness) ===
    {
        id: 'mid-1',
        x: '50%',
        y: '45%',
        size: '120vh',
        color: DREAM_COLORS.violet,
        delay: 0.15,
        duration: 1.15,
        drift: { x: 5, y: -50 },
        blur: 70,
        gradientStop: 70,
    },
    {
        id: 'mid-2',
        x: '15%',
        y: '20%',
        size: '110vh',
        color: DREAM_COLORS.cornflower,
        delay: 0.18,
        duration: 1.1,
        drift: { x: 20, y: -35 },
        blur: 65,
        gradientStop: 70,
    },
    {
        id: 'mid-3',
        x: '85%',
        y: '80%',
        size: '130vh',
        color: DREAM_COLORS.blushWarm,
        delay: 0.2,
        duration: 1.12,
        drift: { x: -12, y: -45 },
        blur: 70,
        gradientStop: 72,
    },

    // === ACCENT LAYER (add depth and highlights) ===
    {
        id: 'accent-1',
        x: '35%',
        y: '30%',
        size: '80vh',
        color: DREAM_COLORS.blush,
        delay: 0.25,
        duration: 1.0,
        drift: { x: 8, y: -60 },
        blur: 50,
        gradientStop: 65,
    },
    {
        id: 'accent-2',
        x: '70%',
        y: '65%',
        size: '90vh',
        color: DREAM_COLORS.turquoise,
        delay: 0.22,
        duration: 1.05,
        drift: { x: -10, y: -55 },
        blur: 55,
        gradientStop: 68,
    },
    {
        id: 'accent-3',
        x: '55%',
        y: '15%',
        size: '70vh',
        color: DREAM_COLORS.violet,
        delay: 0.28,
        duration: 0.95,
        drift: { x: 0, y: -40 },
        blur: 45,
        gradientStop: 65,
    },
    {
        id: 'accent-4',
        x: '20%',
        y: '55%',
        size: '75vh',
        color: DREAM_COLORS.cornflower,
        delay: 0.3,
        duration: 0.98,
        drift: { x: 15, y: -45 },
        blur: 48,
        gradientStop: 66,
    },
];

// ═══════════════════════════════════════════════════════════════════
// MEMORY ORB COMPONENT
// ═══════════════════════════════════════════════════════════════════

function MemoryOrb({ config }: { config: OrbConfig }) {
    return (
        <motion.div
            style={{
                position: 'absolute',
                left: config.x,
                top: config.y,
                width: config.size,
                height: config.size,
                marginLeft: `calc(-${config.size} / 2)`,
                marginTop: `calc(-${config.size} / 2)`,
                borderRadius: '50%',
                background: `radial-gradient(circle at center, ${config.color} 0%, ${config.color.replace(/[\d.]+\)$/, '0.4)')} 50%, transparent ${config.gradientStop}%)`,
                filter: `blur(${config.blur}px)`,
                willChange: 'transform, opacity',
            }}
            initial={{
                scale: 0.2,
                opacity: 0,
                x: 0,
                y: 0,
            }}
            animate={{
                scale: [0.2, 0.8, 1.05, 1],
                opacity: [0, 0.7, 1, 1, 1, 0.9, 0],
                x: [0, config.drift.x * 0.3, config.drift.x * 0.7, config.drift.x],
                y: [0, config.drift.y * 0.4, config.drift.y * 0.75, config.drift.y],
            }}
            transition={{
                duration: config.duration,
                delay: config.delay,
                ease: [0.23, 1, 0.32, 1],
                opacity: {
                    duration: config.duration,
                    delay: config.delay,
                    times: [0, 0.15, 0.35, 0.5, 0.7, 0.88, 1], // Longer hold at peak
                },
                scale: {
                    duration: config.duration,
                    delay: config.delay,
                    times: [0, 0.3, 0.7, 1],
                },
            }}
        />
    );
}

// ═══════════════════════════════════════════════════════════════════
// ETHEREAL VEIL (stronger, fuller coverage)
// ═══════════════════════════════════════════════════════════════════

function EtherealVeil() {
    return (
        <motion.div
            style={{
                position: 'absolute',
                inset: '-50%',
                width: '200%',
                height: '200%',
                background: `
            radial-gradient(ellipse 100% 80% at 50% 120%, ${DREAM_COLORS.violet} 0%, transparent 60%),
            radial-gradient(ellipse 80% 60% at 20% -20%, ${DREAM_COLORS.cornflower} 0%, transparent 50%),
            radial-gradient(ellipse 70% 70% at 100% 50%, ${DREAM_COLORS.blush} 0%, transparent 55%),
            radial-gradient(ellipse 90% 50% at 0% 50%, ${DREAM_COLORS.turquoise} 0%, transparent 45%)
          `,
                filter: 'blur(60px)',
                opacity: 0,
            }}
            animate={{
                opacity: [0, 0.5, 0.7, 0.7, 0.6, 0.4, 0],
            }}
            transition={{
                duration: 1.4,
                times: [0, 0.1, 0.3, 0.5, 0.7, 0.9, 1],
                ease: 'easeInOut',
            }}
        />
    );
}

// ═══════════════════════════════════════════════════════════════════
// SOFT PULSE (at the crossing moment)
// ═══════════════════════════════════════════════════════════════════

function SoftPulse() {
    return (
        <motion.div
            style={{
                position: 'absolute',
                inset: '-25%',
                width: '150%',
                height: '150%',
                background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.05) 40%, transparent 70%)',
            }}
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{
                scale: [0.6, 1, 1.3],
                opacity: [0, 0.8, 0],
            }}
            transition={{
                duration: 0.8,
                delay: 0.4,
                ease: 'easeOut',
            }}
        />
    );
}

// ═══════════════════════════════════════════════════════════════════
// MEMORY SURFACING CEREMONY
// ═══════════════════════════════════════════════════════════════════

function MemorySurfacing({ isActive }: { isActive: boolean | undefined }) {
    return (
        <AnimatePresence>
            {isActive && (
                <motion.div
                    key="memory-surfacing"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: 0.3 } }}
                    style={{
                        position: 'absolute',
                        inset: 0,
                        overflow: 'hidden',
                    }}
                >
                    {/* Base veil for full coverage */}
                    <EtherealVeil />

                    {/* Memory orbs blooming */}
                    {MEMORY_ORBS.map((orb) => (
                        <MemoryOrb key={orb.id} config={orb} />
                    ))}

                    {/* Soft pulse at peak */}
                    <SoftPulse />
                </motion.div>
            )}
        </AnimatePresence>
    );
}

// ═══════════════════════════════════════════════════════════════════
// MAIN OVERLAY
// ═══════════════════════════════════════════════════════════════════

const overlayStyles: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    zIndex: 9999,
    pointerEvents: 'none',
    overflow: 'hidden',
};

export function CeremonyOverlay() {
    const { state, timeline, reducedMotion } = useCeremony();

    const shouldShowOverlay =
        !reducedMotion &&
        timeline?.hasBokeh &&
        state.status === 'running' &&
        ['bokeh-in', 'color-shift', 'bokeh-out'].includes(state.phase);

    if (!timeline?.hasBokeh || reducedMotion) {
        return null;
    }

    return createPortal(
        <div style={overlayStyles}>
            <MemorySurfacing isActive={shouldShowOverlay} />
        </div>,
        document.body
    );
}