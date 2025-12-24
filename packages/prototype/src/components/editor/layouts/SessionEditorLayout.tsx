import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Star, Sparkles, ChevronDown, ChevronUp, X } from 'lucide-react';
import { EditorTextArea } from '../EditorTextArea';
import './SessionEditorLayout.css';

interface QuickNote {
    id: string;
    content: string;
    capturedAt: string;
    linkedEntityIds: string[];
}

interface StarsAndWishes {
    stars: string[];
    wishes: string[];
}

interface SessionEditorLayoutProps {
    prepNotes: string;
    onPrepNotesChange: (value: string) => void;
    quickNotes: QuickNote[];
    starsAndWishes?: StarsAndWishes;
    onStarsAndWishesChange?: (value: StarsAndWishes) => void;
    hasStarsAndWishes: boolean;
    focusedSection: string | null;
    onFocusChange: (section: string | null) => void;
}

function formatTimestamp(isoString: string): string {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function SessionEditorLayout({
    prepNotes,
    onPrepNotesChange,
    quickNotes,
    starsAndWishes,
    onStarsAndWishesChange,
    hasStarsAndWishes,
    focusedSection,
    onFocusChange,
}: SessionEditorLayoutProps) {
    const [isTimelineExpanded, setIsTimelineExpanded] = useState(true);
    const [isStarsWishesExpanded, setIsStarsWishesExpanded] = useState(true);
    const [newStar, setNewStar] = useState('');
    const [newWish, setNewWish] = useState('');

    const handleAddStar = () => {
        if (!newStar.trim() || !onStarsAndWishesChange) return;
        onStarsAndWishesChange({
            ...starsAndWishes!,
            stars: [...(starsAndWishes?.stars || []), newStar.trim()]
        });
        setNewStar('');
    };

    const handleAddWish = () => {
        if (!newWish.trim() || !onStarsAndWishesChange) return;
        onStarsAndWishesChange({
            ...starsAndWishes!,
            wishes: [...(starsAndWishes?.wishes || []), newWish.trim()]
        });
        setNewWish('');
    };

    const handleRemoveStar = (index: number) => {
        if (!onStarsAndWishesChange) return;
        onStarsAndWishesChange({
            ...starsAndWishes!,
            stars: starsAndWishes!.stars.filter((_, i) => i !== index)
        });
    };

    const handleRemoveWish = (index: number) => {
        if (!onStarsAndWishesChange) return;
        onStarsAndWishesChange({
            ...starsAndWishes!,
            wishes: starsAndWishes!.wishes.filter((_, i) => i !== index)
        });
    };

    return (
        <div className="session-layout">
            {/* Prep Notes - The Blank Canvas */}
            <section
                className={`session-layout__section session-layout__section--prep ${focusedSection && focusedSection !== 'prepNotes'
                        ? 'session-layout__section--dimmed'
                        : ''
                    }`}
            >
                <div className="session-layout__section-header">
                    <span className="session-layout__section-label">Prep Notes</span>
                    <span className="session-layout__section-hint">Your pre-game planning</span>
                </div>
                <div className="session-layout__prep-canvas">
                    <EditorTextArea
                        value={prepNotes}
                        onChange={onPrepNotesChange}
                        entityType="session"
                        field="prepNotes"
                        placeholder="What do you need to prepare for this session? Plot hooks, NPC motivations, encounter ideas..."
                        onFocus={() => onFocusChange('prepNotes')}
                        onBlur={() => onFocusChange(null)}
                    />
                </div>
            </section>

            {/* Temporal Divider */}
            <div className="session-layout__temporal-divider">
                <div className="session-layout__divider-line" />
                <span className="session-layout__divider-label">Session Memories</span>
                <div className="session-layout__divider-line" />
            </div>

            {/* Session Notes Timeline */}
            <section className="session-layout__section session-layout__section--timeline">
                <button
                    className="session-layout__section-toggle"
                    onClick={() => setIsTimelineExpanded(!isTimelineExpanded)}
                    aria-expanded={isTimelineExpanded}
                >
                    <div className="session-layout__toggle-left">
                        <Clock size={14} className="session-layout__toggle-icon" />
                        <span className="session-layout__section-label">
                            Quick Notes
                        </span>
                        {quickNotes.length > 0 && (
                            <span className="session-layout__count-badge">
                                {quickNotes.length}
                            </span>
                        )}
                    </div>
                    {isTimelineExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                <AnimatePresence initial={false}>
                    {isTimelineExpanded && (
                        <motion.div
                            className="session-layout__timeline"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                        >
                            {quickNotes.length === 0 ? (
                                <div className="session-layout__empty-state">
                                    <div className="session-layout__constellation">
                                        <span className="session-layout__star" style={{ left: '20%', top: '30%' }} />
                                        <span className="session-layout__star" style={{ left: '45%', top: '15%' }} />
                                        <span className="session-layout__star" style={{ left: '70%', top: '40%' }} />
                                        <span className="session-layout__star" style={{ left: '30%', top: '60%' }} />
                                    </div>
                                    <p className="session-layout__empty-text">
                                        No notes captured during this session
                                    </p>
                                    <p className="session-layout__empty-hint">
                                        Press <kbd>N</kbd> during play to capture a thought
                                    </p>
                                </div>
                            ) : (
                                <ul className="session-layout__notes-list">
                                    {quickNotes.map((note) => (
                                        <li
                                            key={note.id}
                                            className="session-layout__note-item"
                                        >
                                            <span className="session-layout__note-time">
                                                {formatTimestamp(note.capturedAt)}
                                            </span>
                                            <span className="session-layout__note-content">
                                                {note.content}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </section>

            {/* Stars & Wishes (conditional) */}
            {hasStarsAndWishes && starsAndWishes && (
                <section className="session-layout__section session-layout__section--feedback">
                    <button
                        className="session-layout__section-toggle"
                        onClick={() => setIsStarsWishesExpanded(!isStarsWishesExpanded)}
                        aria-expanded={isStarsWishesExpanded}
                    >
                        <div className="session-layout__toggle-left">
                            <Star size={14} className="session-layout__toggle-icon session-layout__toggle-icon--gold" />
                            <span className="session-layout__section-label">
                                Stars & Wishes
                            </span>
                        </div>
                        {isStarsWishesExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>

                    <AnimatePresence initial={false}>
                        {isStarsWishesExpanded && (
                            <motion.div
                                className="session-layout__feedback-content"
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                            >
                                {/* Stars */}
                                <div className="session-layout__feedback-group">
                                    <div className="session-layout__feedback-header">
                                        <Star size={14} className="session-layout__feedback-icon session-layout__feedback-icon--star" />
                                        <span className="session-layout__feedback-label">What shone brightest?</span>
                                    </div>

                                    <ul className="session-layout__feedback-list">
                                        {starsAndWishes.stars.map((star, index) => (
                                            <li key={index} className="session-layout__feedback-item">
                                                <span className="session-layout__feedback-text">{star}</span>
                                                <button
                                                    className="session-layout__feedback-remove"
                                                    onClick={() => handleRemoveStar(index)}
                                                    aria-label="Remove star"
                                                >
                                                    <X size={12} />
                                                </button>
                                            </li>
                                        ))}
                                    </ul>

                                    <div className="session-layout__feedback-input-row">
                                        <input
                                            type="text"
                                            className="session-layout__feedback-input"
                                            value={newStar}
                                            onChange={(e) => setNewStar(e.target.value)}
                                            placeholder="Add a star..."
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddStar()}
                                        />
                                        <button
                                            className="session-layout__feedback-add"
                                            onClick={handleAddStar}
                                            disabled={!newStar.trim()}
                                        >
                                            Add
                                        </button>
                                    </div>
                                </div>

                                {/* Wishes */}
                                <div className="session-layout__feedback-group">
                                    <div className="session-layout__feedback-header">
                                        <Sparkles size={14} className="session-layout__feedback-icon session-layout__feedback-icon--wish" />
                                        <span className="session-layout__feedback-label">What calls to you?</span>
                                    </div>

                                    <ul className="session-layout__feedback-list">
                                        {starsAndWishes.wishes.map((wish, index) => (
                                            <li key={index} className="session-layout__feedback-item">
                                                <span className="session-layout__feedback-text">{wish}</span>
                                                <button
                                                    className="session-layout__feedback-remove"
                                                    onClick={() => handleRemoveWish(index)}
                                                    aria-label="Remove wish"
                                                >
                                                    <X size={12} />
                                                </button>
                                            </li>
                                        ))}
                                    </ul>

                                    <div className="session-layout__feedback-input-row">
                                        <input
                                            type="text"
                                            className="session-layout__feedback-input"
                                            value={newWish}
                                            onChange={(e) => setNewWish(e.target.value)}
                                            placeholder="Add a wish..."
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddWish()}
                                        />
                                        <button
                                            className="session-layout__feedback-add"
                                            onClick={handleAddWish}
                                            disabled={!newWish.trim()}
                                        >
                                            Add
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </section>
            )}
        </div>
    );
}
