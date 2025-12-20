import { ReactNode, useMemo } from 'react';
import { motion } from 'framer-motion';
import './EmptyState.css';

interface EmptyStateProps {
    title: string;
    description?: string;
    action?: ReactNode;
}

interface StarPoint {
    x: number;
    y: number;
    magnitude: number; // 1 = brightest, 3 = dimmest
}

interface ConstellationTemplate {
    name: string;
    stars: StarPoint[];
    connections: [number, number][]; // pairs of star indices to connect
}

// Pre-designed constellation templates inspired by real patterns
// Coordinates are in a 100x100 viewBox, centered around (50, 50)
const CONSTELLATION_TEMPLATES: ConstellationTemplate[] = [
    {
        // Inspired by Ursa Major (Big Dipper)
        name: 'dipper',
        stars: [
            { x: 25, y: 35, magnitude: 1 },
            { x: 35, y: 30, magnitude: 2 },
            { x: 45, y: 32, magnitude: 1 },
            { x: 55, y: 38, magnitude: 2 },
            { x: 62, y: 50, magnitude: 1 },
            { x: 72, y: 58, magnitude: 2 },
            { x: 80, y: 52, magnitude: 1 },
        ],
        connections: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [4, 6]],
    },
    {
        // Inspired by Cassiopeia (W shape)
        name: 'throne',
        stars: [
            { x: 20, y: 45, magnitude: 1 },
            { x: 35, y: 35, magnitude: 2 },
            { x: 50, y: 50, magnitude: 1 },
            { x: 65, y: 35, magnitude: 2 },
            { x: 80, y: 45, magnitude: 1 },
        ],
        connections: [[0, 1], [1, 2], [2, 3], [3, 4]],
    },
    {
        // Inspired by Cygnus (Northern Cross)
        name: 'cross',
        stars: [
            { x: 50, y: 20, magnitude: 1 },
            { x: 50, y: 40, magnitude: 2 },
            { x: 50, y: 55, magnitude: 1 },
            { x: 50, y: 75, magnitude: 2 },
            { x: 30, y: 48, magnitude: 2 },
            { x: 70, y: 48, magnitude: 2 },
        ],
        connections: [[0, 1], [1, 2], [2, 3], [4, 2], [2, 5]],
    },
    {
        // Inspired by Lyra (parallelogram with bright star)
        name: 'harp',
        stars: [
            { x: 50, y: 25, magnitude: 1 }, // Vega
            { x: 42, y: 45, magnitude: 2 },
            { x: 58, y: 45, magnitude: 2 },
            { x: 38, y: 65, magnitude: 3 },
            { x: 62, y: 65, magnitude: 3 },
        ],
        connections: [[0, 1], [0, 2], [1, 3], [2, 4], [3, 4], [1, 2]],
    },
    {
        // Inspired by Corona Borealis (arc/crown)
        name: 'crown',
        stars: [
            { x: 25, y: 55, magnitude: 2 },
            { x: 35, y: 40, magnitude: 2 },
            { x: 50, y: 35, magnitude: 1 },
            { x: 65, y: 40, magnitude: 2 },
            { x: 75, y: 55, magnitude: 2 },
        ],
        connections: [[0, 1], [1, 2], [2, 3], [3, 4]],
    },
    {
        // Inspired by Triangulum
        name: 'triangle',
        stars: [
            { x: 50, y: 25, magnitude: 1 },
            { x: 30, y: 65, magnitude: 2 },
            { x: 70, y: 65, magnitude: 2 },
        ],
        connections: [[0, 1], [1, 2], [2, 0]],
    },
    {
        // Inspired by Aquila (eagle/arrow shape)
        name: 'arrow',
        stars: [
            { x: 50, y: 30, magnitude: 1 },
            { x: 40, y: 45, magnitude: 2 },
            { x: 60, y: 45, magnitude: 2 },
            { x: 50, y: 55, magnitude: 1 },
            { x: 50, y: 75, magnitude: 2 },
        ],
        connections: [[0, 1], [0, 2], [1, 3], [2, 3], [3, 4]],
    },
    {
        // Inspired by Gemini (two figures)
        name: 'twins',
        stars: [
            { x: 35, y: 25, magnitude: 1 },
            { x: 65, y: 28, magnitude: 1 },
            { x: 38, y: 45, magnitude: 2 },
            { x: 62, y: 48, magnitude: 2 },
            { x: 42, y: 68, magnitude: 2 },
            { x: 58, y: 70, magnitude: 2 },
        ],
        connections: [[0, 2], [2, 4], [1, 3], [3, 5], [2, 3]],
    },
];

