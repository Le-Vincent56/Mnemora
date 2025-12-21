import { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Search } from 'lucide-react';
import { Entity } from '@/data/mockData'; import { EntityTypeIcon } from '@/components/entity/EntityTypeIcon';
import { SessionTimer } from '@/components/session/SessionTimer';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/Button';
import './SearchPortal.css';

interface SearchPortalProps {
    query: string;
    setQuery: (query: string) => void;
    results: Entity[];
    isSearching: boolean;
    clearSearch: () => void;
    onEntityClick: (entity: Entity, event?: React.MouseEvent) => void;
    timerVisible: boolean;
    onToggleTimer: () => void;
}

// Fixed constellation positions - 7 dots arranged in a subtle arc pattern
// Positioned to frame the search input without competing with it
const CONSTELLATION_DOTS = [
    { x: 8, y: 25, size: 2.5, delay: 0 },
    { x: 15, y: 12, size: 2, delay: 0.1 },
    { x: 35, y: 6, size: 3, delay: 0.15 },
    { x: 65, y: 8, size: 2.5, delay: 0.2 },
    { x: 85, y: 14, size: 2, delay: 0.25 },
    { x: 92, y: 28, size: 2.5, delay: 0.3 },
    { x: 50, y: 4, size: 1.5, delay: 0.35 },
];

// Motion variants
const portalVariants: Variants = {
    resting: {
        boxShadow: '0 1px 2px rgba(15, 23, 42, 0.05), 0 1px 3px rgba(15, 23, 42, 0.07)',
    },
    awakened: {
        boxShadow: [
            '0 0 0 1px rgba(92, 122, 138, 0.15), 0 0 20px rgba(92, 122, 138, 0.08), 0 0 40px rgba(92, 122, 138, 0.04)',
            '0 0 0 1px rgba(92, 122, 138, 0.2), 0 0 25px rgba(92, 122, 138, 0.1), 0 0 50px rgba(92, 122, 138, 0.05)',
            '0 0 0 1px rgba(92, 122, 138, 0.15), 0 0 20px rgba(92, 122, 138, 0.08), 0 0 40px rgba(92, 122, 138, 0.04)',
        ],
        transition: {
            boxShadow: {
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
            },
        },
    },
};

const glowVariants: Variants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: {
            duration: 0.4,
            ease: [0.23, 1, 0.32, 1],
        },
    },
};

const dotVariants: Variants = {
    hidden: { opacity: 0, scale: 0 },
    visible: (delay: number) => ({
        opacity: [0, 0.7, 0.5],
        scale: 1,
        transition: {
            delay: delay,
            duration: 0.5,
            ease: [0.23, 1, 0.32, 1],
            opacity: {
                delay: delay, duration: 0.5,
                times: [0, 0.6, 1],
            },
        },
    }),
};

const resultItemVariants: Variants = {
    hidden: { opacity: 0, y: 12 },  // Surface from BELOW (memory surfacing)
    visible: (index: number) => ({
        opacity: 1,
        y: 0,
        transition: {
            delay: index * 0.055, // 55ms stagger per design spec
            duration: 0.35,
            ease: [0.23, 1, 0.32, 1],
        },
    }),
    exit: {
        opacity: 0,
        y: 8,  // Exit downward (receding memory)
        transition: {
            duration: 0.2,
            ease: [0.4, 0, 1, 1],
        },
    },
};

const resultsContainerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.055,  // 55ms per design spec
            delayChildren: 0.1,
        },
    },
    exit: {
        opacity: 0,
        transition: {
            duration: 0.2,
        },
    },
};

