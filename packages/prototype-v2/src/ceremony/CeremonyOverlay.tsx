import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { useCeremony } from './CeremonyProvider';
import { InwardBreathCeremony } from './InwardBreathCeremony';
import { ReducedMotionCeremony } from './ReducedMotionCeremony';
import { CeremonyType } from './types';
import { useState, useEffect } from 'react';
import { EASING } from '@/tokens';

// ===============================
//       BUTTON POSITION HOOK
// ===============================

interface ButtonPosition {
    x: number;
    y: number;
}

/**
 * Gets the position of the mode switch button for ceremony origin.
 * Falls back to sensible default if button not found.
 */
function useModeSwitchButtonPosition(): ButtonPosition {
    const [position, setPosition] = useState<ButtonPosition>(() => ({
        x: 34,
        y: typeof window !== 'undefined' ? window.innerHeight - 80 : 600,
    }));

    useEffect(() => {
        // Find the mode switch button in the DOM
        const updatePosition = () => {
            const button = document.querySelector('[data-ceremony-trigger="true"]');
            if (button) {
                const rect = button.getBoundingClientRect();
                setPosition({
                    x: rect.left + rect.width / 2,
                    y: rect.top + rect.height / 2,
                });
            } else {
                // Fallback: IconRail is 68px wide, button near bottom
                setPosition({
                    x: 34,
                    y: window.innerHeight - 80,
                });
            }
        };

        updatePosition();
        window.addEventListener('resize', updatePosition);
        return () => window.removeEventListener('resize', updatePosition);
    }, []);

    return position;
}

// ===============================
//       TRANSITION SCRIM
// ===============================

/**
 * Full-screen scrim that fades to opaque around the mode-switch moment,
 * masking the CSS token swap so no flash is visible.
 *
 * Timeline (Prep->Session, 1000ms total):
 *   350-500ms: scrim fades 0 -> 1 (covers viewport before token swap at 500ms)
 *   500-650ms: scrim fades 1 -> 0 (reveals new tokens already applied)
 *
 * Timeline (Session->Prep, 350ms total):
 *   0-100ms:   scrim fades 0 -> 1 (covers viewport before token swap at 100ms)
 *   100-250ms: scrim fades 1 -> 0 (reveals new tokens)
 */
interface TransitionScrimProps {
    ceremonyType: CeremonyType;
}

function TransitionScrim({ ceremonyType }: TransitionScrimProps) {
    const isPrepToSession = ceremonyType === CeremonyType.PREP_TO_SESSION;

    // Prep→Session (1000ms ceremony, mode switch at 500ms):
    //   Delay 300ms so GatheringThreads (0-450ms) play unobstructed.
    //   Duration 400ms with wide opaque hold [0.30 – 0.70]:
    //     opacity 1 at  300 + 0.30*400 = 420ms
    //     opacity 1 until 300 + 0.70*400 = 580ms  (160ms opaque window)
    //     opacity 0 at  300 + 400       = 700ms
    //   Mode switch at 500ms + React render + rAF ≈ 520ms → well within hold.
    //
    // Session→Prep (350ms ceremony, mode switch at 100ms):
    //   No delay. Duration 250ms, hold [0.25 – 0.60]:
    //     opacity 1 at  62ms
    //     opacity 1 until 150ms  (88ms opaque window)
    //     opacity 0 at  250ms
    //   Mode switch at 100ms + rAF ≈ 116ms → within hold.
    const duration = isPrepToSession ? 0.4 : 0.25;
    const delay = isPrepToSession ? 0.3 : 0;

    return (
        <motion.div
            key="transition-scrim"
            style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: '#09090B',
                zIndex: 9998, // Below ceremony overlay (9999), above everything else
                pointerEvents: 'none',
            }}
            initial={{ opacity: 0 }}
            animate={{
                opacity: [0, 1, 1, 0],
            }}
            transition={{
                duration,
                delay,
                times: isPrepToSession
                    ? [0, 0.30, 0.70, 1]   // wide 160ms opaque window around 500ms
                    : [0, 0.25, 0.60, 1],   // 88ms opaque window around 100ms
                ease: EASING.inOut,
            }}
        />
    );
}

// ===============================
//          MAIN OVERLAY
// ===============================

const overlayStyles: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    zIndex: 9999,
    pointerEvents: 'none',
    overflow: 'hidden',
};

/**
 * Ceremony overlay - renders the appropriate ceremony based on state.
 * From PREP_TO_SESSION, renders the "Inward Breath" ceremony.
 * For other ceremonies, falls back to simpler transitions.
 *
 * ALWAYS renders a TransitionScrim during mode-switch ceremonies
 * to mask the CSS token swap.
 */
export function CeremonyOverlay() {
    const { state, reducedMotion } = useCeremony();
    const buttonPosition = useModeSwitchButtonPosition();

    // Only render when ceremony is running
    if (state.status !== 'running') {
        return null;
    }

    // Determine if this is a mode-switch ceremony that needs a scrim
    const needsScrim =
        state.type === CeremonyType.PREP_TO_SESSION ||
        state.type === CeremonyType.SESSION_TO_PREP ||
        state.type === CeremonyType.KEYBOARD_BYPASS;

    // Reduced motion: scrim + simple glow only
    if (reducedMotion) {
        return createPortal(
            <>
                {needsScrim && <TransitionScrim ceremonyType={state.type!} />}
                <div style={overlayStyles}>
                    <ReducedMotionCeremony
                        isActive={true}
                        originX={buttonPosition.x}
                        originY={buttonPosition.y}
                    />
                </div>
            </>,
            document.body
        );
    }

    // Render the appropriate ceremony based on type
    const renderCeremony = () => {
        switch (state.type) {
            case CeremonyType.PREP_TO_SESSION:
                return (
                    <InwardBreathCeremony
                        isActive={true}
                        originX={buttonPosition.x}
                        originY={buttonPosition.y}
                    />
                );

            case CeremonyType.SESSION_TO_PREP:
            case CeremonyType.KEYBOARD_BYPASS:
                // These ceremonies have no bespoke overlay, but
                // the scrim handles the visual transition.
                return null;

            default:
                return null;
        }
    };

    return createPortal(
        <>
            {needsScrim && <TransitionScrim ceremonyType={state.type!} />}
            <div style={overlayStyles}>
                {renderCeremony()}
            </div>
        </>,
        document.body
    );
}

export default CeremonyOverlay;
