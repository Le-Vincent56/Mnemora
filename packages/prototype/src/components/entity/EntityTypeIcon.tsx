import { User, MapPin, Users, Calendar, FileText } from 'lucide-react';
import { EntityType } from '@/data/mockData';
import './EntityTypeIcon.css';

interface EntityTypeIconProps {
    type: EntityType;
    size?: number;
    className?: string;
}

export function EntityTypeIcon({ type, size = 16, className = '' }: EntityTypeIconProps) {
    const Icon = getIconForType(type);

    return (
        <span className={`entity-type-icon entity-type-icon--${type} ${className}`.trim()}>
            <Icon size={size} />
        </span>
    );
}

function getIconForType(type: EntityType) {
    switch (type) {
        case 'character':
            return User;
        case 'location':
            return MapPin;
        case 'faction':
            return Users;
        case 'session':
            return Calendar;
        case 'note':
            return FileText;
    }
}