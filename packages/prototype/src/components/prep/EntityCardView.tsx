import { Entity } from '@/data/mockData';
import { EntityCard } from './EntityCard';
import './EntityCardView.css';

interface EntityCardViewProps {
    entities: Entity[];
    onEntityClick: (entity: Entity, event: React.MouseEvent) => void;
    activeSessionID?: string | null;
    onStartSession?: (entity: Entity) => void;
}

export function EntityCardView({
    entities,
    onEntityClick,
    activeSessionID,
    onStartSession,
}: EntityCardViewProps) {
    return (
        <div className="entity-card-grid" role="list">
            {entities.map((entity, index) => (
                <EntityCard
                    key={entity.id}
                    entity={entity}
                    onClick={onEntityClick}
                    index={index}
                    activeSessionID={activeSessionID}
                    onStartSession={onStartSession}
                />
            ))}
        </div>
    );
}