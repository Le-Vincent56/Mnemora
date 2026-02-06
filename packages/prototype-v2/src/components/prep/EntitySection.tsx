import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { Text, Icon } from '@/primitives';
import { EntityCard, EntityListItem } from '@/components/composed';
import { useReducedMotion } from '@/hooks';
import { EASING, TIMING, toSeconds } from '@/tokens';
import { ENTITY_ICONS, type Entity, type EntityType } from '@/data/mockEntities';
import { cn } from '@/utils/cn';
import type { BrowserView } from './PrepModeHeader';
import styles from './prep.module.css';

const TYPE_LABELS: Record<EntityType, string> = {
  character: 'Characters',
  location: 'Locations',
  faction: 'Factions',
  session: 'Sessions',
  note: 'Notes',
};

const TYPE_COLORS: Record<EntityType, string> = {
  character: 'var(--entity-character)',
  location: 'var(--entity-location)',
  faction: 'var(--entity-faction)',
  session: 'var(--entity-session)',
  note: 'var(--entity-note)',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days < 1) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export interface EntitySectionProps {
  type: EntityType;
  entities: Entity[];
  view: BrowserView;
}

export function EntitySection({ type, entities, view }: EntitySectionProps) {
  const [collapsed, setCollapsed] = useState(false);
  const reducedMotion = useReducedMotion();

  return (
    <div>
      <button
        className={styles.sectionHeaderRow}
        onClick={() => setCollapsed((c) => !c)}
        aria-expanded={!collapsed}
      >
        <div
          className={styles.sectionAccent}
          style={{ backgroundColor: TYPE_COLORS[type] }}
        />
        <Text
          variant="caption"
          color="secondary"
          className={styles.sectionLabel}
        >
          {TYPE_LABELS[type]}
        </Text>
        <div className={styles.sectionCount}>
          <Text variant="body-sm" color="tertiary">
            {entities.length}
          </Text>
        </div>
        <Icon
          icon={ChevronDown}
          size={16}
          color="muted"
          className={cn(
            styles.sectionChevron,
            collapsed && styles.sectionChevronCollapsed
          )}
        />
      </button>

      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={reducedMotion ? false : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={reducedMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={
              reducedMotion
                ? { duration: 0 }
                : { duration: toSeconds(TIMING.gentle), ease: EASING.out }
            }
            style={{ overflow: 'hidden' }}
          >
            {view === 'grid' ? (
              <div className={styles.entityGrid} style={{ paddingBottom: 'var(--space-4)' }}>
                {entities.map((entity, i) => (
                  <motion.div
                    key={entity.id}
                    initial={reducedMotion ? false : { opacity: 0, y: 12 }}
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
                      excerpt={entity.description}
                      onSelect={() => console.log('Open entity:', entity.id)}
                    />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className={styles.entityList} style={{ paddingBottom: 'var(--space-4)' }}>
                {entities.map((entity) => (
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