function generateConstellation(): {
    stars: Array<StarPoint & { id: number; jitterX: number; jitterY: number; delay: number }>;
    connections: [number, number][];
    rotation: number;
} {
    // Pick a random template
    const template = CONSTELLATION_TEMPLATES[Math.floor(Math.random() * CONSTELLATION_TEMPLATES.length)];

    // Random rotation (0, 90, 180, or 270 degrees, plus slight variance)
    const baseRotation = Math.floor(Math.random() * 4) * 90;
    const rotation = baseRotation + (Math.random() - 0.5) * 30;

    // Add slight jitter to each star position and random animation delays
    const stars = template.stars.map((star, i) => ({
        ...star,
        id: i,
        jitterX: (Math.random() - 0.5) * 6,
        jitterY: (Math.random() - 0.5) * 6,
        delay: Math.random() * 0.8,
    }));

    return {
        stars,
        connections: template.connections,
        rotation,
    };
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
    const constellation = useMemo(() => generateConstellation(), []);

    const starVariants = {
        hidden: { opacity: 0, scale: 0 },
        visible: (delay: number) => ({
            opacity: 1,
            scale: 1,
            transition: {
                delay: 0.2 + delay * 0.5,
                duration: 0.6,
                ease: [0.23, 1, 0.32, 1],
            },
        }),
    };

    const lineVariants = {
        hidden: { pathLength: 0, opacity: 0 },
        visible: (delay: number) => ({
            pathLength: 1,
            opacity: 1,
            transition: {
                delay: 0.5 + delay * 0.15,
                duration: 0.8,
                ease: "easeOut",
            },
        }),
    };

    return (
        <motion.div
            className="empty-state"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            <div className="empty-state__cosmos">
                {/* Subtle background glow */}
                <div className="empty-state__glow" />

                <svg
                    viewBox="0 0 100 100"
                    className="empty-state__svg"
                    aria-hidden="true"
                    style={{ transform: `rotate(${constellation.rotation}deg)` }}
                >
                    {/* Constellation lines */}
                    <g className="empty-state__lines">
                        {constellation.connections.map(([from, to], i) => {
                            const star1 = constellation.stars[from];
                            const star2 = constellation.stars[to];
                            return (
                                <motion.line
                                    key={`${from}-${to}`}
                                    x1={star1.x + star1.jitterX}
                                    y1={star1.y + star1.jitterY}
                                    x2={star2.x + star2.jitterX}
                                    y2={star2.y + star2.jitterY}
                                    className="empty-state__line"
                                    variants={lineVariants}
                                    initial="hidden"
                                    animate="visible"
                                    custom={i}
                                />
                            );
                        })}
                    </g>

                    {/* Stars */}
                    <g className="empty-state__stars">
                        {constellation.stars.map((star) => (
                            <motion.circle
                                key={star.id}
                                cx={star.x + star.jitterX}
                                cy={star.y + star.jitterY}
                                r={star.magnitude === 1 ? 1.8 : star.magnitude === 2 ? 1.3 : 0.9}
                                className={`empty-state__star empty-state__star--mag${star.magnitude}`}
                                variants={starVariants}
                                initial="hidden"
                                animate="visible"
                                custom={star.delay}
                                style={{ '--twinkle-delay': `${star.delay * 2}s` } as React.CSSProperties}
                            />
                        ))}
                    </g>
                </svg>
            </div>

            <motion.div
                className="empty-state__content"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
            >
                <h3 className="empty-state__title">{title}</h3>

                {description && (
                    <p className="empty-state__description">{description}</p>
                )}

                {action && (
                    <div className="empty-state__action">{action}</div>
                )}
            </motion.div>
        </motion.div>
    );
}