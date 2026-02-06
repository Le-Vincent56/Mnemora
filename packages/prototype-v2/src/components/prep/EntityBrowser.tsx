import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { EmptyState } from '@/primitives';
import {
  getAllEntities,
  getAllTags,
  type Entity,
  type EntityType,
  type SortOption,
} from '@/data/mockEntities';
import { FilterBar } from './FilterBar';
import { EntitySection } from './EntitySection';
import type { BrowserView } from './PrepModeHeader';

const SECTION_ORDER: EntityType[] = ['character', 'location', 'faction', 'session', 'note'];

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

export interface EntityBrowserProps {
  view: BrowserView;
  searchQuery: string;
}

export function EntityBrowser({ view, searchQuery }: EntityBrowserProps) {
  const allTags = useMemo(() => getAllTags(), []);

  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('recent');

  const handleToggleTag = (tag: string) => {
    setActiveTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const filtered = useMemo(() => {
    let entities = getAllEntities();

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      entities = entities.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          e.tags.some((t) => t.includes(q))
      );
    }

    if (activeTags.length > 0) {
      entities = entities.filter((e) =>
        activeTags.every((tag) => e.tags.includes(tag))
      );
    }

    return sortEntities(entities, sortBy);
  }, [searchQuery, activeTags, sortBy]);

  const grouped = useMemo(() => {
    const map = new Map<EntityType, Entity[]>();
    for (const entity of filtered) {
      const list = map.get(entity.type) ?? [];
      list.push(entity);
      map.set(entity.type, list);
    }
    return map;
  }, [filtered]);

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
      ) : (
        <div>
          {SECTION_ORDER.filter((type) => grouped.has(type)).map((type) => (
            <EntitySection
              key={type}
              type={type}
              entities={grouped.get(type)!}
              view={view}
            />
          ))}
        </div>
      )}
    </>
  );
}
