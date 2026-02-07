import { X } from 'lucide-react';
import type { SortOption } from '@/data/mockEntities';
import styles from './prep.module.css';

const SORT_OPTIONS: Array<{ value: SortOption; label: string }> = [
  { value: 'recent', label: 'Recently Modified' },
  { value: 'name', label: 'Name' },
  { value: 'created', label: 'Date Created' },
  { value: 'type', label: 'Type' },
];

export interface FilterBarProps {
  activeTags: string[];
  onToggleTag: (tag: string) => void;
  availableTags: string[];
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  entityCount: number;
}

export function FilterBar({
  activeTags,
  onToggleTag,
  availableTags,
  sortBy,
  onSortChange,
  entityCount,
}: FilterBarProps) {
  return (
    <div className={styles.filterBar}>
      {/* Tags dropdown */}
      <select
        className={styles.filterSelect}
        value=""
        onChange={(e) => {
          if (e.target.value) onToggleTag(e.target.value);
          e.target.value = '';
        }}
        aria-label="Add tag filter"
      >
        <option value="">+ Tag</option>
        {availableTags
          .filter((t) => !activeTags.includes(t))
          .map((tag) => (
            <option key={tag} value={tag}>
              {tag}
            </option>
          ))}
      </select>

      {/* Active tag chips */}
      {activeTags.length > 0 && (
        <div className={styles.filterChips}>
          {activeTags.map((tag) => (
            <button
              key={tag}
              className={styles.filterChip}
              onClick={() => onToggleTag(tag)}
              aria-label={`Remove ${tag} filter`}
            >
              {tag}
              <X size={12} />
            </button>
          ))}
        </div>
      )}

      {/* Sort */}
      <select
        className={styles.filterSelect}
        value={sortBy}
        onChange={(e) => onSortChange(e.target.value as SortOption)}
        aria-label="Sort by"
        style={{ marginLeft: 'auto' }}
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Entity count */}
      <span className={styles.filterCount}>
        {entityCount} {entityCount === 1 ? 'entity' : 'entities'}
      </span>
    </div>
  );
}