export function SearchPortal({
    query,
    setQuery,
    results,
    isSearching,
    clearSearch,
    onEntityClick,
    timerVisible,
    onToggleTimer,
}: SearchPortalProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [isFocused, setIsFocused] = useState(false);
    const portalRef = useRef<HTMLDivElement>(null);

    // ⌘K keyboard shortcut
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                inputRef.current?.focus();
            }
            // Escape to blur when focused
            if (e.key === 'Escape' && isFocused) {
                inputRef.current?.blur();
                if (!query) {
                    clearSearch();
                }
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isFocused, query, clearSearch]);

    const handleFocus = useCallback(() => {
        setIsFocused(true);
    }, []);

    const handleBlur = useCallback(() => {
        // Small delay to allow click events on results
        setTimeout(() => {
            setIsFocused(false);
        }, 150);
    }, []);

    const isAwakened = isFocused || isSearching;

    return (
        <div className="search-portal-wrapper">
            <motion.div
                ref={portalRef}
                className={`search-portal ${isAwakened ? 'search-portal--awakened' : ''}`}
                variants={portalVariants}
                initial="resting"
                animate={isAwakened ? 'awakened' : 'resting'}
            >
                {/* Inner glow layer */}
                <AnimatePresence>
                    {isAwakened && (
                        <motion.div
                            className="search-portal__glow"
                            variants={glowVariants}
                            initial="hidden"
                            animate="visible"
                            exit="hidden"
                        />
                    )}
                </AnimatePresence>

                {/* Constellation dots */}
                <div className="search-portal__constellation" aria-hidden="true">
                    <AnimatePresence>
                        {isAwakened &&
                            CONSTELLATION_DOTS.map((dot, index) => (
                                <motion.span
                                    key={index}
                                    className="search-portal__dot"
                                    style={{
                                        left: `${dot.x}%`,
                                        top: `${dot.y}%`,
                                        width: dot.size,
                                        height: dot.size,
                                    }}
                                    variants={dotVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="hidden" custom={dot.delay}
                                />))}
                    </AnimatePresence>
                </div>

                {/* Search input row */}
                <div className="search-portal__input-row">
                    <Search
                        size={20}
                        className={`search-portal__icon ${isAwakened ? 'search-portal__icon--awakened' : ''}`}
                    />
                    <input
                        ref={inputRef}
                        type="text"
                        className="search-portal__input"
                        placeholder="Search your world..." value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                    />
                    <SessionTimer visible={timerVisible} onToggleVisible={onToggleTimer} />
                    <motion.kbd
                        className="search-portal__shortcut"
                        animate={isAwakened
                            ? {
                                opacity: [0.6, 0.8, 0.6],
                                transition: { duration: 2, repeat: Infinity },
                            } : { opacity: 1 }
                        }                                                            >
                        ⌘K
                    </motion.kbd>
                </div>
            </motion.div>                                                                                                                     {/* Results dropdown - surfaces like memories */}
            <AnimatePresence mode="wait">
                {isSearching && (
                    <motion.div
                        className="search-portal__results"
                        variants={resultsContainerVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                    >
                        <div className="search-portal__results-header">
                            <span className="search-portal__results-count">
                                {results.length > 0
                                    ? `${results.length} ${results.length === 1 ? 'memory' : 'memories'} found`
                                    : 'No memories found'}
                            </span>
                            <button className="search-portal__results-clear" onClick={clearSearch}>
                                Clear
                            </button>
                        </div>

                        {results.length > 0 ? (
                            <div className="search-portal__results-list">
                                {results.map((entity, index) => (
                                    <motion.div
                                        key={entity.id}
                                        className="search-portal__result-item"
                                        data-type={entity.type}
                                        variants={resultItemVariants}
                                        custom={index}
                                        onClick={(e) => onEntityClick(entity, e)}
                                    >
                                        <EntityTypeIcon type={entity.type} size={18} className="entity-icon" />
                                        <div className="search-portal__result-content">
                                            <span className="search-portal__result-name">
                                                {entity.name}
                                            </span>
                                            <span className="search-portal__result-preview">
                                                {entity.description.slice(0, 60)}...
                                            </span>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="search-portal__empty">
                                <EmptyState
                                    title="No memories found"
                                    description={`Nothing matches "${query}". Try different words or check for typos.`}
                                    action={
                                        <Button variant="ghost" onClick={clearSearch}>
                                            Clear search
                                        </Button>
                                    }
                                />
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}