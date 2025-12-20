import { EntityType } from '@/data/mockData';
import './Badge.css';

interface BadgeProps {
    type: EntityType;
    children?: React.ReactNode;
}

const typeLabels: Record<EntityType, string> = {
    character: 'Character',
    location: 'Location',
    faction: 'Faction',
    session: 'Session',
    note: 'Note',
};

export function Badge({ type, children }: BadgeProps) {
    return (
        <span className={`badge badge--${type}`}>
            {children ?? typeLabels[type]}
        </span>
    );
}