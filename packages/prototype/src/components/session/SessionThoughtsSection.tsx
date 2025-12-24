import { useCallback } from 'react';
import { motion } from 'framer-motion';
import { X, Sparkles } from 'lucide-react';
import './SessionThoughtsSection.css';

export interface QuickNote {
    id: string;
    content: string;
    timestamp: Date;
}

export interface SessionThoughtsSectionProps {
    quickNotes: QuickNote[];
    onRemoveNote: (id: string) => void;
    reflection: string;
    onReflectionChange: (value: string) => void;
}

const sectionVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.3,
            ease: [0.23, 1, 0.32, 1]
        }
    }
};

const noteVariants = {
    hidden: { opacity: 0, x: -8 },
    visible: {
        opacity: 1,
        x: 0,
        transition: {
            duration: 0.2,
            ease: [0.23, 1, 0.32, 1]
        }
    },
    exit: {
        opacity: 0,
        x: 8,
        transition: {
            duration: 0.15
        }
    }
};

function formatTime(date: Date): string {
    return date.toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
}

function truncateForAriaLabel(content: string, maxLength: number = 30): string {
    if (content.length <= maxLength) return content;
    return content.slice(0, maxLength).trim() + '...';
}

export function SessionThoughtsSection({
    quickNotes,
    onRemoveNote,
    reflection,
    onReflectionChange
}: SessionThoughtsSectionProps) {
    const hasNotes = quickNotes.length > 0;

    const handleRemoveNote = useCallback((id: string) => {
        onRemoveNote(id);
    }, [onRemoveNote]);

    return (
        <motion.section
            className="session-thoughts"
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            role="region"
            aria-labelledby="session-thoughts-heading"
        >
            <h3 id="session-thoughts-heading" className="session-thoughts__heading">
                Session Thoughts
            </h3>

            {hasNotes ? (
                <ul className="session-thoughts__notes">
                    {quickNotes.map((note) => (
                        <motion.li
                            key={note.id}
                            className="session-thoughts__note"
                            variants={noteVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            layout
                        >
                            <span className="session-thoughts__note-content">
                                {note.content}
                            </span>
                            <span className="session-thoughts__note-time">
                                {formatTime(note.timestamp)}
                            </span>
                            <button
                                type="button"
                                className="session-thoughts__note-remove"
                                onClick={() => handleRemoveNote(note.id)}
                                aria-label={`Remove note: ${truncateForAriaLabel(note.content)}`}
                            >
                                <X size={14} />
                            </button>
                        </motion.li>
                    ))}
                </ul>
            ) : (
                <div className="session-thoughts__empty">
                    <div className="session-thoughts__empty-constellation" aria-hidden="true">
                        <Sparkles size={24} />
                    </div>
                    <p className="session-thoughts__empty-text">
                        No thoughts captured this session
                    </p>
                </div>
            )}

            <div className="session-thoughts__reflection">
                <label
                    htmlFor="session-reflection"
                    className="session-thoughts__reflection-label"
                >
                    Final Thoughts
                    <span className="session-thoughts__optional">(optional)</span>
                </label>
                <textarea
                    id="session-reflection"
                    className="session-thoughts__reflection-input"
                    value={reflection}
                    onChange={(e) => onReflectionChange(e.target.value)}
                    placeholder="What happened? What surprised you? What do you want to remember?"
                    rows={3}
                    aria-label="Session reflection - optional notes about what happened"
                />
            </div>
        </motion.section>
    );
}