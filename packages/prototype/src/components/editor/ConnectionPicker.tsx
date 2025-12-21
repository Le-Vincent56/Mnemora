import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Search } from 'lucide-react';
import { Entity, EntityType } from '@/data/mockData';
import { EntityTypeIcon } from '@/components/entity/EntityTypeIcon';
import './ConnectionPicker.css';

interface ConnectionPickerProps {
    entities: Entity[];                 // All available entities
    excludeIds: string[];               // IDs to exclude (current entity + already connected)
    onSelect: (entity: Entity) => void; // Called when an entity is selected
    onClose: () => void;                // Called when picker should close
}

const ENTITY_TYPES: EntityType[] = ['character', 'location', 'faction', 'session', 'note'];

export function ConnectionPicker({
    entities,
    excludeIds,
    onSelect,
    onClose,
}: ConnectionPickerProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState<EntityType | 'all'>('all');
    const [highlightedIndex, setHighlightedIndex] = useState(0);

    const searchInputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    // Focus search input on mount
    useEffect(() => {
        searchInputRef.current?.focus();
    }, []);

    // Filter entities
    const filteredEntities = entities.filter(entity => {
        // Exclude specified IDs
        if (excludeIds.includes(entity.id)) return false;

        // Type filter
        if (typeFilter !== 'all' && entity.type !== typeFilter) return false;

        // Search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            const matchesName = entity.name.toLowerCase().includes(query);
            const matchesTags = entity.tags.some(tag =>
                tag.toLowerCase().includes(query)
            );
            if (!matchesName && !matchesTags) return false;
        }

        return true;
    });

    // Get counts per type for filter badges
    const availableEntities = entities.filter(e => !excludeIds.includes(e.id));
    const typeCounts = ENTITY_TYPES.reduce((acc, type) => {
        acc[type] = availableEntities.filter(e => e.type === type).length;
        return acc;
    }, {} as Record<EntityType, number>);

    // Reset highlight when filter changes
    useEffect(() => {
        setHighlightedIndex(0);
    }, [searchQuery, typeFilter]);

    // Scroll highlighted item into view
    useEffect(() => {
        const list = listRef.current;
        if (!list) return;

        const highlighted = list.children[highlightedIndex] as HTMLElement;
        if (highlighted) {
            highlighted.scrollIntoView({ block: 'nearest' });
        }
    }, [highlightedIndex]);

    const handleKeyDown = (e: KeyboardEvent) => {
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setHighlightedIndex(prev =>
                    Math.min(prev + 1, filteredEntities.length - 1)
                );
                break;

            case 'ArrowUp':
                e.preventDefault();
                setHighlightedIndex(prev => Math.max(prev - 1, 0));
                break;

            case 'Enter':
                e.preventDefault();
                if (filteredEntities[highlightedIndex]) {
                    onSelect(filteredEntities[highlightedIndex]);
                }
                break;

            case 'Escape':
                e.preventDefault();
                onClose();
                break;
        }
    };

    // Highlight matching text
    const highlightMatch = (text: string): React.ReactNode => {
        if (!searchQuery.trim()) return text;

        const query = searchQuery.toLowerCase();
        const index = text.toLowerCase().indexOf(query);

        if (index === -1) return text;

        return (
            <>
                {text.slice(0, index)}
                <span className="connection-picker__match">
                    {text.slice(index, index + searchQuery.length)}
                </span>
                {text.slice(index + searchQuery.length)}
            </>
        );
    };

    return (
        <div
            className="connection-picker"
            onKeyDown={handleKeyDown}
        >
            {/* Search Header */}
            <div className="connection-picker__header">
                <div className="connection-picker__search">
                    <Search size={16} className="connection-picker__search-icon" />
                    <input
                        ref={searchInputRef}
                        type="text"
                        className="connection-picker__search-input"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search entities..."
                        aria-label="Search entities"
                    />
                </div>
            </div>

            {/* Type Filters */}
            <div className="connection-picker__filters">
                <button
                    className={`connection-picker__filter ${typeFilter === 'all' ? 'connection-picker__filter--active' : ''}`}
                    onClick={() => setTypeFilter('all')}
                >
                    All
                    <span className="connection-picker__filter-count">
                        {availableEntities.length}
                    </span>
                </button>
                {ENTITY_TYPES.map(type => (
                    typeCounts[type] > 0 && (
                        <button
                            key={type}
                            className={`connection-picker__filter ${typeFilter === type ? 'connection-picker__filter--active' : ''}`}
                            onClick={() => setTypeFilter(type)}
                        >
                            <EntityTypeIcon type={type} size={12} />
                            <span className="connection-picker__filter-count">
                                {typeCounts[type]}
                            </span>
                        </button>
                    )
                ))}
            </div>

            {/* Results List */}
            <div className="connection-picker__list" ref={listRef}>
                {filteredEntities.length > 0 ? (
                    filteredEntities.map((entity, index) => (
                        <button
                            key={entity.id}
                            className={`connection-picker__item ${index === highlightedIndex ? 'connection-picker__item--highlighted' : ''}`}
                            onClick={() => onSelect(entity)}
                            onMouseEnter={() => setHighlightedIndex(index)}
                        >
                            <EntityTypeIcon
                                type={entity.type}
                                size={18}
                                className="connection-picker__item-icon"
                            />
                            <div className="connection-picker__item-info">
                                <div className="connection-picker__item-name">
                                    {highlightMatch(entity.name)}
                                </div>
                                <div className="connection-picker__item-meta">
                                    <span className="connection-picker__item-type">
                                        {entity.type}
                                    </span>
                                    {entity.tags.length > 0 && (
                                        <span className="connection-picker__item-tags">
                                            {entity.tags.slice(0, 3).join(', ')}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </button>
                    ))
                ) : (
                    <div className="connection-picker__empty">
                        {searchQuery ? 'No matching entities' : 'No entities available'}
                    </div>
                )}
            </div>
        </div>
    );
}