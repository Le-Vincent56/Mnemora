import { forwardRef, type HTMLAttributes } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/utils';
import { Surface, Badge, Text, Icon, Stack } from '@/primitives';
import styles from './composed.module.css';

export type EntityType = 'character' | 'location' | 'faction' | 'session' | 'note';

export interface EntityCardProps extends HTMLAttributes<HTMLDivElement> {
    /** Entity display name */
    name: string;
    /** Entity type (drives badge color and icon) */
    entityType: EntityType;
    /** Lucide icon for the entity type */
    icon: LucideIcon;
    /** Short excerpt or description */
    excerpt?: string;
    /** Whether this card is currently selected */
    selected?: boolean;
    /** Click handler */
    onSelect?: () => void;
}

/** Map entity types to Badge variants */
const typeLabels: Record<EntityType, string> = {
    character: 'Character',
    location: 'Location',
    faction: 'Faction',
    session: 'Session',
    note: 'Note',
};

/**
 * Hoverable entity card for the Prep Mode entity browser grid.
 * Displays entity icon, name, type badge, and an optional excerpt.
 *
 * @example
 * <EntityCard
 *   name="Theron Ashvale"
 *   entityType="character"
 *   icon={User}
 *   excerpt="A retired soldier turned innkeeper..."
 *   onSelect={() => openEditor(id)}
 * />
 */
export const EntityCard = forwardRef<HTMLDivElement, EntityCardProps>(
    function EntityCard(
        {
            name,
            entityType,
            icon,
            excerpt,
            selected = false,
            onSelect,
            className,
            ...props
        },
        ref
    ) {
        return (
            <Surface
                ref={ref}
                elevation="flat"
                radius="md"
                padding="md"
                bordered
                hoverable
                className={cn(
                    styles.entityCard,
                    selected && styles.entityCardSelected,
                    className
                )}
                onClick={onSelect}
                role={onSelect ? 'button' : undefined}
                tabIndex={onSelect ? 0 : undefined}
                {...props}
            >
                <Stack direction="horizontal" gap={3} align="start">
                    <Icon icon={icon} size={20} color="secondary" />
                    <Stack direction="vertical" gap={2} style={{ minWidth: 0, flex: 1 }}>
                        <Stack direction="horizontal" gap={2} align="center">
                            <Text variant="body" weight="semibold" className={styles.entityCardName}>
                                {name}
                            </Text>
                            <Badge variant={entityType} size="sm">{typeLabels[entityType]}</Badge>
                        </Stack>
                        {excerpt && (
                            <Text variant="body-sm" color="secondary" className={styles.entityCardExcerpt}>
                                {excerpt}
                            </Text>
                        )}
                    </Stack>
                </Stack>
            </Surface>
        );
    }
);
