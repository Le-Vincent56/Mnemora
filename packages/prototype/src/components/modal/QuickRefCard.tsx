import { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Edit, Lock, ChevronLeft, ChevronRight } from 'lucide-react';
import { Entity } from '@/data/mockData';
import { EntityTypeIcon } from '@/components/entity/EntityTypeIcon';
import { Badge } from '@/components/ui/Badge';
import { Tag } from '@/components/common/Tag';
import { ConnectionChip } from '@/components/common/ConnectionChip';
import { Button } from '@/components/ui/Button';
import './QuickRefCard.css';

interface QuickRefCardProps {
    entity: Entity | null;
    onClose: () => void;
    onEdit?: (entity: Entity) => void;
    onNavigate: (id: string) => void;
    onPrev?: () => void;
    onNext?: () => void;
    hasPrev?: boolean;
    hasNext?: boolean;
    clickOrigin?: { x: number; y: number } | null;
}

export function QuickRefCard({
    entity,
    onClose,
    onEdit,
    onNavigate,
    onPrev,
    onNext,
    hasPrev = false,
    hasNext = false,
    clickOrigin,
}: QuickRefCardProps) {
    // Keyboard navigation
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        switch (e.key) {
            case 'Escape':
                onClose();
                break;
            case 'ArrowLeft':
                if (hasPrev && onPrev) onPrev();
                break;
            case 'ArrowRight':
                if (hasNext && onNext) onNext();
                break;
            case 'e':
            case 'E':
                if (entity && onEdit) onEdit(entity);
                break;
        }
    }, [onClose, onPrev, onNext, hasPrev, hasNext, entity, onEdit]);

    useEffect(() => {
        if (entity) {
            document.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [entity, handleKeyDown]);

    const getInitialAnimation = () => {
        if (clickOrigin) {
            const centerX = window.innerWidth / 2;
            const centerY = window.innerHeight / 2;
            return {
                opacity: 0,
                scale: 0.85,
                x: (clickOrigin.x - centerX) * 0.5,
                y: (clickOrigin.y - centerY) * 0.5,
            };
        }
        return { opacity: 0, scale: 0.96, x: 0, y: 8 };
    };

    return (
        <AnimatePresence>
            {entity && (
                <motion.div
                    className="quickref-backdrop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={onClose}
                >
                    {/* Card */}
                    <motion.div
                        className="quickref-card"
                        initial={getInitialAnimation()}
                        animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98, y: -8 }}
                        transition={{
                            duration: 0.35,
                            ease: [0.23, 1, 0.32, 1]
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <header className="quickref-card__header">
                            <div className="quickref-card__title-row">
                                <EntityTypeIcon type={entity.type} size={24} />
                                <h2 className="quickref-card__title">{entity.name}</h2>
                            </div>
                            <div className="quickref-card__actions">
                                {onEdit && (
                                    <Button variant="ghost" onClick={() => onEdit(entity)}>
                                        <Edit size={16} />
                                        Edit
                                    </Button>
                                )}
                                <Button variant="icon" onClick={onClose}>
                                    <X size={20} />
                                </Button>
                            </div>
                        </header>

                        {/* Badge */}
                        <div className="quickref-card__badge">
                            <Badge type={entity.type} />
                        </div>

                        {/* Content */}
                        <div className="quickref-card__content">
                            <p className="quickref-card__description">
                                {entity.description}
                            </p>

                            {/* Secrets */}
                            {entity.secrets && (
                                <div className="quickref-card__secrets">
                                    <div className="quickref-card__secrets-header">
                                        <Lock size={14} />
                                        <span>Secrets</span>
                                    </div>
                                    <p className="quickref-card__secrets-text">
                                        {entity.secrets}
                                    </p>
                                </div>
                            )}

                            {/* Tags */}
                            {entity.tags.length > 0 && (
                                <div className="quickref-card__tags">
                                    {entity.tags.map((tag) => (
                                        <Tag key={tag}>{tag}</Tag>
                                    ))}
                                </div>
                            )}

                            {/* Connections */}
                            {entity.connections.length > 0 && (
                                <div className="quickref-card__connections">
                                    <h3 className="quickref-card__section-title">Connections</h3>
                                    <div className="quickref-card__connections-list">
                                        {entity.connections.map((conn) => (
                                            <ConnectionChip
                                                key={conn.id}
                                                id={conn.id}
                                                name={conn.name}
                                                type={conn.type}
                                                onClick={onNavigate}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer Navigation */}
                        <footer className="quickref-card__footer">
                            <button
                                className="quickref-card__nav-btn"
                                onClick={onPrev}
                                disabled={!hasPrev}
                            >
                                <ChevronLeft size={16} />
                                Prev
                            </button>
                            <span className="quickref-card__nav-hint">
                                ← → to navigate · Esc to close
                            </span>
                            <button
                                className="quickref-card__nav-btn"
                                onClick={onNext}
                                disabled={!hasNext}
                            >
                                Next
                                <ChevronRight size={16} />
                            </button>
                        </footer>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}