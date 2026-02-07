import { forwardRef, type HTMLAttributes } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/utils';
import { Icon } from '@/primitives';
import type { EntityType } from '@/data/mockEntities';
import styles from './composed.module.css';

export interface EntityCardProps extends HTMLAttributes<HTMLDivElement> {
    name: string;
    entityType: EntityType;
    icon: LucideIcon;
    excerpt?: string;
    tags?: string[];
    connectionCount?: number;
    selected?: boolean;
    onSelect?: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
}

const TYPE_LABELS: Record<EntityType, string> = {
    character: 'Character',
    location: 'Location',
    faction: 'Faction',
    note: 'Note',
};

const TYPE_COLORS: Record<EntityType, string> = {
    character: 'var(--entity-character)',
    location: 'var(--entity-location)',
    faction: 'var(--entity-faction)',
    note: 'var(--entity-note)',
};

export const EntityCard = forwardRef<HTMLDivElement, EntityCardProps>(
    function EntityCard(
        {
            name,
            entityType,
            icon,
            excerpt,
            tags,
            connectionCount,
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
                    styles.entityCard,
                    selected && styles.entityCardSelected,
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
                <div className={styles.entityCardHeader}>
                    <div className={styles.entityCardIcon}>
                        <Icon icon={icon} size={16} color="inherit" />
                    </div>
                    <span className={styles.entityCardName}>{name}</span>
                    <span className={styles.entityCardType}>{TYPE_LABELS[entityType]}</span>
                    {(onEdit || onDelete) && (
                        <span className={styles.entityCardActions}>
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
                </div>
                {(excerpt || tags?.length || connectionCount !== undefined) && (
                    <div className={styles.entityCardBody}>
                        {excerpt && (
                            <p className={styles.entityCardExcerpt}>{excerpt}</p>
                        )}
                        {(tags?.length || connectionCount !== undefined) && (
                            <div className={styles.entityCardFooter}>
                                {tags?.slice(0, 3).map((tag) => (
                                    <span key={tag} className={styles.entityCardTag}>{tag}</span>
                                ))}
                                {connectionCount !== undefined && connectionCount > 0 && (
                                    <span className={styles.entityCardConnections}>
                                        {connectionCount} link{connectionCount !== 1 ? 's' : ''}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    }
);
