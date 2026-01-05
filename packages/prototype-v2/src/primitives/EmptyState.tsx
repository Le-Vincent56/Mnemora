import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/utils';
import { Icon } from './Icon';
import styles from './primitives.module.css';

export interface EmptyStateProps extends HTMLAttributes<HTMLDivElement> {
    /** Lucide icon component */
    icon: LucideIcon;
    /** Primary message */
    title: string;
    /** Supporting explanation */
    description?: string;
    /** Optional CTA (button or link) */
    action?: ReactNode;
}

/**
 * Friendly placeholder when containers have no content.
 * Centers icon, title, description, and optional action.
 *
 * @example
 * <EmptyState
 *   icon={Users}
 *   title="No characters yet"
 *   description="Create your first character to get started."
 *   action={<Button variant="primary">Create Character</Button>}
 * />
 */
export const EmptyState = forwardRef<HTMLDivElement, EmptyStateProps>(
    function EmptyState(
        {
            icon,
            title,
            description,
            action,
            className,
            ...props
        },
        ref
    ) {
        return (
            <div
                ref={ref}
                className={cn(styles.emptyState, className)}
                {...props}
            >
                <Icon icon={icon} size={24} color="muted" className={styles.emptyStateIcon} />
                <p className={styles.emptyStateTitle}>{title}</p>
                {description && (
                    <p className={styles.emptyStateDescription}>{description}</p>
                )}
                {action && (
                    <div className={styles.emptyStateAction}>{action}</div>
                )}
            </div>
        );
    }
);