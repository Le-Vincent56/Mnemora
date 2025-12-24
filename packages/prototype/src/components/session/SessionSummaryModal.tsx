import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, FileText, Copy, Save } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { SessionSummary } from '@/types/session';
import { formatDuration } from '@/hooks/useActiveSession';
import { SessionThoughtsSection, QuickNote } from './SessionThoughtsSection';
import { StarsAndWishesSection } from './StarsAndWishesSection';
import { EntityReferenceSummary, ReferencedEntity } from './EntityReferenceSummary';
import './SessionSummaryModal.css';

interface SessionSummaryModalProps {
    summary: SessionSummary | null;
    onClose: () => void;
    onCopyNotes: () => void;
    onSaveToSession: () => void;
    // Session thoughts
    quickNotes: QuickNote[];
    onRemoveNote: (id: string) => void;
    reflection: string;
    onReflectionChange: (value: string) => void;
    // Stars & Wishes (optional - only shown when enabled)
    isStarsWishesEnabled: boolean;
    stars: string[];
    wishes: string[];
    onAddStar: (star: string) => void;
    onRemoveStar: (index: number) => void;
    onAddWish: (wish: string) => void;
    onRemoveWish: (index: number) => void;
}

const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
};

const modalVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: {
            duration: 0.25,
            ease: [0.23, 1, 0.32, 1],
        },
    },
    exit: {
        opacity: 0,
        scale: 0.95,
        y: 20,
        transition: {
            duration: 0.15,
            ease: [0.4, 0, 1, 1],
        },
    },
};

export function SessionSummaryModal({
    summary,
    onClose,
    onCopyNotes,
    onSaveToSession,
    quickNotes,
    onRemoveNote,
    reflection,
    onReflectionChange,
    isStarsWishesEnabled,
    stars,
    wishes,
    onAddStar,
    onRemoveStar,
    onAddWish,
    onRemoveWish,
}: SessionSummaryModalProps) {
    // Map session access log to ReferencedEntity format
    const referencedEntities: ReferencedEntity[] = useMemo(() => {
        if (!summary) return [];
        return summary.entitiesAccessed.map(entity => ({
            id: entity.entityID,
            name: entity.entityName,
            type: entity.entityType,
            accessCount: entity.accessCount
        }));
    }, [summary]);

    if (!summary) return null;

    const totalEntities = summary.entitiesAccessed.length;

    return (
        <AnimatePresence>
            {summary && (
                <motion.div
                    className="session-summary-backdrop"
                    variants={backdropVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    onClick={onClose}
                >
                    <motion.div
                        className="session-summary-modal"
                        variants={modalVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="session-summary__header">
                            <div className="session-summary__title-group">
                                <h2 className="session-summary__title">Session Complete</h2>
                                <span className="session-summary__session-name">
                                    {summary.sessionName}
                                </span>
                            </div>
                            <button
                                className="session-summary__close"
                                onClick={onClose}
                                aria-label="Close"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Stats */}
                        <div className="session-summary__stats">
                            <div className="session-summary__stat">
                                <Clock size={16} />
                                <span className="session-summary__stat-value">
                                    {formatDuration(summary.totalDuration)}
                                </span>
                                <span className="session-summary__stat-label">Duration</span>
                            </div>
                            <div className="session-summary__stat">
                                <FileText size={16} />
                                <span className="session-summary__stat-value">{totalEntities}</span>
                                <span className="session-summary__stat-label">
                                    {totalEntities === 1 ? 'Entity' : 'Entities'} Referenced
                                </span>
                            </div>
                        </div>

                        {/* Session Thoughts (quick notes + reflection) */}
                        <div className="session-summary__section">
                            <SessionThoughtsSection
                                quickNotes={quickNotes}
                                onRemoveNote={onRemoveNote}
                                reflection={reflection}
                                onReflectionChange={onReflectionChange}
                            />
                        </div>

                        {/* Stars & Wishes (conditionally rendered) */}
                        {isStarsWishesEnabled && (
                            <div className="session-summary__section">
                                <StarsAndWishesSection
                                    isEnabled={isStarsWishesEnabled}
                                    stars={stars}
                                    wishes={wishes}
                                    onAddStar={onAddStar}
                                    onRemoveStar={onRemoveStar}
                                    onAddWish={onAddWish}
                                    onRemoveWish={onRemoveWish}
                                />
                            </div>
                        )}

                        {/* Entity Reference Summary */}
                        <div className="session-summary__section">
                            <EntityReferenceSummary
                                entities={referencedEntities}
                            />
                        </div>

                        {/* Generated Notes Preview */}
                        {summary.generatedNotes && (
                            <div className="session-summary__notes">
                                <h3 className="session-summary__section-title">Generated Notes</h3>
                                <pre className="session-summary__notes-content">
                                    {summary.generatedNotes}
                                </pre>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="session-summary__actions">
                            <Button variant="ghost" onClick={onCopyNotes}>
                                <Copy size={16} />
                                Copy Notes
                            </Button>
                            <Button onClick={onSaveToSession}>
                                <Save size={16} />
                                Save to Session
                            </Button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}