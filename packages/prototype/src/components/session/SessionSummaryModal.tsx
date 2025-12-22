import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Users, MapPin, Flag, FileText, Copy, Save } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { SessionSummary } from '@/types/session';
import { formatDuration } from '@/hooks/useActiveSession';
import './SessionSummaryModal.css';

interface SessionSummaryModalProps {
    summary: SessionSummary | null;
    onClose: () => void;
    onCopyNotes: () => void;
    onSaveToSession: () => void;
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

// Group entities by type for display
function groupByType(entities: SessionSummary['entitiesAccessed']) {
    const groups: Record<string, typeof entities> = {
        character: [],
        location: [],
        faction: [],
        note: [],
    };

    entities.forEach((entity) => {
        if (groups[entity.entityType]) {
            groups[entity.entityType].push(entity);
        }
    });

    return groups;
}

const typeIcons: Record<string, React.ReactNode> = {
    character: <Users size={14} />,
    location: <MapPin size={14} />,
    faction: <Flag size={14} />,
    note: <FileText size={14} />,
};

const typeLabels: Record<string, string> = {
    character: 'Characters',
    location: 'Locations',
    faction: 'Factions',
    note: 'Notes',
};

export function SessionSummaryModal({
    summary,
    onClose,
    onCopyNotes,
    onSaveToSession,
}: SessionSummaryModalProps) {
    if (!summary) return null;

    const groupedEntities = groupByType(summary.entitiesAccessed);
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

                        {/* Entities by Type */}
                        {totalEntities > 0 && (
                            <div className="session-summary__entities">
                                <h3 className="session-summary__section-title">Referenced During Session</h3>
                                <div className="session-summary__entity-groups">
                                    {Object.entries(groupedEntities).map(([type, entities]) => {
                                        if (entities.length === 0) return null;
                                        return (
                                            <div key={type} className="session-summary__entity-group">
                                                <div className="session-summary__entity-type">
                                                    {typeIcons[type]}
                                                    <span>{typeLabels[type]}</span>
                                                    <span className="session-summary__entity-count">
                                                        {entities.length}
                                                    </span>
                                                </div>
                                                <ul className="session-summary__entity-list">
                                                    {entities
                                                        .sort((a, b) => b.accessCount - a.accessCount)
                                                        .map((entity) => (
                                                            <li key={entity.entityID}>
                                                                <span>{entity.entityName}</span>
                                                                <span className="session-summary__access-count">
                                                                    {entity.accessCount}×
                                                                </span>
                                                            </li>
                                                        ))}
                                                </ul>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

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