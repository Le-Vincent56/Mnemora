import { forwardRef, type HTMLAttributes } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/utils';
import { Badge, Text, Icon, Stack } from '@/primitives';
import type { EntityType } from '@/data/mockEntities';
import styles from './composed.module.css';

const TYPE_COLORS: Record<EntityType, string> = {
    character: 'var(--entity-character)',
    location: 'var(--entity-location)',
    faction: 'var(--entity-faction)',
    note: 'var(--entity-note)',
};

export interface EntityListItemProps extends HTMLAttributes<HTMLDivElement> {
    /** Entity display name */
    name: string;
    /** Entity type */
    entityType: EntityType;
    /** Lucide icon for the entity type */
    icon: LucideIcon;
    /** Short metadata line (e.g. "Updated 2h ago") */
    meta?: string;
    /** Whether this item is currently selected */
    selected?: boolean;
    /** Click handler */
    onSelect?: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
}

/**
 * Compact horizontal list item for entity browsing in list view.
 *
 * @example
 * <EntityListItem
 *   name="The Whispering Depths"
 *   entityType="location"
 *   icon={MapPin}
 *   meta="Updated 2h ago"
 *   onSelect={() => openEditor(id)}
 * />
 */
export const EntityListItem = forwardRef<HTMLDivElement, EntityListItemProps>(
    function EntityListItem(
        {
            name,
            entityType,
            icon,
            meta,
            selected = false,
            onSelect,
            onEdit,
            onDelete,
            className,
            ...props
        },
        ref
    ) {
        return (
            <div
                ref={ref}
                className={cn(
                    styles.entityListItem,
                    selected && styles.entityListItemSelected,
                    className
                )}
                style={{ '--_entity-color': TYPE_COLORS[entityType] } as React.CSSProperties}
                onClick={onSelect}
                onKeyDown={onSelect ? (e: React.KeyboardEvent) => {
                    if (e.target !== e.currentTarget) return;
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSelect();
                    }
                } : undefined}
                role={onSelect ? 'button' : undefined}
                tabIndex={onSelect ? 0 : undefined}
                {...props}
            >
                <Stack direction="horizontal" gap={3} align="center" style={{ flex: 1, minWidth: 0 }}>
                    <Icon icon={icon} size={16} color="secondary" />
                    <Text variant="body-sm" weight="medium" className={styles.entityListItemName}>
                        {name}
                    </Text>
                    <Badge variant={entityType} size="sm">{entityType}</Badge>
                </Stack>
                <span className={styles.entityListItemActions}>
                    {meta && (
                        <Text variant="body-sm" color="tertiary" as="span" className={styles.entityListItemMeta}>
                            {meta}
                        </Text>
                    )}
                    {(onEdit || onDelete) && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                            {onEdit && (
                                <button
                                    type="button"
                                    className={styles.entityActionBtn}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onEdit();
                                    }}
                                    aria-label="Edit entity"
                                >
                                    <Icon icon={Pencil} size={16} color="inherit" />
                                </button>
                            )}
                            {onDelete && (
                                <button
                                    type="button"
                                    className={cn(styles.entityActionBtn, styles.entityActionBtnDanger)}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDelete();
                                    }}
                                    aria-label="Delete entity"
                                >
                                    <Icon icon={Trash2} size={16} color="inherit" />
                                </button>
                            )}
                        </span>
                    )}
                </span>
            </div>
        );
    }
);
