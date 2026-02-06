import { Plus, LayoutGrid, List, Globe } from 'lucide-react';
import { Text, Button, Icon } from '@/primitives';
import { SearchInput, ViewToggle } from '@/components/composed';
import type { ViewToggleOption } from '@/components/composed';
import styles from './prep.module.css';

const VIEW_OPTIONS: ViewToggleOption[] = [
  { value: 'grid', icon: LayoutGrid, label: 'Card view' },
  { value: 'list', icon: List, label: 'List view' },
];

export type BrowserView = 'grid' | 'list';

export interface PrepModeHeaderProps {
  view: BrowserView;
  onViewChange: (view: BrowserView) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onCreateEntity: () => void;
}

export function PrepModeHeader({
  view,
  onViewChange,
  searchQuery,
  onSearchChange,
  onCreateEntity,
}: PrepModeHeaderProps) {
  return (
    <div className={styles.prepHeader}>
      {/* Left: World / Campaign */}
      <div className={styles.prepHeaderLeft}>
        <Icon icon={Globe} size={20} color="secondary" />
        <Text variant="body-sm" weight="medium" color="secondary">
          Brindlemark Campaign
        </Text>
      </div>

      {/* Center: Search */}
      <div className={styles.prepHeaderCenter}>
        <SearchInput
          placeholder="Summon..."
          shortcut="/"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {/* Right: View Toggle + Create */}
      <div className={styles.prepHeaderRight}>
        <ViewToggle
          options={VIEW_OPTIONS}
          value={view}
          onChange={(v) => onViewChange(v as BrowserView)}
        />
        <Button variant="primary" size="sm" onClick={onCreateEntity}>
          <Icon icon={Plus} size={16} color="inherit" />
          Create
        </Button>
      </div>
    </div>
  );
}
