import { EntityTypeIcon } from '@/components/entity/EntityTypeIcon';
import { EntityType } from '@/data/mockData';
import './ConnectionChip.css';

interface ConnectionChipProps {
    id: string;
    name: string;
    type: EntityType;
    onClick: (id: string) => void;
}

export function ConnectionChip({ id, name, type, onClick }: ConnectionChipProps) {
    return (
        <button
            className="connection-chip entity-interactive"
            data-type={type}
            onClick={() => onClick(id)}
        >
            <EntityTypeIcon type={type} size={14} className="entity-icon" />
            <span className="connection-chip__name">{name}</span>
        </button>
    );
}