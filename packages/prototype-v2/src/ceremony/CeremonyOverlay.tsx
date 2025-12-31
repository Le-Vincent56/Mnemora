import { createPortal } from 'react-dom';
import { useCeremony } from './CeremonyProvider';
import { InwardBreathCeremony } from './InwardBreathCeremony';
import { ReducedMotionCeremony } from './ReducedMotionCeremony';
import { CeremonyType } from './types';
import { useState, useEffect } from 'react';

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
 */
export function CeremonyOverlay() {
    const { state, reducedMotion } = useCeremony();
    const buttonPosition = useModeSwitchButtonPosition();

    // Don't render for reduced motion (handled elsewhere)
    if (reducedMotion) {
        return null;
    }

    // Only render when ceremony is running
    if (state.status !== 'running') {
        return null;
    }

    // Render the appropriate ceremony based on type
    const renderCeremony = () => {
        switch (state.type) {
            case CeremonyType.PREP_TO_SESSION:
                if(reducedMotion) {
                    return (
                        <ReducedMotionCeremony
                            isActive={true}
                            originX={buttonPosition.x}
                            originY={buttonPosition.y}
                        />
                    );
                }
                
                return (
                    <InwardBreathCeremony
                        isActive={true}
                        originX={buttonPosition.x}
                        originY={buttonPosition.y}
                    />
                );

            // Other ceremony types can be added here
            // For now, they use the existing timeline-based approach
            default:
                return null;
        }
    };

    return createPortal(
        <div style={overlayStyles}>
            {renderCeremony()}
        </div>,
        document.body
    );
}

export default CeremonyOverlay;