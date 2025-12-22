import { Entity } from '@/data/mockData';
import { EntityTypeIcon } from '@/components/entity/EntityTypeIcon';
import { StartSessionAction } from './StartSessionAction';
import './EntityCard.css';

interface EntityCardProps {
    entity: Entity;
    onClick: (entity: Entity, event: React.MouseEvent) => void;
    index?: number;
    // Session-specific props
    activeSessionID?: string | null;
    onStartSession?: (entity: Entity) => void;
}

export function EntityCard({
    entity,
    onClick,
    index = 0,
    activeSessionID,
    onStartSession,
}: EntityCardProps) {
    const previewText =
        entity.description.length > 120
            ? entity.description.slice(0, 120).trim() + '...'
            : entity.description;

    const isSessionEntity = entity.type === 'session';
    const isActiveSession = isSessionEntity && entity.id === activeSessionID;

    const handleStartSession = (e: React.MouseEvent) => {
        e.stopPropagation();
        onStartSession?.(entity);
    };

    return (
        <button
            className={`entity-card ${isActiveSession ? 'entity-card--active-session' : ''}`}
            data-type={entity.type}
            onClick={(e) => onClick(entity, e)}
            style={{ animationDelay: `${0.05 + index * 0.04}s` }}
            aria-label={`${entity.name}, ${entity.type}`}
        >
            <span className="entity-card__accent" aria-hidden="true" />
            <span className="entity-card__shimmer" aria-hidden="true" />

            <div className="entity-card__header">
                <span className="entity-card__type-icon">
                    <EntityTypeIcon type={entity.type} size={16} />
                </span>
                {entity.secrets && (
                    <span className="entity-card__secret-indicator" title="Has secrets">
                        ✦
                    </span>
                )}
            </div>

            <h3 className="entity-card__name text-display-sm">{entity.name}</h3>
            <p className="entity-card__preview">{previewText}</p>
            <span className="entity-card__divider" />

            <div className="entity-card__footer">
                <div className="entity-card__tags">
                    {entity.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="entity-card__tag">
                            {tag}
                        </span>
                    ))}
                    {entity.tags.length > 3 && (
                        <span className="entity-card__tag entity-card__tag--more">
                            +{entity.tags.length - 3}
                        </span>
                    )}
                </div>

                {isSessionEntity && onStartSession && (
                    <StartSessionAction
                        isActive={isActiveSession}
                        onStart={handleStartSession}
                    />
                )}
            </div>
        </button>
    );
}