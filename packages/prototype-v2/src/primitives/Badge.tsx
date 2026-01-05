import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '@/utils';
import styles from './primitives.module.css';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
    /** Badge content (text or count) */
    /** Visual variant - default or entity type */
    variant?: 'default' | 'character' | 'location' | 'faction' | 'session' | 'note';
    /** Size preset */
    size?: 'sm' | 'md';
}

/**
 * Compact status indicators and entity type labels.
 * Uses pill shape with entity-aware coloring.
 *
 * @example
 * <Badge variant="character">NPC</Badge>
 * <Badge variant="default" size="sm">12</Badge>
 */
export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
    function Badge(
        {
            children,
            variant = 'default',
            size = 'md',
            className,
            ...props
        },
        ref
    ) {
        return (
            <span
                ref={ref}
                className={cn(
                    styles.badge,
                    styles[`badge-${variant}`],
                    styles[`badge-${size}`],
                    className
                )}
                {...props}
            >
                {children}
            </span>
        );
    }
);