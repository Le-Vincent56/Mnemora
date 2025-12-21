import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shuffle, X } from 'lucide-react';
import { getRandomPrimer, getNextPrimer } from '@/data/primers';
import { AutoGrowTextArea } from './AutoGrowTextArea';
import './EditorTextArea.css';

interface EditorTextAreaProps {
    value: string;                      // Current value
    onChange: (value: string) => void;  // Change handler
    entityType: string;                 // Entity type for primer selection
    field: string;                      // Field name for primer selection (e.g., 'description', 'secrets')
    placeholder?: string;               // Placeholder text
    borderless?: boolean;               // Borderless variant (for styled containers like secrets)
    hesitationMs?: number;              // Hesitation time before showing primer (ms)
}

export function EditorTextArea({
    value,
    onChange,
    entityType,
    field,
    placeholder,
    borderless = false,
    hesitationMs = 4000,
}: EditorTextAreaProps) {
    const [isFocused, setIsFocused] = useState(false);
    const [showPrimer, setShowPrimer] = useState(false);
    const [primerDismissed, setPrimerDismissed] = useState(false);
    const [primer, setPrimer] = useState(() => getRandomPrimer(entityType, field));
    const [displayedChars, setDisplayedChars] = useState(0);
    const [isTyping, setIsTyping] = useState(false);
    const [animationKey, setAnimationKey] = useState(0);

    const typingTimeoutRef = useRef<number | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const isEmpty = value.trim() === '';
    const shouldShowPrimer = isEmpty && isFocused && showPrimer && !primerDismissed;

    // Natural typing rhythm
    const getTypingDelay = useCallback((_char: string, prevChar: string): number => {
        const baseSpeed = 38;
        const variance = 0.8 + Math.random() * 0.5;
        let delay = baseSpeed * variance;

        if (['.', '?', '!'].includes(prevChar)) {
            delay += baseSpeed * (2 + Math.random() * 1.5);
        } else if ([',', ';', ':'].includes(prevChar)) {
            delay += baseSpeed * (0.8 + Math.random() * 0.6);
        } else if (prevChar === ' ') {
            delay += baseSpeed * (0.2 + Math.random() * 0.3);
        }

        return delay;
    }, []);

    // Start hesitation timer when field is empty and focused
    useEffect(() => {
        if (!isEmpty || !isFocused || primerDismissed) {
            setShowPrimer(false);
            setDisplayedChars(0);
            setIsTyping(false);
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
            return;
        }

        const hesitationTimer = setTimeout(() => {
            setShowPrimer(true);
            setIsTyping(true);
            setDisplayedChars(0);
            setAnimationKey(k => k + 1);
        }, hesitationMs);

        return () => clearTimeout(hesitationTimer);
    }, [isEmpty, isFocused, primerDismissed, hesitationMs]);

    // Type characters one by one
    useEffect(() => {
        if (!isTyping || !showPrimer) return;

        if (displayedChars >= primer.length) {
            setIsTyping(false);
            return;
        }

        const currentChar = primer[displayedChars];
        const prevChar = displayedChars > 0 ? primer[displayedChars - 1] : '';
        const delay = getTypingDelay(currentChar, prevChar);

        typingTimeoutRef.current = window.setTimeout(() => {
            setDisplayedChars(c => c + 1);
        }, delay);

        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        };
    }, [isTyping, showPrimer, displayedChars, primer, getTypingDelay]);

    // Reset primer when entity type changes
    useEffect(() => {
        setPrimer(getRandomPrimer(entityType, field));
        setPrimerDismissed(false);
    }, [entityType, field]);

    const handleFocus = useCallback(() => {
        setIsFocused(true);
    }, []);

    const handleBlur = useCallback(() => {
        setIsFocused(false);
    }, []);

    const handleChange = useCallback((newValue: string) => {
        onChange(newValue);
        // If user starts typing, primer will naturally hide (isEmpty becomes false)
    }, [onChange]);

    const handleShuffle = useCallback(() => {
        const nextPrimer = getNextPrimer(entityType, field, primer);
        setPrimer(nextPrimer);
        setDisplayedChars(0);
        setAnimationKey(k => k + 1);
        setIsTyping(true);
    }, [entityType, field, primer]);

    const handleDismiss = useCallback(() => {
        setShowPrimer(false);
        setPrimerDismissed(true);
    }, []);

    const displayedText = primer.slice(0, displayedChars);

    return (
        <div className={`editor-textarea ${borderless ? 'editor-textarea--borderless' : ''}`}>
            <div className="editor-textarea__input-wrapper">
                <AutoGrowTextArea
                    ref={textareaRef}
                    value={value}
                    onChange={handleChange}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    placeholder={shouldShowPrimer ? '' : placeholder}
                    borderless={borderless}
                />

                {/* Primer Overlay */}
                <AnimatePresence>
                    {shouldShowPrimer && (
                        <motion.div
                            className="editor-textarea__primer-wrapper"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                        >
                            <div className="primer">
                                <span className="primer__text" aria-label={displayedText} role="status">
                                    {displayedText.split('').map((char, i) => (
                                        <span
                                            key={`${animationKey}-${i}`}
                                            className="primer__char"
                                        >
                                            {char}
                                        </span>
                                    ))}
                                    <span
                                        className={`primer__cursor ${isTyping ? 'primer__cursor--typing' : 'primer__cursor--idle'}`}
                                        aria-hidden="true"
                                    />
                                </span>

                                <motion.div
                                    className="primer__controls"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: isTyping ? 0 : 1 }}
                                    transition={{ duration: 0.3, delay: isTyping ? 0 : 0.4 }}
                                >
                                    <button
                                        type="button"
                                        className="primer__control-btn"
                                        onClick={handleShuffle}
                                        title="Try another prompt"
                                        aria-label="Get different prompt"
                                    >
                                        <Shuffle size={14} />
                                    </button>
                                    <button
                                        type="button"
                                        className="primer__control-btn"
                                        onClick={handleDismiss}
                                        title="Dismiss"
                                        aria-label="Dismiss prompt"
                                    >
                                        <X size={14} />
                                    </button>
                                </motion.div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}