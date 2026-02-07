import { useMemo } from 'react';
import { ChevronLeft, Pencil, Trash2, Link2, Tag, CalendarClock, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import { Text, Icon, Badge, Button } from '@/primitives';
import { useReducedMotion } from '@/hooks';
import { EASING, TIMING, toSeconds } from '@/tokens';
import { ENTITY_ICONS, type Entity } from '@/data/mockEntities';
import styles from './prep.module.css';

function formatMeta(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export interface EntityDetailCanvasProps {
  entity: Entity;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onOpenEntity?: (id: string) => void;
  backButtonRef?: React.Ref<HTMLButtonElement>;
}

export function EntityDetailCanvas({ entity, onBack, onEdit, onDelete, onOpenEntity, backButtonRef }: EntityDetailCanvasProps) {
  const reducedMotion = useReducedMotion();
  const icon = useMemo(() => ENTITY_ICONS[entity.type], [entity.type]);
  const sections = useMemo(() => {
    const out: Array<{ id: string; title: string; kind: 'desc' | 'secrets' | 'connections' | 'tags' | 'fields' | 'meta' }> = [];
    out.push({ id: 'desc', title: 'Description', kind: 'desc' });
    if (entity.secrets?.trim()) out.push({ id: 'secrets', title: 'Secrets', kind: 'secrets' });
    out.push({ id: 'connections', title: 'Connections', kind: 'connections' });
    out.push({ id: 'tags', title: 'Tags', kind: 'tags' });
    if (entity.typeSpecificFields && Object.keys(entity.typeSpecificFields).length > 0) {
      out.push({ id: 'fields', title: 'Type-specific fields', kind: 'fields' });
    }
    out.push({ id: 'meta', title: 'Meta', kind: 'meta' });
    return out;
  }, [entity.secrets, entity.connections.length, entity.tags.length, entity.typeSpecificFields]);

  return (
    <div className={styles.entityDetailPage} role="region" aria-label="Entity details">
      <div className={styles.entityDetailHeader}>
        <button
          ref={backButtonRef}
          type="button"
          className={styles.entityDetailBackBtn}
          onClick={onBack}
          aria-label="Back to entities"
        >
          <Icon icon={ChevronLeft} size={16} color="inherit" />
          <Text variant="body-sm" weight="medium" color="inherit">Back</Text>
        </button>

        <div className={styles.entityDetailTitleRow}>
          <span className={styles.entityDetailIcon} aria-hidden="true">
            <Icon icon={icon} size={20} color="inherit" />
          </span>
          <Text variant="title" weight="semibold" className={styles.entityDetailTitle}>
            {entity.name}
          </Text>
          <Badge variant={entity.type} size="sm">{entity.type}</Badge>
        </div>

        <div className={styles.entityDetailActions}>
          <Button variant="ghost" size="sm" onClick={onEdit} aria-label="Edit entity">
            <Icon icon={Pencil} size={16} color="inherit" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onDelete} aria-label="Delete entity">
            <Icon icon={Trash2} size={16} color="inherit" />
          </Button>
        </div>
      </div>

      <div className={styles.entityDetailBody}>
        {sections.map((s, idx) => (
          <motion.section
            key={s.id}
            className={styles.entityDetailSection}
            initial={reducedMotion ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={
              reducedMotion
                ? { duration: 0 }
                : { duration: toSeconds(TIMING.gentle), ease: EASING.memory, delay: idx * 0.04 }
            }
          >
            <div className={styles.entityDetailSectionTitle}>
              <Icon
                icon={
                  s.kind === 'desc'
                    ? Info
                    : s.kind === 'secrets'
                      ? Info
                      : s.kind === 'connections'
                        ? Link2
                        : s.kind === 'tags'
                          ? Tag
                          : s.kind === 'fields'
                            ? Info
                            : CalendarClock
                }
                size={16}
                color="muted"
              />
              <Text variant="body-sm" weight="semibold" color="secondary">{s.title}</Text>
            </div>

            {s.kind === 'desc' && (
              <Text variant="body-sm" color="secondary">
                {entity.description?.trim() ? entity.description : '—'}
              </Text>
            )}

            {s.kind === 'secrets' && (
              <div className={styles.entitySecretsBlock}>
                <Text variant="caption" className={styles.entitySecretsLabel}>
                  SECRET (GM-only)
                </Text>
                <Text variant="body-sm" color="secondary">
                  {entity.secrets}
                </Text>
              </div>
            )}

            {s.kind === 'connections' && (
              <div className={styles.entityPills}>
                {entity.connections.length === 0 ? (
                  <Text variant="body-sm" color="tertiary">No connections yet.</Text>
                ) : (
                  entity.connections.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className={styles.entityPill}
                      data-entity-type={c.type}
                      onClick={() => onOpenEntity?.(c.id)}
                      aria-label={`Open ${c.name}`}
                    >
                      {c.name}
                    </button>
                  ))
                )}
              </div>
            )}

            {s.kind === 'tags' && (
              <div className={styles.entityTags}>
                {entity.tags.length === 0 ? (
                  <Text variant="body-sm" color="tertiary">No tags.</Text>
                ) : (
                  entity.tags.map((t) => (
                    <span key={t} className={styles.entityTag}>{t}</span>
                  ))
                )}
              </div>
            )}

            {s.kind === 'fields' && entity.typeSpecificFields && (
              <div className={styles.entityFieldsTable}>
                {Object.entries(entity.typeSpecificFields).map(([k, v]) => (
                  <div key={k} className={styles.entityFieldsRow}>
                    <Text variant="mono" className={styles.entityFieldKeyText}>{k}</Text>
                    <Text variant="body-sm" color="secondary" className={styles.entityFieldValueText}>{v}</Text>
                  </div>
                ))}
              </div>
            )}

            {s.kind === 'meta' && (
              <div className={styles.entityMetaFooter}>
                <div className={styles.entityMetaLine}>
                  <Text variant="mono" color="tertiary">created</Text>
                  <Text variant="mono" color="secondary">{formatMeta(entity.createdAt)}</Text>
                </div>
                <div className={styles.entityMetaLine}>
                  <Text variant="mono" color="tertiary">modified</Text>
                  <Text variant="mono" color="secondary">{formatMeta(entity.modifiedAt)}</Text>
                </div>
              </div>
            )}
          </motion.section>
        ))}
      </div>
    </div>
  );
}
