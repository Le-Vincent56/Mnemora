import { useState, useMemo } from 'react';
import { LayoutGrid, List, Upload } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button, Icon, Text, Badge, EmptyState } from '@/primitives';
import { SearchInput, ViewToggle } from '@/components/composed';
import type { ViewToggleOption } from '@/components/composed';
import { useReducedMotion } from '@/hooks';
import { EASING, TIMING, toSeconds } from '@/tokens';
import {
  getAllAssets,
  ASSET_ICONS,
  ASSET_LABELS,
  type Asset,
  type AssetType,
} from '@/data/mockAssets';
import styles from '@/components/prep/prep.module.css';

const VIEW_OPTIONS: ViewToggleOption[] = [
  { value: 'grid', icon: LayoutGrid, label: 'Grid view' },
  { value: 'list', icon: List, label: 'List view' },
];

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/** Deterministic placeholder color based on asset type */
const THUMB_COLORS: Record<AssetType, string> = {
  image: 'var(--entity-character)',
  pdf: 'var(--entity-faction)',
  map: 'var(--entity-location)',
  audio: 'var(--entity-session)',
  video: 'var(--entity-note)',
  other: 'var(--ink-tertiary)',
};

export function AssetsWorkspace() {
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');
  const reducedMotion = useReducedMotion();

  const filtered = useMemo(() => {
    const all = getAllAssets();
    if (!search) return all;
    const q = search.toLowerCase();
    return all.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.type.includes(q)
    );
  }, [search]);

  return (
    <div className={styles.assetWorkspace}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <SearchInput
          size="sm"
          placeholder="Search assets..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <ViewToggle
          options={VIEW_OPTIONS}
          value={view}
          onChange={(v) => setView(v as 'grid' | 'list')}
        />
        <Button variant="secondary" size="sm" disabled>
          <Icon icon={Upload} size={16} color="inherit" />
          Upload
        </Button>
      </div>

      {/* Content */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Upload}
          title="No assets found"
          description="Try adjusting your search query."
        />
      ) : view === 'grid' ? (
        <div className={styles.assetGrid}>
          {filtered.map((asset, i) => (
            <motion.div
              key={asset.id}
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
              <AssetCard asset={asset} />
            </motion.div>
          ))}
        </div>
      ) : (
        <div className={styles.assetList}>
          {filtered.map((asset) => (
            <AssetRow key={asset.id} asset={asset} />
          ))}
        </div>
      )}
    </div>
  );
}

function AssetCard({ asset }: { asset: Asset }) {
  const AssetIcon = ASSET_ICONS[asset.type];
  return (
    <div
      className={styles.assetCard}
      style={{ '--_asset-color': THUMB_COLORS[asset.type] } as React.CSSProperties}
      role="button"
      tabIndex={0}
      onClick={() => console.log('Open asset:', asset.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          console.log('Open asset:', asset.id);
        }
      }}
    >
      {/* Placeholder thumbnail */}
      <div className={styles.assetThumb}>
        <Icon icon={AssetIcon} size={24} color="inherit" />
      </div>
      <div className={styles.assetCardBody}>
        <Text variant="body-sm" weight="medium" className={styles.assetCardName}>
          {asset.name}
        </Text>
        <div className={styles.assetCardMeta}>
          <Badge variant="default" size="sm">{ASSET_LABELS[asset.type]}</Badge>
          {asset.linkedEntities > 0 && (
            <Text variant="body-sm" color="tertiary" as="span">
              {asset.linkedEntities} linked
            </Text>
          )}
        </div>
      </div>
    </div>
  );
}

function AssetRow({ asset }: { asset: Asset }) {
  const AssetIcon = ASSET_ICONS[asset.type];
  return (
    <div
      className={styles.assetRow}
      style={{ '--_asset-color': THUMB_COLORS[asset.type] } as React.CSSProperties}
      role="button"
      tabIndex={0}
      onClick={() => console.log('Open asset:', asset.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          console.log('Open asset:', asset.id);
        }
      }}
    >
      <div className={styles.assetRowIcon}>
        <Icon icon={AssetIcon} size={16} color="inherit" />
      </div>
      <Text variant="body-sm" weight="medium" className={styles.assetRowName}>
        {asset.name}
      </Text>
      <Badge variant="default" size="sm">{ASSET_LABELS[asset.type]}</Badge>
      <Text variant="body-sm" color="tertiary" as="span" className={styles.assetRowDetail}>
        {asset.size}
      </Text>
      <Text variant="body-sm" color="tertiary" as="span" className={styles.assetRowDetail}>
        {formatDate(asset.addedAt)}
      </Text>
    </div>
  );
}
