import { motion, AnimatePresence } from 'framer-motion';
import { useMemo } from 'react';
import { EASING } from '@/tokens';

// ===============================
//         CONFIGURATION
// ===============================

const THREAD_CONFIG = {
    count: 10,
    staggerMs: 15,
    durationMs: 350,
    colors: [
        'rgba(250, 250, 250, 0.9)',  // Bright white
        'rgba(212, 212, 216, 0.85)', // Zinc-200
        'rgba(161, 161, 170, 0.8)',  // Zinc-400
        'rgba(228, 228, 231, 0.85)', // Zinc-300
    ],
} as const;

// ===============================
//              TYPES
// ===============================

interface GatheringThreadsProps {
    isActive: boolean;
    targetX: number;  // Pixels
    targetY: number;  // Pixels
    onGatherComplete?: () => void;
}

interface ThreadData {
    id: number;
    startX: number;  // Pixels
    startY: number;  // Pixels
    color: string;
    delay: number;
    angle: number;   // Radians — rotation toward target
}

// ===============================
//      THREAD DATA GENERATOR
// ===============================

function generateThreads(_targetX: number, _targetY: number): ThreadData[] {
    const defaultColor = THREAD_CONFIG.colors[0];
    const viewW = typeof window !== 'undefined' ? window.innerWidth : 1920;
    const viewH = typeof window !== 'undefined' ? window.innerHeight : 1080;

    // Define start positions around the viewport edges (in pixels)
    const edgePositions = [
        { x: viewW * 0.15, y: -20 },           // Top-left
        { x: viewW * 0.55, y: -20 },           // Top-center
        { x: viewW + 20, y: viewH * 0.2 },     // Right-top
        { x: viewW + 20, y: viewH * 0.6 },     // Right-bottom
        { x: viewW * 0.7, y: viewH + 20 },     // Bottom-right
        { x: viewW * 0.3, y: viewH + 20 },     // Bottom-left
        { x: -20, y: viewH * 0.65 },           // Left-bottom
        { x: -20, y: viewH * 0.25 },           // Left-top
    ];

    // Add 8 extra threads at random edge positions
    const extraPositions = Array.from({ length: 8 }, () => {
        const side = Math.floor(Math.random() * 4);
        const t = Math.random();
        if (side === 0) return { x: viewW * t, y: -20 };
        if (side === 1) return { x: viewW + 20, y: viewH * t };
        if (side === 2) return { x: viewW * t, y: viewH + 20 };
        return { x: -20, y: viewH * t };
    });

    return [...edgePositions, ...extraPositions].map((pos, index) => ({
        id: index,
        startX: pos.x + (Math.random() - 0.5) * 40,
        startY: pos.y + (Math.random() - 0.5) * 40,
        color: THREAD_CONFIG.colors[index % THREAD_CONFIG.colors.length] ?? defaultColor,
        delay: index * (THREAD_CONFIG.staggerMs / 1000),
        angle: Math.atan2(_targetY - pos.y, _targetX - pos.x),
    }));
}

// ===============================
//        SINGLE THREAD
// ===============================

function Thread({
    startX,
    startY,
    targetX,
    targetY,
    color,
    delay,
    angle,
}: {
    startX: number;
    startY: number;
    targetX: number;
    targetY: number;
    color: string;
    delay: number;
    angle: number;
}) {
    const angleDeg = angle * (180 / Math.PI);
    return (
        <motion.div
            style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: 40,
                height: 4,
                borderRadius: '2px',
                backgroundColor: color,
                boxShadow: `0 0 20px 8px ${color}, 0 0 48px 16px ${color.replace(/[\d.]+\)$/, '0.35)')}`,
                pointerEvents: 'none',
                transformOrigin: 'center center',
            }}
            initial={{
                x: startX,
                y: startY,
                scaleX: 1.8,
                scaleY: 1,
                rotate: angleDeg,
                opacity: 0,
            }}
            animate={{
                x: targetX,
                y: targetY,
                scaleX: [1.8, 1.2, 0.3],
                scaleY: [1, 1.5, 0.5],
                rotate: angleDeg,
                opacity: [0, 0.95, 1, 0.7],
            }}
            transition={{
                x: {
                    duration: THREAD_CONFIG.durationMs / 1000,
                    delay,
                    ease: EASING.inQuad,
                },
                y: {
                    duration: THREAD_CONFIG.durationMs / 1000,
                    delay,
                    ease: EASING.inQuad,
                },
                scaleX: {
                    duration: THREAD_CONFIG.durationMs / 1000,
                    delay,
                    times: [0, 0.5, 1],
                },
                scaleY: {
                    duration: THREAD_CONFIG.durationMs / 1000,
                    delay,
                    times: [0, 0.5, 1],
                },
                opacity: {
                    duration: THREAD_CONFIG.durationMs / 1000,
                    delay,
                    times: [0, 0.08, 0.6, 1],
                },
            }}
        />
    );
}

// ===============================
//       CONVERGENCE GLOW
// ===============================

function ConvergenceGlow({ x, y }: { x: number; y: number }) {
    return (
        <motion.div
            style={{
                position: 'absolute',
                left: x - 40,
                top: y - 40,
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(212,212,216,0.5) 40%, rgba(161,161,170,0.25) 65%, transparent 80%)',
                boxShadow: '0 0 40px rgba(255,255,255,0.8), 0 0 80px rgba(161,161,170,0.5)',
                pointerEvents: 'none',
            }}
            initial={{ opacity: 0, scale: 0.15 }}
            animate={{
                opacity: [0, 0.5, 1],
                scale: [0.15, 0.6, 1.1],
            }}
            transition={{
                duration: 0.38,
                delay: 0.1,
                ease: EASING.inQuad,
            }}
        />
    );
}

// ===============================
//        MAIN COMPONENT
// ===============================

export function GatheringThreads({
    isActive,
    targetX,
    targetY,
    onGatherComplete,
}: GatheringThreadsProps) {
    const threads = useMemo(
        () => generateThreads(targetX, targetY),
        [targetX, targetY]
    );

    return (
        <AnimatePresence
            onExitComplete={() => {
                onGatherComplete?.();
            }}
        >
            {isActive && (
                <motion.div
                    key="gathering-threads"
                    style={{
                        position: 'absolute',
                        inset: 0,
                        overflow: 'visible',
                        pointerEvents: 'none',
                    }}
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: 0.1 } }}
                >
                    {/* Threads flying toward target */}
                    {threads.map((thread) => (
                        <Thread
                            key={thread.id}
                            startX={thread.startX}
                            startY={thread.startY}
                            targetX={targetX}
                            targetY={targetY}
                            color={thread.color}
                            delay={thread.delay}
                            angle={thread.angle}
                        />
                    ))}

                    {/* Glow at convergence point */}
                    <ConvergenceGlow x={targetX} y={targetY} />
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export default GatheringThreads;