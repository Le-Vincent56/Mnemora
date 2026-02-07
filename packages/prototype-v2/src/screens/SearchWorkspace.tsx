import { useState, useMemo, useRef, useEffect } from 'react';
import { LayoutGrid, List, Search, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { Text, Icon, EmptyState } from '@/primitives';
import { EntityCard, EntityListItem, ViewToggle } from '@/components/composed';
import type { ViewToggleOption } from '@/components/composed';
import { useReducedMotion } from '@/hooks';
import { EASING, TIMING, toSeconds } from '@/tokens';
import {
  getAllEntities,
  getAllTags,
  ENTITY_ICONS,
  type Entity,
  type EntityType,
} from '@/data/mockEntities';
import styles from '@/components/prep/prep.module.css';

const VIEW_OPTIONS: ViewToggleOption[] = [
  { value: 'grid', icon: LayoutGrid, label: 'Card view' },
  { value: 'list', icon: List, label: 'List view' },
];

const TYPE_FILTERS: Array<{ value: EntityType | 'all'; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'character', label: 'Characters' },
  { value: 'location', label: 'Locations' },
  { value: 'faction', label: 'Factions' },
  { value: 'note', label: 'Notes' },
];

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days < 1) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export function SearchWorkspace() {
  const [query, setQuery] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [activeType, setActiveType] = useState<EntityType | 'all'>('all');
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const reducedMotion = useReducedMotion();
  const allTags = useMemo(() => getAllTags(), []);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleToggleTag = (tag: string) => {
    setActiveTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const results = useMemo(() => {
    let entities = getAllEntities();

    // If no query, show "recent" (last 6 by modifiedAt)
    if (!query && activeType === 'all' && activeTags.length === 0) {
      return [...entities]
        .sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt))
        .slice(0, 6);
    }

    if (query) {
      const q = query.toLowerCase();
      entities = entities.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          e.tags.some((t) => t.includes(q))
      );
    }

    if (activeType !== 'all') {
      entities = entities.filter((e) => e.type === activeType);
    }

    if (activeTags.length > 0) {
      entities = entities.filter((e) =>
        activeTags.every((tag) => e.tags.includes(tag))
      );
    }

    return entities;
  }, [query, activeType, activeTags]);

  const isDefaultView = !query && activeType === 'all' && activeTags.length === 0;

  return (
    <div className={styles.searchWorkspace}>
      {/* Hero search */}
      <div className={styles.searchHero}>
        <div className={styles.searchHeroInput}>
          <Icon icon={Search} size={20} color="muted" />
          <input
            ref={inputRef}
            type="search"
            className={styles.searchHeroField}
            placeholder="Summon anything..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button
              type="button"
              className={styles.searchHeroClear}
              onClick={() => setQuery('')}
              aria-label="Clear search"
            >
              <Icon icon={X} size={16} color="inherit" />
            </button>
          )}
        </div>
      </div>

      {/* Filters row */}
      <div className={styles.searchFilters}>
        <div className={styles.searchTypePills}>
          {TYPE_FILTERS.map((tf) => (
            <button
              key={tf.value}
              type="button"
              className={`${styles.searchTypePill} ${activeType === tf.value ? styles.searchTypePillActive : ''}`}
              onClick={() => setActiveType(tf.value)}
            >
              {tf.label}
            </button>
          ))}
        </div>
        <div className={styles.searchFilterRight}>
          <select
            className={styles.filterSelect}
            value=""
            onChange={(e) => {
              if (e.target.value) handleToggleTag(e.target.value);
              e.target.value = '';
            }}
            aria-label="Add tag filter"
          >
            <option value="">+ Tag</option>
            {allTags
              .filter((t) => !activeTags.includes(t))
              .map((tag) => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
          </select>
          <ViewToggle
            options={VIEW_OPTIONS}
            value={view}
            onChange={(v) => setView(v as 'grid' | 'list')}
          />
        </div>
      </div>

      {/* Active tag chips */}
      {activeTags.length > 0 && (
        <div className={styles.filterChips}>
          {activeTags.map((tag) => (
            <button
              key={tag}
              className={styles.filterChip}
              onClick={() => handleToggleTag(tag)}
              aria-label={`Remove ${tag} filter`}
            >
              {tag}
              <X size={12} />
            </button>
          ))}
        </div>
      )}

      {/* Section label */}
      <div className={styles.searchSectionLabel}>
        <Text variant="caption" color="tertiary" style={{ letterSpacing: '0.08em' }}>
          {isDefaultView ? 'RECENT ENTITIES' : `${results.length} RESULT${results.length !== 1 ? 'S' : ''}`}
        </Text>
      </div>

      {/* Results */}
      {results.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No results"
          description="Try different keywords or adjust your filters."
        />
      ) : view === 'grid' ? (
        <div className={styles.entityGrid}>
          {results.map((entity, i) => (
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
                name={entity.name}
                entityType={entity.type}
                icon={ENTITY_ICONS[entity.type]}
                excerpt={query ? renderExcerpt(entity, query) : entity.description}
                tags={entity.tags}
                connectionCount={entity.connections.length}
                onSelect={() => console.log('Open entity:', entity.id)}
              />
            </motion.div>
          ))}
        </div>
      ) : (
        <div className={styles.entityList}>
          {results.map((entity) => (
            <EntityListItem
              key={entity.id}
              name={entity.name}
              entityType={entity.type}
              icon={ENTITY_ICONS[entity.type]}
              meta={timeAgo(entity.modifiedAt)}
              onSelect={() => console.log('Open entity:', entity.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/** Extract a snippet around the match for card excerpt */
function renderExcerpt(entity: Entity, query: string): string {
  const q = query.toLowerCase();
  const idx = entity.description.toLowerCase().indexOf(q);
  if (idx === -1) return entity.description;
  const start = Math.max(0, idx - 40);
  const end = Math.min(entity.description.length, idx + query.length + 60);
  let snippet = entity.description.slice(start, end);
  if (start > 0) snippet = '...' + snippet;
  if (end < entity.description.length) snippet = snippet + '...';
  return snippet;
}
