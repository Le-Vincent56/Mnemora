import {
    useEffect,
    useCallback,
    useRef,
    type ReactNode,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EASING, TIMING, toSeconds } from '@/tokens';
import { useReducedMotion } from '@/hooks';
import { cn } from '@/utils';
import styles from './composed.module.css';

export interface ModalProps {
    /** Whether the modal is open */
    open: boolean;
    /** Called when the modal requests to close (Escape, backdrop click) */
    onClose: () => void;
    /** Modal content */
    children: ReactNode;
    /** Close on backdrop click (default: true) */
    closeOnBackdrop?: boolean;
    /** Max width of the modal card */
    maxWidth?: number;
    /** Additional CSS classes for the card */
    className?: string;
    /** Accessible label */
    'aria-label'?: string;
}

const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: toSeconds(TIMING.fast) } },
    exit: { opacity: 0, transition: { duration: toSeconds(TIMING.instant) } },
};

const cardVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 12 },
    visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: { duration: toSeconds(TIMING.gentle), ease: EASING.memory },
    },
    exit: {
        opacity: 0,
        scale: 0.98,
        y: 8,
        transition: { duration: toSeconds(TIMING.fast), ease: EASING.in },
    },
};

const reducedCardVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.01 } },
    exit: { opacity: 0, transition: { duration: 0.01 } },
};

/**
 * Accessible modal dialog with backdrop, memory-surfacing animation,
 * and Escape to close.
 *
 * @example
 * <Modal open={isOpen} onClose={() => setIsOpen(false)} aria-label="Create world">
 *   <Text variant="title">Create New World</Text>
 *   ...
 * </Modal>
 */
export function Modal({
    open,
    onClose,
    children,
    closeOnBackdrop = true,
    maxWidth = 440,
    className,
    'aria-label': ariaLabel,
}: ModalProps) {
    const reducedMotion = useReducedMotion();
    const cardRef = useRef<HTMLDivElement>(null);

    // Focus trap: constrain Tab/Shift+Tab within the modal card
    useEffect(() => {
        if (!open) return;
        const card = cardRef.current;
        if (!card) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key !== 'Tab') return;

            const focusable = card.querySelectorAll<HTMLElement>(
                'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
            );
            if (focusable.length === 0) return;

            const first = focusable[0];
            const last = focusable[focusable.length - 1];

            if (!first || !last) return;

            if (e.shiftKey) {
                if (document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                }
            } else {
                if (document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [open]);

    // Escape to close
    useEffect(() => {
        if (!open) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [open, onClose]);

    const handleBackdropClick = useCallback(() => {
        if (closeOnBackdrop) onClose();
    }, [closeOnBackdrop, onClose]);

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    className={styles.modalBackdrop}
                    variants={backdropVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    onClick={handleBackdropClick}
                >
                    <motion.div
                        ref={cardRef}
                        role="dialog"
                        aria-modal="true"
                        aria-label={ariaLabel}
                        className={cn(styles.modalCard, className)}
                        style={{ maxWidth }}
                        variants={reducedMotion ? reducedCardVariants : cardVariants}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {children}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
