import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import './IconRailItem.css';

interface IconRailItemProps {
    icon: ReactNode;
    label: string;
    shortcut?: string;
    isActive?: boolean;
    showGlow?: boolean;
    badge?: ReactNode;
    disabled?: boolean;
    onClick?: () => void;
}

export function IconRailItem({
    icon,
    label,
    shortcut,
    isActive = false,
    showGlow = false,
    badge,
    disabled = false,
    onClick,
}: IconRailItemProps) {
    const classNames = [
        'icon-rail-item',
        isActive && 'icon-rail-item--active',
        disabled && 'icon-rail-item--disabled',
    ].filter(Boolean).join(' ');

    return (
        <motion.button
            className={classNames}
            onClick={disabled ? undefined : onClick}
            whileHover={disabled ? undefined : { scale: 1.05 }}
            whileTap={disabled ? undefined : { scale: 0.95 }}
            disabled={disabled}
            title={shortcut ? `${label} (${shortcut})` : label}
            aria-label={shortcut ? `${label}, keyboard shortcut ${shortcut}` : label}
            aria-pressed={isActive}
        >
            {/* Active indicator bar - uses layoutId for smooth transition */}
            {isActive && (
                <motion.div
                    className="icon-rail-item__indicator"
                    layoutId="activeIndicator"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
            )}

            {/* Glow effect - via pseudo-element opacity */}
            <span
                className={`icon-rail-item__glow ${showGlow ? 'icon-rail-item__glow--visible' : ''}`}
                aria-hidden="true"
            />

            {/* Icon */}
            <span className="icon-rail-item__icon">{icon}</span>

            {/* Badge (optional) */}
            {badge}
        </motion.button>
    );
}