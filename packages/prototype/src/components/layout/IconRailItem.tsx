import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import './IconRailItem.css';

interface IconRailItemProps {
    icon: ReactNode;
    label: string;
    shortcut?: string;
    isActive?: boolean;
    onClick?: () => void;
}

export function IconRailItem({
    icon,
    label,
    shortcut,
    isActive = false,
    onClick
}: IconRailItemProps) {
    return (
        <motion.button
            className={`icon-rail-item ${isActive ? 'icon-rail-item--active' : ''}`}
            onClick={onClick}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title={shortcut ? `${label} (${shortcut})` : label}
        >
            {isActive && (
                <motion.div
                    className="icon-rail-item__indicator"
                    layoutId="activeIndicator"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
            )}
            {icon}
        </motion.button>
    );
}