import { useState, useMemo, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Entity, EntityType, mockEntities } from '@/data/mockData';
import { FilterBar, SortOption } from './FilterBar';
import { EntityListView } from './EntityListView';
import { EntityCardView } from './EntityCardView';
import { ViewMode } from './ViewToggle';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/Button';
import './EntityBrowser.css';

interface EntityBrowserProps {
    viewMode: ViewMode;
    searchQuery: string;
    onEntityClick: (entity: Entity, event: React.MouseEvent) => void;
    onCreateEntity: (type: EntityType) => void;
}

export function EntityBrowser({
    viewMode,
    searchQuery,
    onEntityClick,
    onCreateEntity,
}: EntityBrowserProps) {
    // Filter state
    const [selectedType, setSelectedType] = useState<EntityType | null>(null);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [sortBy, setSortBy] = useState<SortOption>('recent');

    // Get all unique tags from entities
    const availableTags = useMemo(() => {
        const tagSet = new Set<string>();
        mockEntities.forEach((entity) => {
            entity.tags.forEach((tag) => tagSet.add(tag));
        });
        return Array.from(tagSet).sort();
    }, []);

    // Count entities by type
    const typeCounts = useMemo(() => {
        const counts: Record<EntityType, number> = {
            character: 0,
            location: 0,
            faction: 0,
            session: 0,
            note: 0,
        };
        mockEntities.forEach((entity) => {
            counts[entity.type]++;
        });
        return counts;
    }, []);

    // Filter and sort entities
    const filteredEntities = useMemo(() => {
        let result = [...mockEntities];

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(
                (e) =>
                    e.name.toLowerCase().includes(query) ||
                    e.description.toLowerCase().includes(query) ||
                    e.tags.some((tag) => tag.toLowerCase().includes(query))
            );
        }

        // Type filter
        if (selectedType) {
            result = result.filter((e) => e.type === selectedType);
        }

        // Tag filter (entity must have ALL selected tags)
        if (selectedTags.length > 0) {
            result = result.filter((e) =>
                selectedTags.every((tag) => e.tags.includes(tag))
            );
        }

        // Sort
        switch (sortBy) {
            case 'name':
                result.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'created':
                result.sort(
                    (a, b) =>
                        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                );
                break;
            case 'type':
                result.sort((a, b) => a.type.localeCompare(b.type));
                break;
            case 'recent':
            default:
                result.sort(
                    (a, b) =>
                        new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime()
                );
                break;
        }

        return result;
    }, [searchQuery, selectedType, selectedTags, sortBy]);

    // Clear all filters
    const handleClearFilters = useCallback(() => {
        setSelectedType(null);
        setSelectedTags([]);
    }, []);

    // Determine empty state type
    const isFiltered = selectedType !== null || selectedTags.length > 0 || searchQuery.length > 0;
    const isEmpty = filteredEntities.length === 0;
    const hasNoEntities = mockEntities.length === 0;

    return (
        <div className="entity-browser">
            <FilterBar
                selectedType={selectedType}
                onTypeChange={setSelectedType}
                selectedTags={selectedTags}
                onTagsChange={setSelectedTags}
                availableTags={availableTags}
                sortBy={sortBy}
                onSortChange={setSortBy}
                entityCount={filteredEntities.length}
                typeCounts={typeCounts}
            />

            <div className="entity-browser__content">
                <AnimatePresence mode="wait">
                    {isEmpty ? (
                        <motion.div
                            key="empty"
                            className="entity-browser__empty"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            {hasNoEntities ? (
                                // No entities at all
                                <EmptyState
                                    title="Your world awaits its first story."
                                    description="Create your first entity to begin building your world."
                                    action={
                                        <Button onClick={() => onCreateEntity('character')}>
                                            Create Your First Character
                                        </Button>
                                    }
                                />
                            ) : isFiltered ? (
                                // Filtered results empty
                                <EmptyState
                                    title={
                                        searchQuery
                                            ? `No results for "${searchQuery}"`
                                            : `No ${selectedType || 'entities'} match your filters`
                                    }
                                    description="Try adjusting your filters or search terms."
                                    action={
                                        <Button variant="ghost" onClick={handleClearFilters}>
                                            Clear Filters
                                        </Button>
                                    }
                                />
                            ) : null}
                        </motion.div>
                    ) : (
                        <motion.div
                            key={viewMode}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            {viewMode === 'list' ? (
                                <EntityListView
                                    entities={filteredEntities}
                                    onEntityClick={onEntityClick}
                                />
                            ) : (
                                <EntityCardView
                                    entities={filteredEntities}
                                    onEntityClick={onEntityClick}
                                />
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}