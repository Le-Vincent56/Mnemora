import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './QuickNoteCapture.css';

const MAX_CHARACTERS = 500;
const WARNING_THRESHOLD = 450;

export interface QuickNoteCaptureProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (content: string, timestamp: Date) => void;
    returnFocusRef?: React.RefObject<HTMLElement>;
}

const popoverVariants = {
    hidden: {
        opacity: 0,
        y: 8,
        scale: 0.96
    },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            duration: 0.2,
            ease: [0.23, 1, 0.32, 1] // --ease-memory
        }
    },
    exit: {
        opacity: 0,
        y: 4,
        scale: 0.98,
        transition: {
            duration: 0.15,
            ease: [0.32, 0, 0.67, 0] // --ease-in
        }
    }
};

const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
};

const reducedMotionVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.1 } },
    exit: { opacity: 0, transition: { duration: 0.1 } }
};

export function QuickNoteCapture({
    isOpen,
    onClose,
    onSave,
    returnFocusRef
}: QuickNoteCaptureProps) {
    const [content, setContent] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const popoverRef = useRef<HTMLDivElement>(null);

    const prefersReducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const characterCount = content.length;
    const isNearLimit = characterCount >= WARNING_THRESHOLD;
    const isAtLimit = characterCount >= MAX_CHARACTERS;

    // Reset content when closing
    useEffect(() => {
        if (!isOpen) {
            // Small delay to allow exit animation
            const timer = setTimeout(() => setContent(''), 200);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    // Focus textarea when opening
    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => {
                textareaRef.current?.focus();
            }, 50);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    // Handle close with focus return
    const handleClose = useCallback(() => {
        onClose();
        setTimeout(() => {
            returnFocusRef?.current?.focus();
        }, 200);
    }, [onClose, returnFocusRef]);

    // Handle save
    const handleSave = useCallback(() => {
        const trimmed = content.trim();
        if (trimmed.length === 0) {
            // Don't save empty notes, just close
            handleClose();
            return;
        }

        onSave(trimmed, new Date());
        handleClose();
    }, [content, onSave, handleClose]);

    // Keyboard handlers
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                handleClose();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, handleClose]);

    // Handle Enter to save (Shift+Enter for newline)
    const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSave();
        }
    };

    // Handle content change with limit
    const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        if (value.length <= MAX_CHARACTERS) {
            setContent(value);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Translucent backdrop */}
                    <motion.div
                        className="quick-note-backdrop"
                        variants={backdropVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        transition={{ duration: 0.15 }}
                        onClick={handleClose}
                        aria-hidden="true"
                    />

                    {/* Popover */}
                    <motion.div
                        ref={popoverRef}
                        className="quick-note-capture"
                        variants={prefersReducedMotion ? reducedMotionVariants : popoverVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        role="dialog"
                        aria-modal="true"
                        aria-label="Capture a quick note"
                    >
                        <textarea
                            ref={textareaRef}
                            className="quick-note-capture__textarea"
                            value={content}
                            onChange={handleContentChange}
                            onKeyDown={handleTextareaKeyDown}
                            placeholder="Capture a thought..."
                            maxLength={MAX_CHARACTERS}
                            rows={4}
                            aria-describedby="quick-note-counter"
                        />

                        <div className="quick-note-capture__footer">
                            <span
                                id="quick-note-counter"
                                className={`quick-note-capture__counter ${isNearLimit ? 'quick-note-capture__counter--warning' : ''
                                    } ${isAtLimit ? 'quick-note-capture__counter--limit' : ''}`}
                                aria-live="polite"
                            >
                                {characterCount} / {MAX_CHARACTERS}
                            </span>

                            <div className="quick-note-capture__actions">
                                <span className="quick-note-capture__hint">
                                    <kbd>Enter</kbd> to save
                                </span>
                                <button
                                    type="button"
                                    className="quick-note-capture__save"
                                    onClick={handleSave}
                                    disabled={content.trim().length === 0}
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}