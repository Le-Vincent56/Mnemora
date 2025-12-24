import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Sparkles, Plus, X } from 'lucide-react';
import './StarsAndWishesSection.css';

export interface StarsAndWishesSectionProps {
    isEnabled: boolean;
    stars: string[];
    wishes: string[];
    onAddStar: (star: string) => void;
    onRemoveStar: (index: number) => void;
    onAddWish: (wish: string) => void;
    onRemoveWish: (index: number) => void;
}

const sectionVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.3,
            ease: [0.23, 1, 0.32, 1],
            staggerChildren: 0.1
        }
    }
};

const columnVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.25,
            ease: [0.23, 1, 0.32, 1]
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: {
            duration: 0.2,
            ease: [0.23, 1, 0.32, 1]
        }
    },
    exit: {
        opacity: 0,
        scale: 0.95,
        transition: { duration: 0.15 }
    }
};

interface FeedbackColumnProps {
    type: 'star' | 'wish';
    items: string[];
    onAdd: (value: string) => void;
    onRemove: (index: number) => void;
}

function FeedbackColumn({ type, items, onAdd, onRemove }: FeedbackColumnProps) {
    const [inputValue, setInputValue] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const addButtonRef = useRef<HTMLButtonElement>(null);

    const isStar = type === 'star';
    const Icon = isStar ? Star : Sparkles;
    const headingText = isStar ? 'What Shone Brightest?' : 'What Calls to You?';
    const placeholder = isStar ? 'Something that worked well...' : 'Something you want more of...';
    const addLabel = isStar ? 'Add a star' : 'Add a wish';
    const headingId = `${type}-heading`;

    // Focus input when adding mode activates
    useEffect(() => {
        if (isAdding) {
            inputRef.current?.focus();
        }
    }, [isAdding]);

    const handleStartAdding = useCallback(() => {
        setIsAdding(true);
    }, []);

    const handleCancelAdding = useCallback(() => {
        setIsAdding(false);
        setInputValue('');
        addButtonRef.current?.focus();
    }, []);

    const handleSubmit = useCallback(() => {
        const trimmed = inputValue.trim();
        if (trimmed.length === 0) {
            handleCancelAdding();
            return;
        }

        onAdd(trimmed);
        setInputValue('');
        // Keep input focused for rapid entry
        inputRef.current?.focus();
    }, [inputValue, onAdd, handleCancelAdding]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSubmit();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            handleCancelAdding();
        }
    }, [handleSubmit, handleCancelAdding]);

    const handleRemove = useCallback((index: number) => {
        onRemove(index);
        // Focus add button after removal
        addButtonRef.current?.focus();
    }, [onRemove]);

    return (
        <motion.div
            className={`stars-wishes__column stars-wishes__column--${type}`}
            variants={columnVariants}
            role="region"
            aria-labelledby={headingId}
        >
            <h4 id={headingId} className="stars-wishes__column-heading">
                <Icon size={16} className="stars-wishes__column-icon" aria-hidden="true" />
                <span>{headingText}</span>
            </h4>

            <ul className="stars-wishes__list">
                <AnimatePresence mode="popLayout">
                    {items.map((item, index) => (
                        <motion.li
                            key={`${type}-${index}-${item.slice(0, 10)}`}
                            className="stars-wishes__item"
                            variants={itemVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            layout
                        >
                            <span className="stars-wishes__item-text">{item}</span>
                            <button
                                type="button"
                                className="stars-wishes__item-remove"
                                onClick={() => handleRemove(index)}
                                aria-label={`Remove ${type}: ${item.slice(0, 30)}${item.length > 30 ? '...' : ''}`}
                            >
                                <X size={14} />
                            </button>
                        </motion.li>
                    ))}
                </AnimatePresence>
            </ul>

            {isAdding ? (
                <div className="stars-wishes__input-wrapper">
                    <label htmlFor={`${type}-input`} className="sr-only">
                        {addLabel}
                    </label>
                    <input
                        ref={inputRef}
                        id={`${type}-input`}
                        type="text"
                        className="stars-wishes__input"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onBlur={() => {
                            // Small delay to allow click on submit
                            setTimeout(() => {
                                if (inputValue.trim() === '') {
                                    handleCancelAdding();
                                }
                            }, 150);
                        }}
                        placeholder={placeholder}
                        maxLength={200}
                    />
                </div>
            ) : (
                <button
                    ref={addButtonRef}
                    type="button"
                    className="stars-wishes__add"
                    onClick={handleStartAdding}
                >
                    <Plus size={14} />
                    <span>{addLabel}</span>
                </button>
            )}
        </motion.div>
    );
}

export function StarsAndWishesSection({
    isEnabled,
    stars,
    wishes,
    onAddStar,
    onRemoveStar,
    onAddWish,
    onRemoveWish
}: StarsAndWishesSectionProps) {
    // Don't render at all if tool is not enabled
    if (!isEnabled) {
        return null;
    }

    return (
        <motion.section
            className="stars-wishes"
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
        >
            <FeedbackColumn
                type="star"
                items={stars}
                onAdd={onAddStar}
                onRemove={onRemoveStar}
            />
            <FeedbackColumn
                type="wish"
                items={wishes}
                onAdd={onAddWish}
                onRemove={onRemoveWish}
            />
        </motion.section>
    );
}