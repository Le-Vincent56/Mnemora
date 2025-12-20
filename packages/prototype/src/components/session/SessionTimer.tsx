import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Pause, Play, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import './SessionTimer.css';

interface SessionTimerProps {
    visible: boolean;
    onToggleVisible: () => void;
}

// Wrapper that creates the space — animates width
const wrapperVariants = {
    hidden: {
        width: 0,
        opacity: 0,
    },
    visible: {
        width: 135, // Fixed width for "H:MM:SS" + controls
        opacity: 1,
        transition: {
            width: { duration: 0.35, ease: [0.23, 1, 0.32, 1] },
            opacity: { duration: 0.2 },
        },
    },
    exit: {
        width: 0,
        opacity: 0,
        transition: {
            width: { duration: 0.3, ease: [0.4, 0, 1, 1], delay: 0.15 },
            opacity: { duration: 0.2, delay: 0.1 },
        },
    },
};

// Time container — staggers the character children
const timeVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.045,
            delayChildren: 0.15,
        },
    },
    exit: {
        opacity: 0,
        transition: {
            staggerChildren: 0.02,
            staggerDirection: -1,
        },
    },
};

// Individual character — "sand falling"
const charVariants = {
    hidden: {
        opacity: 0,
        y: -10,
        filter: 'blur(3px)',
    },
    visible: {
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
        transition: {
            duration: 0.35,
            ease: [0.23, 1, 0.32, 1],
        },
    },
    exit: {
        opacity: 0,
        y: 6,
        filter: 'blur(2px)',
        transition: {
            duration: 0.12,
        },
    },
};

// Controls — fade in after digits
const controlsVariants = {
    hidden: {
        opacity: 0,
        scale: 0.8,
    },
    visible: {
        opacity: 1,
        scale: 1,
        transition: {
            duration: 0.25,
            ease: [0.23, 1, 0.32, 1],
            delay: 0.35,
        },
    },
    exit: {
        opacity: 0,
        scale: 0.8,
        transition: { duration: 0.1 },
    },
};

export function SessionTimer({ visible, onToggleVisible }: SessionTimerProps) {
    const [seconds, setSeconds] = useState(0);
    const [isRunning, setIsRunning] = useState(true);

    useEffect(() => {
        let interval: number | undefined;
        if (visible && isRunning) {
            interval = window.setInterval(() => {
                setSeconds((s) => s + 1);
            }, 1000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [visible, isRunning]);

    const togglePause = useCallback(() => {
        setIsRunning((r) => !r);
    }, []);

    const reset = useCallback(() => {
        setSeconds(0);
        setIsRunning(true);
    }, []);

    const formatTime = (totalSeconds: number): string => {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const timeString = formatTime(seconds);

    return (
        <div className="session-timer-container">
            {/* Clock button — animates based on visible state */}
            <motion.div
                animate={{
                    scale: visible ? 0.9 : 1,
                    opacity: visible ? 0.7 : 1,
                    x: visible ? -2 : 0,
                }}
                transition={{
                    duration: 0.3,
                    ease: [0.23, 1, 0.32, 1],
                }}
            >
                <Button variant="icon" onClick={onToggleVisible} title="Toggle session timer">
                    <Clock size={18} />
                </Button>
            </motion.div>

            <AnimatePresence>
                {visible && (
                    <motion.div
                        className="session-timer"
                        variants={wrapperVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                    >
                        {/* Time digits */}
                        <motion.span
                            className="session-timer__time"
                            variants={timeVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                        >
                            {timeString.split('').map((char, index) => (
                                <motion.span
                                    key={`${index}-${char}`}
                                    className={`session-timer__char ${char === ':' ? 'session-timer__char--colon' : ''}`}
                                    variants={charVariants}
                                >
                                    {char}
                                </motion.span>
                            ))}
                        </motion.span>

                        {/* Controls */}
                        <motion.div
                            className="session-timer__controls"
                            variants={controlsVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                        >
                            <Button variant="icon" onClick={togglePause} title={isRunning ? 'Pause' : 'Resume'}>
                                {isRunning ? <Pause size={14} /> : <Play size={14} />}
                            </Button>
                            <Button variant="icon" onClick={reset} title="Reset timer">
                                <RotateCcw size={14} />
                            </Button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}