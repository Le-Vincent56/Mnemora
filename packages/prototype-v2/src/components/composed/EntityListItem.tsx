import { forwardRef, type HTMLAttributes } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/utils';
import { Badge, Text, Icon, Stack } from '@/primitives';
import type { EntityType } from './EntityCard';
import styles from './composed.module.css';

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
                onClick={onSelect}
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
                {meta && (
                    <Text variant="body-sm" color="tertiary" as="span" className={styles.entityListItemMeta}>
                        {meta}
                    </Text>
                )}
            </div>
        );
    }
);
