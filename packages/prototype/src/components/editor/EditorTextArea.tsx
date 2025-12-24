import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Shuffle, X } from 'lucide-react';
import { primers } from '@/data/primers';
import { AutoGrowTextArea } from './AutoGrowTextArea';
import './EditorTextArea.css';

interface EditorTextAreaProps {
    value: string;
    onChange: (value: string) => void;
    entityType: string;
    field: string;
    placeholder?: string;
    borderless?: boolean;
    hesitationMs?: number;
    disabled?: boolean;
    onFocus?: () => void;
    onBlur?: () => void;
}

/** Number of recent characters that receive the glow effect */
const GLOW_CHAR_COUNT = 4;

/** Base typing speed in milliseconds */
const BASE_TYPING_SPEED = 30;

export function EditorTextArea({
    value,
    onChange,
    entityType,
    field,
    placeholder,
    borderless = false,
    hesitationMs = 4000,
    disabled = false,
    onFocus,
    onBlur,
}: EditorTextAreaProps) {
    const shouldReduceMotion = useReducedMotion();

    const [isFocused, setIsFocused] = useState(false);
    const [showPrimer, setShowPrimer] = useState(false);
    const [primerDismissed, setPrimerDismissed] = useState(false);

    // Track last shown primer index to ensure variety on re-trigger
    const lastPrimerIndexRef = useRef<number>(-1);
    const [primer, setPrimer] = useState(() => {
        const result = getRandomPrimerWithIndex(entityType, field, -1);
        lastPrimerIndexRef.current = result.index;
        return result.prompt;
    });

    const [displayedChars, setDisplayedChars] = useState(0);
    const [isTyping, setIsTyping] = useState(false);
    const [animationKey, setAnimationKey] = useState(0);

    const typingTimeoutRef = useRef<number | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const isEmpty = value.trim() === '';
    const shouldShowPrimer = isEmpty && isFocused && showPrimer && !primerDismissed;

    /**
     * Get a random primer that differs from the last one shown.
     */
    function getRandomPrimerWithIndex(
        entityType: string,
        field: string,
        excludeIndex: number
    ): { prompt: string; index: number } {
        const key = `${entityType}.${field}`;
        const options = primers[key] || primers['default'];

        if (options.length <= 1) {
            return { prompt: options[0] || '', index: 0 };
        }

        // Pick a random index that differs from excludeIndex
        let newIndex: number;
        do {
            newIndex = Math.floor(Math.random() * options.length);
        } while (newIndex === excludeIndex && options.length > 1);

        return { prompt: options[newIndex], index: newIndex };
    }

    // Natural typing rhythm with variance
    const getTypingDelay = useCallback((_char: string, prevChar: string): number => {
        const variance = 0.85 + Math.random() * 0.3;
        let delay = BASE_TYPING_SPEED * variance;

        // Thoughtful pauses after punctuation
        if (['.', '?', '!'].includes(prevChar)) {
            delay += BASE_TYPING_SPEED * (2.5 + Math.random() * 1.5);
        } else if ([',', ';', ':'].includes(prevChar)) {
            delay += BASE_TYPING_SPEED * (0.8 + Math.random() * 0.4);
        } else if (prevChar === ' ') {
            delay += BASE_TYPING_SPEED * (0.15 + Math.random() * 0.2);
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
            // Get a NEW random primer different from last shown
            const result = getRandomPrimerWithIndex(
                entityType,
                field,
                lastPrimerIndexRef.current
            );
            setPrimer(result.prompt);
            lastPrimerIndexRef.current = result.index;

            setShowPrimer(true);
            setAnimationKey(k => k + 1);

            // For reduced motion, show full text immediately
            if (shouldReduceMotion) {
                setDisplayedChars(result.prompt.length);
                setIsTyping(false);
            } else {
                setIsTyping(true);
                setDisplayedChars(0);
            }
        }, hesitationMs);

        return () => clearTimeout(hesitationTimer);
    }, [isEmpty, isFocused, primerDismissed, hesitationMs, entityType, field, shouldReduceMotion]);

    // Type characters one by one (skip if reduced motion)
    useEffect(() => {
        if (!isTyping || !showPrimer || shouldReduceMotion) return;

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
    }, [isTyping, showPrimer, displayedChars, primer, getTypingDelay, shouldReduceMotion]);

    // Reset primer when entity type changes
    useEffect(() => {
        const result = getRandomPrimerWithIndex(entityType, field, -1);
        setPrimer(result.prompt);
        lastPrimerIndexRef.current = result.index;
        setPrimerDismissed(false);
    }, [entityType, field]);

    const handleFocus = useCallback(() => {
        setIsFocused(true);
        onFocus?.();
    }, [isEmpty]);

    const handleBlur = useCallback(() => {
        setIsFocused(false);
        onBlur?.();
    }, []);

    const handleChange = useCallback((newValue: string) => {
        onChange(newValue);
    }, [onChange]);

    const handleShuffle = useCallback(() => {
        const result = getRandomPrimerWithIndex(
            entityType,
            field,
            lastPrimerIndexRef.current
        );
        setPrimer(result.prompt);
        lastPrimerIndexRef.current = result.index;
        setAnimationKey(k => k + 1);

        if (shouldReduceMotion) {
            setDisplayedChars(result.prompt.length);
            setIsTyping(false);
        } else {
            setDisplayedChars(0);
            setIsTyping(true);
        }
    }, [entityType, field, shouldReduceMotion]);

    const handleDismiss = useCallback(() => {
        setShowPrimer(false);
        setPrimerDismissed(true);
    }, []);

    // Calculate which characters should have the glow effect
    const recentCharIndices = useMemo(() => {
        if (shouldReduceMotion || !isTyping) return new Set<number>();
        const start = Math.max(0, displayedChars - GLOW_CHAR_COUNT);
        const indices = new Set<number>();
        for (let i = start; i < displayedChars; i++) {
            indices.add(i);
        }
        return indices;
    }, [displayedChars, isTyping, shouldReduceMotion]);

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
                    disabled={disabled}
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
                                <span
                                    className="primer__text"
                                    aria-label={displayedText}
                                    role="status"
                                    aria-live="polite"
                                >
                                    {displayedText.split('').map((char, i) => (
                                        <span
                                            key={`${animationKey}-${i}`}
                                            className={`primer__char ${recentCharIndices.has(i)
                                                    ? 'primer__char--recent'
                                                    : ''
                                                }`}
                                        >
                                            {char}
                                        </span>
                                    ))}
                                    {isTyping && (
                                        <span
                                            className="primer__cursor primer__cursor--typing"
                                            aria-hidden="true"
                                        />
                                    )}
                                    {!isTyping && displayedChars > 0 && (
                                        <span
                                            className="primer__cursor primer__cursor--idle"
                                            aria-hidden="true"
                                        />
                                    )}
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