import { Entity } from '@/data/mockData';
import { EntityTypeIcon } from '@/components/entity/EntityTypeIcon';
import './EntityListView.css';

interface EntityListViewProps {
    entities: Entity[];
    onEntityClick: (entity: Entity, event: React.MouseEvent) => void;
    selectedEntityId?: string;
}

function formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 14) return '1 week ago';
    return `${Math.floor(diffDays / 7)} weeks ago`;
}

export function EntityListView({
    entities,
    onEntityClick,
    selectedEntityId,
}: EntityListViewProps) {
    return (
        <div className="entity-list" role="list">
            {entities.map((entity, index) => (
                <button
                    key={entity.id}
                    className={`entity-list__row ${selectedEntityId === entity.id ? 'entity-list__row--selected' : ''}`}
                    data-type={entity.type}
                    onClick={(e) => onEntityClick(entity, e)}
                    style={{ animationDelay: `${0.03 + index * 0.025}s` }}
                    role="listitem"
                    aria-label={`${entity.name}, ${entity.type}`}
                >
                    <span className="entity-list__type-line" aria-hidden="true" />

                    <span className="entity-list__icon">
                        <EntityTypeIcon type={entity.type} size={18} />
                    </span>

                    <span className="entity-list__name">{entity.name}</span>

                    <span className="entity-list__tags">
                        {entity.tags.slice(0, 3).join(', ')}
                        {entity.tags.length > 3 && ` +${entity.tags.length - 3}`}
                    </span>

                    <span className="entity-list__time">
                        {formatRelativeTime(entity.modifiedAt)}
                    </span>
                </button>
            ))}
        </div>
    );
}