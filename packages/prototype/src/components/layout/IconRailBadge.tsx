import { motion, AnimatePresence } from 'framer-motion';
import './IconRailBadge.css';

interface IconRailBadgeProps {
    count: number;
    variant?: 'prep' | 'session';
}

const badgeVariants = {
    initial: { scale: 0, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0, opacity: 0 },
};

export function IconRailBadge({ count, variant = 'session' }: IconRailBadgeProps) {
    const displayCount = count > 9 ? '9+' : count;

    return (
        <AnimatePresence mode="wait">
            {count > 0 && (
                <motion.span
                    key={count}
                    className={`icon-rail-badge icon-rail-badge--${variant}`}
                    variants={badgeVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={{
                        type: 'spring',
                        stiffness: 500,
                        damping: 25,
                    }}
                    aria-hidden="true"
                >
                    {displayCount}
                </motion.span>
            )}
        </AnimatePresence>
    );
}