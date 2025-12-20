import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shuffle, X } from 'lucide-react';
import { getRandomPrimer, getNextPrimer } from '@/data/primers';
import './PrimerText.css';

interface PrimerTextProps {
    entityType: string;
    field: string;
    isFieldEmpty: boolean;
    isFieldFocused: boolean;
    hesitationMs?: number;
    baseTypingSpeedMs?: number;
    onDismiss?: () => void;
}

// Natural typing rhythm - varies speed and adds pauses
function getTypingDelay(char: string, prevChar: string, baseSpeed: number): number {
    // Gentle variance: 0.8x to 1.3x
    const variance = 0.8 + Math.random() * 0.5;
    let delay = baseSpeed * variance;

    // Thoughtful pauses after sentence-ending punctuation
    if (['.', '?', '!'].includes(prevChar)) {
        delay += baseSpeed * (2 + Math.random() * 1.5);
    }
    // Brief pause after other punctuation
    else if ([',', ';', ':'].includes(prevChar)) {
        delay += baseSpeed * (0.8 + Math.random() * 0.6);
    }
    // Subtle pause at word boundaries
    else if (prevChar === ' ') {
        delay += baseSpeed * (0.2 + Math.random() * 0.3);
    }

    return delay;
}

export function PrimerText({
    entityType,
    field,
    isFieldEmpty,
    isFieldFocused,
    hesitationMs = 4000,
    baseTypingSpeedMs = 38,
    onDismiss,
}: PrimerTextProps) {
    const [primer, setPrimer] = useState(() => getRandomPrimer(entityType, field));
    const [displayedChars, setDisplayedChars] = useState(0);
    const [isTyping, setIsTyping] = useState(false);
    const [showPrimer, setShowPrimer] = useState(false);
    // Track a unique key for each render cycle to ensure fresh animations
    const [animationKey, setAnimationKey] = useState(0);
    const typingTimeoutRef = useRef<number | null>(null);

    // Start hesitation timer when field is empty and focused
    useEffect(() => {
        if (!isFieldEmpty || !isFieldFocused) {
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
            setAnimationKey((k) => k + 1);
        }, hesitationMs);

        return () => clearTimeout(hesitationTimer);
    }, [isFieldEmpty, isFieldFocused, hesitationMs]);

    // Type characters one by one with natural timing
    useEffect(() => {
        if (!isTyping || !showPrimer) return;

        if (displayedChars >= primer.length) {
            setIsTyping(false);
            return;
        }

        const currentChar = primer[displayedChars];
        const prevChar = displayedChars > 0 ? primer[displayedChars - 1] : '';
        const delay = getTypingDelay(currentChar, prevChar, baseTypingSpeedMs);

        typingTimeoutRef.current = window.setTimeout(() => {
            setDisplayedChars((c) => c + 1);
        }, delay);

        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        };
    }, [isTyping, showPrimer, displayedChars, primer, baseTypingSpeedMs]);

    const handleShuffle = useCallback(() => {
        const nextPrimer = getNextPrimer(entityType, field, primer);
        setPrimer(nextPrimer);
        setDisplayedChars(0);
        setAnimationKey((k) => k + 1);
        setIsTyping(true);
    }, [entityType, field, primer]);

    const handleDismiss = useCallback(() => {
        setShowPrimer(false);
        onDismiss?.();
    }, [onDismiss]);

    if (!showPrimer) return null;

    const displayedText = primer.slice(0, displayedChars);

    return (
        <AnimatePresence>
            <motion.div
                className="primer"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            >
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
                        className="primer__control-btn"
                        onClick={handleShuffle}
                        title="Try another prompt"
                        aria-label="Get different prompt"
                    >
                        <Shuffle size={14} />
                    </button>
                    <button
                        className="primer__control-btn"
                        onClick={handleDismiss}
                        title="Dismiss"
                        aria-label="Dismiss prompt"
                    >
                        <X size={14} />
                    </button>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}