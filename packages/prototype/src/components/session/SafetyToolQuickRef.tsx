import { useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, X } from 'lucide-react';
import './SafetyToolQuickRef.css';

export interface SafetyTool {
    id: string;
    name: string;
    description: string;
    details?: string; // e.g., Lines/Veils items, custom notes
}

export interface SafetyToolQuickRefProps {
    isOpen: boolean;
    onClose: () => void;
    tools: SafetyTool[];
    returnFocusRef?: React.RefObject<HTMLElement>;
}

const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
};

const modalVariants = {
    hidden: {
        opacity: 0,
        y: 20
    },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.3,
            ease: [0.23, 1, 0.32, 1] // --ease-memory
        }
    },
    exit: {
        opacity: 0,
        y: 20,
        transition: {
            duration: 0.2,
            ease: [0.32, 0, 0.67, 0] // --ease-in
        }
    }
};

const reducedMotionModalVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { duration: 0.15 }
    },
    exit: {
        opacity: 0,
        transition: { duration: 0.1 }
    }
};

export function SafetyToolQuickRef({
    isOpen,
    onClose,
    tools,
    returnFocusRef
}: SafetyToolQuickRefProps) {
    const modalRef = useRef<HTMLDivElement>(null);
    const closeButtonRef = useRef<HTMLButtonElement>(null);

    // Check for reduced motion preference
    const prefersReducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Focus close button when modal opens
    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => {
                closeButtonRef.current?.focus();
            }, 50);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    // Return focus to trigger element on close
    const handleClose = useCallback(() => {
        onClose();
        // Allow animation to complete before returning focus
        setTimeout(() => {
            returnFocusRef?.current?.focus();
        }, 200);
    }, [onClose, returnFocusRef]);

    // Escape key handler
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                handleClose();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, handleClose]);

    // Focus trap
    useEffect(() => {
        if (!isOpen || !modalRef.current) return;

        const modal = modalRef.current;
        const focusableElements = modal.querySelectorAll<HTMLElement>(
            'button, [tabindex]:not([tabindex="-1"])'
        );
        const firstFocusable = focusableElements[0];
        const lastFocusable = focusableElements[focusableElements.length - 1];

        const handleTab = (e: KeyboardEvent) => {
            if (e.key !== 'Tab') return;

            if (e.shiftKey) {
                if (document.activeElement === firstFocusable) {
                    e.preventDefault();
                    lastFocusable?.focus();
                }
            } else {
                if (document.activeElement === lastFocusable) {
                    e.preventDefault();
                    firstFocusable?.focus();
                }
            }
        };

        document.addEventListener('keydown', handleTab);
        return () => document.removeEventListener('keydown', handleTab);
    }, [isOpen]);

    const enabledCount = tools.length;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="safety-quick-ref"
                    variants={overlayVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    transition={{ duration: 0.15 }}
                // Intentionally NOT closing on backdrop click
                // to prevent accidental dismissal during session
                >
                    <motion.div
                        ref={modalRef}
                        className="safety-quick-ref__modal"
                        variants={prefersReducedMotion ? reducedMotionModalVariants : modalVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        role="dialog"
                        aria-modal="true"
                        aria-label={`Safety Tools Reference, ${enabledCount} ${enabledCount === 1 ? 'tool' : 'tools'} enabled`}
                    >
                        <header className="safety-quick-ref__header">
                            <div className="safety-quick-ref__title-group">
                                <Shield
                                    size={20}
                                    className="safety-quick-ref__icon"
                                    aria-hidden="true"
                                />
                                <h2 className="safety-quick-ref__title">
                                    Table Boundaries
                                </h2>
                            </div>
                            <button
                                ref={closeButtonRef}
                                type="button"
                                className="safety-quick-ref__close"
                                onClick={handleClose}
                                aria-label="Close safety tools reference"
                            >
                                <X size={18} />
                            </button>
                        </header>

                        <div className="safety-quick-ref__content">
                            {enabledCount > 0 ? (
                                <ul className="safety-quick-ref__list" role="list">
                                    {tools.map((tool) => (
                                        <li
                                            key={tool.id}
                                            className="safety-quick-ref__tool"
                                        >
                                            <span className="safety-quick-ref__tool-name">
                                                {tool.name}
                                            </span>
                                            <p className="safety-quick-ref__tool-desc">
                                                {tool.description}
                                            </p>
                                            {tool.details && (
                                                <p className="safety-quick-ref__tool-details">
                                                    {tool.details}
                                                </p>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="safety-quick-ref__empty">
                                    <p className="safety-quick-ref__empty-text">
                                        No safety tools configured for this campaign.
                                    </p>
                                    <p className="safety-quick-ref__empty-hint">
                                        Configure table boundaries in Campaign Settings.
                                    </p>
                                </div>
                            )}
                        </div>

                        <footer className="safety-quick-ref__footer">
                            <span className="safety-quick-ref__hint">
                                Press <kbd>Esc</kbd> to close
                            </span>
                        </footer>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}