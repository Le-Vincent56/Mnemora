import { type LucideIcon } from 'lucide-react';
import { motion, useAnimation } from 'framer-motion';
import { useCallback, useRef } from 'react';
import { cn } from '@/utils';
import { EASING } from '@/tokens';
import { useReducedMotion } from '@/hooks';
import styles from './layout.module.css';

/**
 * Props for IconRailItem
 */
export interface IconRailItemProps {
    /** Lucide icon component to render */
    icon: LucideIcon;
    /** Label for tooltip and accessibility */
    label: string;
    /** Whether this item is currently active/selected */
    isActive?: boolean;
    /** Click handler */
    onClick?: () => void;
    /** Whether this is the mode switch button (Start/End Session) */
    isModeSwitch?: boolean;
    /** Whether a ceremony is currently active */
    ceremonyActive?: boolean;
    /** Additional CSS classes */
    className?: string;
    /** Whether the button is disabled */
    disabled?: boolean;
}

/**
 * Individual navigation item for the IconRail.
 * 
 * Renders an icon button with tooltip on hover/focus.
 * Supports active state styling and special mode-switch variant.
 * 
 * @example
 * ```tsx
 * <IconRailItem
 *    icon={Globe}
 *    label="World"
 *    isActive={currentView === 'world'}
 *    onClick={() => setCurrentView('world')}
 * />
 * ```
 */
export function IconRailItem({
    icon: Icon,
    label,
    isActive = false,
    onClick,
    isModeSwitch = false,
    ceremonyActive = false,
    className,
    disabled = false,
}: IconRailItemProps) {
    const controls = useAnimation();
    const glowControls = useAnimation();
    const reducedMotion = useReducedMotion();
    const buttonRef = useRef<HTMLButtonElement>(null);
    const isDisabled = disabled || (isModeSwitch && ceremonyActive);

    // Enhanced press feedback for mode-switch button
    const handlePointerDown = useCallback(async () => {
        if (isDisabled || !isModeSwitch || reducedMotion) return;

        // Press phase: Immediate acknowledgement
        await Promise.all([
            controls.start({
                scale: 0.95,
                transition: {
                    duration: 0.05,
                    ease: EASING.outQuart,
                },
            }),
            glowControls.start({
                opacity: 0.6,
                scale: 1.15,
                transition: {
                    duration: 0.08,
                    ease: EASING.outQuart,
                },
            }),
        ]);
    }, [controls, glowControls, isDisabled, isModeSwitch, reducedMotion])

    const handlePointerUp = useCallback(async () => {
        if (isDisabled || !isModeSwitch || reducedMotion) return;

        // Acknowledge phase: Release and signal ceremony start
        await Promise.all([
            controls.start({
                scale: 1.0,
                transition: {
                    duration: 0.08,
                    ease: EASING.outQuart,
                },
            }),
            glowControls.start({
                opacity: 0.8,
                scale: 1.3,
                transition: {
                    duration: 0.1,
                    ease: EASING.outQuart,
                },
            }),
        ]);

        // Fire the click handler after visual acknowledgement
        onClick?.();
    }, [controls, glowControls, isDisabled, isModeSwitch, reducedMotion, onClick]);

    const handlePointerCancel = useCallback(() => {
        if (!isModeSwitch || reducedMotion) return;

        // Reset if pointer leaves or is cancelled
        controls.start({ scale: 1.0, transition: { duration: 0.1 } });
        glowControls.start({ opacity: 0, scale: 1, transition: { duration: 0.15 } });
    }, [controls, glowControls, isModeSwitch, reducedMotion]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (!isModeSwitch || isDisabled || reducedMotion) return;

        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();

            // Simulate press feedback
            controls.start({
                scale: 0.95,
                transition: { duration: 0.05, ease: EASING.outQuart },
            });
            glowControls.start({
                opacity: 0.6,
                scale: 1.15,
                transition: { duration: 0.08, ease: EASING.outQuart },
            });

            // Release and trigger after brief delay
            setTimeout(() => {
                controls.start({
                    scale: 1.0,
                    transition: { duration: 0.08, ease: EASING.outQuart },
                });
                glowControls.start({
                    opacity: 0.8,
                    scale: 1.3,
                    transition: { duration: 0.1, ease: EASING.outQuart },
                });
                onClick?.();
            }, 50);
        }
    }, [isModeSwitch, isDisabled, reducedMotion, controls, glowControls, onClick]);

    // For non-mode-switch buttons, use simple click
    const handleClick = useCallback(() => {
        if (isModeSwitch) return;

        onClick?.();
    }, [isModeSwitch, onClick]);

    return (
        <motion.button
            ref={buttonRef}
            type="button"
            className={cn(
                styles.railItem,
                isActive && styles.railItemActive,
                isModeSwitch && styles.modeSwitch,
                isModeSwitch && styles.modeSwitchEnhanced,
                className
            )}
            animate={controls}
            onClick={handleClick}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerCancel}
            onPointerCancel={handlePointerCancel}
            onKeyDown={handleKeyDown}
            disabled={isDisabled}
            aria-label={label}
            aria-current={isActive ? 'page' : undefined}
            data-ceremony-trigger={isModeSwitch ? 'true' : undefined}
            data-ceremony-active={isModeSwitch && ceremonyActive ? 'true' : undefined}
            whileHover={!isModeSwitch ? { scale: 1.02 } : undefined}
            whileTap={!isModeSwitch ? { scale: 0.96 } : undefined}
        >
            {/* Ceremony glow effect - only for mode-switch button */}
            {isModeSwitch && (
                <motion.span
                    className={styles.ceremonyGlow}
                    initial={{ opacity: 0, scale: 1 }}
                    animate={glowControls}
                    aria-hidden="true"
                />
            )}

            <Icon className={styles.railItemIcon} aria-hidden="true" />

            {/* Tooltip - decorative, hidden frmo screen readers */}
            <span className={styles.tooltip} role="presentation" aria-hidden="true">
                {label}
            </span>
        </motion.button>
    );
}

export default IconRailItem;