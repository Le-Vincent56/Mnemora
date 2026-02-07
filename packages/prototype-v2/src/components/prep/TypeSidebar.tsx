import { useRef, useCallback } from 'react';
import { Layers } from 'lucide-react';
import { Icon } from '@/primitives';
import { ENTITY_ICONS, type EntityType } from '@/data/mockEntities';
import styles from './prep.module.css';
import { cn } from '@/utils/cn';

const TYPE_ORDER: Array<EntityType | 'all'> = ['all', 'character', 'location', 'faction', 'note'];

const TYPE_LABELS: Record<EntityType | 'all', string> = {
  all: 'All',
  character: 'Characters',
  location: 'Locations',
  faction: 'Factions',
  note: 'Notes',
};

const TYPE_CSS_COLORS: Record<EntityType | 'all', string> = {
  all: 'var(--primary)',
  character: 'var(--entity-character)',
  location: 'var(--entity-location)',
  faction: 'var(--entity-faction)',
  note: 'var(--entity-note)',
};

export interface TypeSidebarProps {
  activeType: EntityType | 'all';
  onTypeChange: (type: EntityType | 'all') => void;
  typeCounts: Record<EntityType | 'all', number>;
}

export function TypeSidebar({ activeType, onTypeChange, typeCounts }: TypeSidebarProps) {
  const listRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const items = listRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
      if (!items) return;

      const currentIdx = TYPE_ORDER.indexOf(activeType);
      let nextIdx = currentIdx;

      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        nextIdx = (currentIdx + 1) % TYPE_ORDER.length;
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        nextIdx = (currentIdx - 1 + TYPE_ORDER.length) % TYPE_ORDER.length;
      }

      const nextType = TYPE_ORDER[nextIdx];
      if (nextIdx !== currentIdx && nextType) {
        onTypeChange(nextType);
        items[nextIdx]?.focus();
      }
    },
    [activeType, onTypeChange]
  );

  return (
    <nav
      ref={listRef}
      className={styles.typeSidebar}
      role="tablist"
      aria-label="Entity types"
      aria-orientation="vertical"
      onKeyDown={handleKeyDown}
    >
      {TYPE_ORDER.map((type) => {
        const isActive = activeType === type;
        const iconComponent = type === 'all' ? Layers : ENTITY_ICONS[type];
        return (
          <button
            key={type}
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            className={cn(styles.typeSidebarItem, isActive && styles.typeSidebarItemActive)}
            style={{ '--_sidebar-color': TYPE_CSS_COLORS[type] } as React.CSSProperties}
            onClick={() => onTypeChange(type)}
          >
            <Icon icon={iconComponent} size={16} color="inherit" />
            <span className={styles.typeSidebarLabel}>{TYPE_LABELS[type]}</span>
            <span className={styles.typeSidebarCount}>{typeCounts[type]}</span>
          </button>
        );
      })}
    </nav>
  );
}
