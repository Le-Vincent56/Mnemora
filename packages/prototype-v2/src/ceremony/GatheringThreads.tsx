import { motion, AnimatePresence } from 'framer-motion';
import { useMemo } from 'react';
import { EASING } from '@/tokens';

// ===============================
//         CONFIGURATION
// ===============================

const THREAD_CONFIG = {
    count: 8,
    staggerMs: 25,
    durationMs: 350,
    colors: [
        'rgba(147, 112, 219, 0.7)',  // Violet
        'rgba(100, 149, 237, 0.6)',  // Cornflower
        'rgba(72, 209, 204, 0.6)',   // Turquoise
        'rgba(255, 182, 193, 0.5)',  // Blush
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

    return edgePositions.map((pos, index) => ({
        id: index,
        startX: pos.x + (Math.random() - 0.5) * 40,
        startY: pos.y + (Math.random() - 0.5) * 40,
        color: THREAD_CONFIG.colors[index % THREAD_CONFIG.colors.length] ?? defaultColor,
        delay: index * (THREAD_CONFIG.staggerMs / 1000),
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
}: {
    startX: number;
    startY: number;
    targetX: number;
    targetY: number;
    color: string;
    delay: number;
}) {
    return (
        <motion.div
            style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: 3,
                height: 3,
                borderRadius: '50%',
                backgroundColor: color,
                boxShadow: `0 0 12px 4px ${color}, 0 0 24px 8px ${color.replace(/[\d.]+\)$/, '0.3)')}`,
                pointerEvents: 'none',
            }}
            initial={{
                x: startX,
                y: startY,
                scale: 1.5,
                opacity: 0,
            }}
            animate={{
                x: targetX,
                y: targetY,
                scale: [1.5, 1, 0.5],
                opacity: [0, 1, 1, 0.6],
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
                scale: {
                    duration: THREAD_CONFIG.durationMs / 1000,
                    delay,
                    times: [0, 0.5, 1],
                },
                opacity: {
                    duration: THREAD_CONFIG.durationMs / 1000,
                    delay,
                    times: [0, 0.1, 0.7, 1],
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
                left: x - 25,
                top: y - 25,
                width: 50,
                height: 50,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(147,112,219,0.3) 50%, transparent 70%)',
                boxShadow: '0 0 30px rgba(255,255,255,0.6), 0 0 60px rgba(147,112,219,0.4)',
                pointerEvents: 'none',
            }}
            initial={{ opacity: 0, scale: 0.2 }}
            animate={{
                opacity: [0, 0.6, 1],
                scale: [0.2, 0.7, 1],
            }}
            transition={{
                duration: 0.35,
                delay: 0.15,
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