import { forwardRef, type ReactNode, type HTMLAttributes } from 'react';
import { cn } from '@/utils';
import styles from './primitives.module.css';

export interface SurfaceProps extends HTMLAttributes<HTMLDivElement> {
    /** Content inside the surface */
    children: ReactNode;
    /** Visual elevation level */
    elevation?: 'flat' | 'raised' | 'overlay';
    /** Border radius size */
    radius?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
    /** Add subtle border */
    bordered?: boolean;
    /** Padding size */
    padding?: 'none' | 'sm' | 'md' | 'lg';
    /** Enable hover lift effect (for interactive surfaces) */
    hoverable?: boolean;
}

/**
 * Surface is the foundational container primitive.
 * Use for cards, panels, modals, and any boxed content.
 * 
 * @example
 * <Surface elevation="raised" radius="lg" padding="md">
 *    Card content here
 * </Surface>
 */
export const Surface = forwardRef<HTMLDivElement, SurfaceProps>(
    function Surface(
        {
            children,
            elevation = 'flat',
            radius = 'md',
            bordered = false,
            padding = 'none',
            hoverable = false,
            className,
            ...props
        },
        ref
    ) {
        return (
            <div
                ref={ref}
                className={cn(
                    styles.surface,
                    styles[`elevation-${elevation}`],
                    styles[`radius-${radius}`],
                    styles[`padding-${padding}`],
                    bordered && styles.bordered,
                    hoverable && styles.hoverable,
                    className
                )}
                {...props}
            >
                {children}
            </div>
        );
    }
);