import { useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Users, MapPin, Flag, FileText, Calendar } from 'lucide-react';
import './EntityReferenceSummary.css';

export type EntityType = 'character' | 'location' | 'faction' | 'note' | 'session';

export interface ReferencedEntity {
    id: string;
    name: string;
    type: EntityType;
    accessCount: number;
}

export interface EntityReferenceSummaryProps {
    entities: ReferencedEntity[];
    onEntityClick?: (entityId: string) => void;
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

const ENTITY_TYPE_CONFIG: Record<EntityType, {
    icon: typeof Users;
    label: string;
    colorVar: string;
}> = {
    character: { icon: Users, label: 'Characters', colorVar: '--entity-character' },
    location: { icon: MapPin, label: 'Locations', colorVar: '--entity-location' },
    faction: { icon: Flag, label: 'Factions', colorVar: '--entity-faction' },
    note: { icon: FileText, label: 'Notes', colorVar: '--entity-note' },
    session: { icon: Calendar, label: 'Sessions', colorVar: '--entity-session' }
};

// Order for display
const TYPE_ORDER: EntityType[] = ['character', 'location', 'faction', 'note', 'session'];

interface EntityTypeGroupProps {
    type: EntityType;
    entities: ReferencedEntity[];
    onEntityClick?: (entityId: string) => void;
}

function EntityTypeGroup({ type, entities, onEntityClick }: EntityTypeGroupProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const config = ENTITY_TYPE_CONFIG[type];
    const Icon = config.icon;
    const groupId = `entity-group-${type}`;
    const contentId = `entity-group-content-${type}`;

    const handleToggle = useCallback(() => {
        setIsExpanded(prev => !prev);
    }, []);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleToggle();
        }
    }, [handleToggle]);

    return (
        <div className="entity-group" style={{ '--group-color': `var(${config.colorVar})` } as React.CSSProperties}>
            <button
                type="button"
                className="entity-group__header"
                onClick={handleToggle}
                onKeyDown={handleKeyDown}
                aria-expanded={isExpanded}
                aria-controls={contentId}
                id={groupId}
            >
                <ChevronRight
                    size={14}
                    className={`entity-group__chevron ${isExpanded ? 'entity-group__chevron--expanded' : ''}`}
                    aria-hidden="true"
                />
                <Icon size={16} className="entity-group__icon" aria-hidden="true" />
                <span className="entity-group__label">{config.label}</span>
                <span className="entity-group__count">{entities.length}</span>
            </button>

            <div
                id={contentId}
                className={`entity-group__content ${isExpanded ? 'entity-group__content--expanded' : ''}`}
                role="region"
                aria-labelledby={groupId}
            >
                <div className="entity-group__content-inner">
                    <ul className="entity-group__list">
                        {entities.map((entity) => (
                            <li key={entity.id} className="entity-group__item">
                                {onEntityClick ? (
                                    <button
                                        type="button"
                                        className="entity-group__entity-button"
                                        onClick={() => onEntityClick(entity.id)}
                                    >
                                        <span className="entity-group__entity-name">{entity.name}</span>
                                        {entity.accessCount > 1 && (
                                            <span className="entity-group__access-count">
                                                {entity.accessCount}×
                                            </span>
                                        )}
                                    </button>
                                ) : (
                                    <span className="entity-group__entity-text">
                                        <span className="entity-group__entity-name">{entity.name}</span>
                                        {entity.accessCount > 1 && (
                                            <span className="entity-group__access-count">
                                                {entity.accessCount}×
                                            </span>
                                        )}
                                    </span>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}

export function EntityReferenceSummary({
    entities,
    onEntityClick
}: EntityReferenceSummaryProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    // Group entities by type
    const groupedEntities = useMemo(() => {
        const groups: Partial<Record<EntityType, ReferencedEntity[]>> = {};

        for (const entity of entities) {
            if (!groups[entity.type]) {
                groups[entity.type] = [];
            }
            groups[entity.type]!.push(entity);
        }

        // Sort each group by access count (most accessed first)
        for (const type of Object.keys(groups) as EntityType[]) {
            groups[type]!.sort((a, b) => b.accessCount - a.accessCount);
        }

        return groups;
    }, [entities]);

    // Get types that have entities, in display order
    const activeTypes = useMemo(() => {
        return TYPE_ORDER.filter(type => groupedEntities[type]?.length);
    }, [groupedEntities]);

    const totalCount = entities.length;
    const hasEntities = totalCount > 0;

    const handleToggle = useCallback(() => {
        setIsExpanded(prev => !prev);
    }, []);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleToggle();
        }
    }, [handleToggle]);

    return (
        <motion.section
            className="entity-summary"
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
        >
            <button
                type="button"
                className="entity-summary__header"
                onClick={handleToggle}
                onKeyDown={handleKeyDown}
                aria-expanded={isExpanded}
                aria-controls="entity-summary-content"
            >
                <ChevronRight
                    size={16}
                    className={`entity-summary__chevron ${isExpanded ? 'entity-summary__chevron--expanded' : ''}`}
                    aria-hidden="true"
                />
                <span className="entity-summary__title">Entities Referenced</span>
                <span className="entity-summary__badge">
                    {totalCount}
                </span>
            </button>

            <div
                id="entity-summary-content"
                className={`entity-summary__content ${isExpanded ? 'entity-summary__content--expanded' : ''}`}
            >
                <div className="entity-summary__content-inner">
                    {hasEntities ? (
                        <div className="entity-summary__groups">
                            {activeTypes.map(type => (
                                <EntityTypeGroup
                                    key={type}
                                    type={type}
                                    entities={groupedEntities[type]!}
                                    onEntityClick={onEntityClick}
                                />
                            ))}
                        </div>
                    ) : (
                        <p className="entity-summary__empty" role="status">
                            No entities referenced this session.
                        </p>
                    )}
                </div>
            </div>
        </motion.section>
    );
}