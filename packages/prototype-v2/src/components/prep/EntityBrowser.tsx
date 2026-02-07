import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { EmptyState } from '@/primitives';
import { EntityCard, EntityListItem } from '@/components/composed';
import { useReducedMotion } from '@/hooks';
import { EASING, TIMING, toSeconds } from '@/tokens';
import {
  ENTITY_ICONS,
  type Entity,
  type EntityType,
  type SortOption,
} from '@/data/mockEntities';
import { FilterBar } from './FilterBar';
import styles from './prep.module.css';

export type BrowserView = 'grid' | 'list';

function sortEntities(entities: Entity[], sort: SortOption): Entity[] {
  const sorted = [...entities];
  switch (sort) {
    case 'recent':
      return sorted.sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt));
    case 'name':
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case 'created':
      return sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    case 'type':
      return sorted.sort((a, b) => a.type.localeCompare(b.type));
    default:
      return sorted;
  }
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days < 1) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export interface EntityBrowserProps {
  entities: Entity[];
  view: BrowserView;
  searchQuery: string;
  activeType: EntityType | 'all';
  onSelectEntity?: (id: string) => void;
  onEditEntity?: (id: string) => void;
  onDeleteEntity?: (id: string) => void;
}

export function EntityBrowser({ entities, view, searchQuery, activeType, onSelectEntity, onEditEntity, onDeleteEntity }: EntityBrowserProps) {
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    for (const e of entities) {
      for (const t of e.tags) tagSet.add(t);
    }
    return Array.from(tagSet).sort();
  }, [entities]);
  const reducedMotion = useReducedMotion();

  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('recent');

  const handleToggleTag = (tag: string) => {
    setActiveTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const filtered = useMemo(() => {
    let filteredEntities = entities;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filteredEntities = filteredEntities.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          e.tags.some((t) => t.includes(q))
      );
    }

    if (activeType !== 'all') {
      filteredEntities = filteredEntities.filter((e) => e.type === activeType);
    }

    if (activeTags.length > 0) {
      filteredEntities = filteredEntities.filter((e) =>
        activeTags.every((tag) => e.tags.includes(tag))
      );
    }

    return sortEntities(filteredEntities, sortBy);
  }, [entities, searchQuery, activeType, activeTags, sortBy]);

  return (
    <>
      <FilterBar
        activeTags={activeTags}
        onToggleTag={handleToggleTag}
        availableTags={allTags}
        sortBy={sortBy}
        onSortChange={setSortBy}
        entityCount={filtered.length}
      />

      {filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No entities found"
          description="Try adjusting your filters or search query."
        />
      ) : view === 'grid' ? (
        <div className={styles.entityGrid}>
          {filtered.map((entity, i) => (
            <motion.div
              key={entity.id}
              initial={reducedMotion ? false : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={
                reducedMotion
                  ? { duration: 0 }
                  : {
                      duration: toSeconds(TIMING.gentle),
                      ease: EASING.memory,
                      delay: i * 0.04,
                    }
              }
            >
              <EntityCard
                data-entity-id={entity.id}
                name={entity.name}
                entityType={entity.type}
                icon={ENTITY_ICONS[entity.type]}
                excerpt={entity.description}
                tags={entity.tags}
                connectionCount={entity.connections.length}
                onSelect={onSelectEntity ? () => onSelectEntity(entity.id) : () => console.log('Open entity:', entity.id)}
                onEdit={onEditEntity ? () => onEditEntity(entity.id) : undefined}
                onDelete={onDeleteEntity ? () => onDeleteEntity(entity.id) : undefined}
              />
            </motion.div>
          ))}
        </div>
      ) : (
        <div className={styles.entityList}>
          {filtered.map((entity) => (
            <EntityListItem
              key={entity.id}
              data-entity-id={entity.id}
              name={entity.name}
              entityType={entity.type}
              icon={ENTITY_ICONS[entity.type]}
              meta={timeAgo(entity.modifiedAt)}
              onSelect={onSelectEntity ? () => onSelectEntity(entity.id) : () => console.log('Open entity:', entity.id)}
              onEdit={onEditEntity ? () => onEditEntity(entity.id) : undefined}
              onDelete={onDeleteEntity ? () => onDeleteEntity(entity.id) : undefined}
            />
          ))}
        </div>
      )}
    </>
  );
}
