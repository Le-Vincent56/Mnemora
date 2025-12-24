import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './WorldCreationModal.css';

interface WorldCreationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (world: { name: string; tagline?: string }) => void;
}

const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
};

const cardVariants = {
    hidden: {
        opacity: 0,
        scale: 0.95,
        y: 12
    },
    visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: {
            duration: 0.3,
            ease: [0.23, 1, 0.32, 1] // --ease-memory
        }
    },
    exit: {
        opacity: 0,
        scale: 0.98,
        y: 8,
        transition: {
            duration: 0.15,
            ease: [0.32, 0, 0.67, 0] // --ease-in
        }
    }
};

export function WorldCreationModal({
    isOpen,
    onClose,
    onCreate
}: WorldCreationModalProps) {
    const [name, setName] = useState('');
    const [tagline, setTagline] = useState('');
    const [nameError, setNameError] = useState<string | null>(null);
    const [touched, setTouched] = useState(false);

    const nameInputRef = useRef<HTMLInputElement>(null);
    const modalRef = useRef<HTMLDivElement>(null);

    // Reset form when modal closes
    useEffect(() => {
        if (!isOpen) {
            setName('');
            setTagline('');
            setNameError(null);
            setTouched(false);
        }
    }, [isOpen]);

    // Focus name input when modal opens
    useEffect(() => {
        if (isOpen) {
            // Small delay to allow animation to start
            const timer = setTimeout(() => {
                nameInputRef.current?.focus();
            }, 50);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    // Escape key handler
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    // Focus trap
    useEffect(() => {
        if (!isOpen || !modalRef.current) return;

        const modal = modalRef.current;
        const focusableElements = modal.querySelectorAll<HTMLElement>(
            'input, button, [tabindex]:not([tabindex="-1"])'
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

    const validateName = useCallback((value: string): string | null => {
        const trimmed = value.trim();
        if (!trimmed) return 'World name is required';
        if (trimmed.length > 100) return 'Name cannot exceed 100 characters';
        return null;
    }, []);

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setName(value);

        // Clear error while typing if it becomes valid
        if (touched && !validateName(value)) {
            setNameError(null);
        }
    };

    const handleNameBlur = () => {
        setTouched(true);
        setNameError(validateName(name));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const error = validateName(name);
        if (error) {
            setNameError(error);
            setTouched(true);
            nameInputRef.current?.focus();
            return;
        }

        onCreate({
            name: name.trim(),
            tagline: tagline.trim() || undefined
        });
    };

    const isValid = !validateName(name);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="creation-modal"
                    variants={overlayVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    transition={{ duration: 0.15 }}
                    onClick={onClose}
                >
                    <motion.div
                        ref={modalRef}
                        className="creation-modal__card"
                        variants={cardVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        onClick={(e) => e.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="world-modal-title"
                    >
                        <h2 id="world-modal-title" className="creation-modal__title">
                            Create New World
                        </h2>

                        <form onSubmit={handleSubmit} className="creation-modal__form">
                            <div className="creation-modal__field">
                                <label
                                    htmlFor="world-name"
                                    className="creation-modal__label"
                                >
                                    World Name <span className="creation-modal__required">*</span>
                                </label>
                                <input
                                    ref={nameInputRef}
                                    id="world-name"
                                    type="text"
                                    className={`creation-modal__input ${touched && nameError ? 'creation-modal__input--error' : ''}`}
                                    value={name}
                                    onChange={handleNameChange}
                                    onBlur={handleNameBlur}
                                    placeholder="Enter world name"
                                    maxLength={100}
                                    aria-invalid={touched && !!nameError}
                                    aria-describedby={nameError ? 'name-error' : undefined}
                                    autoComplete="off"
                                />
                                {touched && nameError && (
                                    <span
                                        id="name-error"
                                        className="creation-modal__error"
                                        role="alert"
                                    >
                                        {nameError}
                                    </span>
                                )}
                            </div>

                            <div className="creation-modal__field">
                                <label
                                    htmlFor="world-tagline"
                                    className="creation-modal__label"
                                >
                                    Tagline
                                </label>
                                <input
                                    id="world-tagline"
                                    type="text"
                                    className="creation-modal__input"
                                    value={tagline}
                                    onChange={(e) => setTagline(e.target.value)}
                                    placeholder="A brief description..."
                                    maxLength={200}
                                    autoComplete="off"
                                />
                                <span className="creation-modal__hint">
                                    Optional — appears below the world name
                                </span>
                            </div>

                            <div className="creation-modal__actions">
                                <button
                                    type="button"
                                    className="creation-modal__btn creation-modal__btn--ghost"
                                    onClick={onClose}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="creation-modal__btn creation-modal__btn--primary"
                                    disabled={!isValid}
                                >
                                    Create World
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}