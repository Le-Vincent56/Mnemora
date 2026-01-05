import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '@/utils';
import styles from './primitives.module.css';

export interface DividerProps extends HTMLAttributes<HTMLElement> {
    /** Line direction */
    orientation?: 'horizontal' | 'vertical';
    /** Margin on prependicular axis */
    spacing?: 'none' | 'sm' | 'md' | 'lg';
}

/**
 * Visual separation between content sections.
 * Uses semantic elements based on orientation.
 *
 * @example
 * <Divider spacing="md" />
 * <Divider orientation="vertical" spacing="sm" />
 */
export const Divider = forwardRef<HTMLHRElement, DividerProps>(
    function Divider(
        {
            orientation = 'horizontal',
            spacing = 'none',
            className,
            ...props
        },
        ref
    ) {
        if(orientation === 'vertical') {
            return (
                <div
                    ref={ref as React.Ref<HTMLDivElement>}
                    role="separator"
                    aria-orientation="vertical"
                    className={cn(
                        styles.divider,
                        styles['divider-vertical'],
                        spacing !== 'none' && styles[`divider-spacing-${spacing}`],
                        className
                    )}
                    {...props}
                />
            );
        }

        return (
            <hr
                ref={ref}
                className={cn(
                    styles.divider,
                    styles['divider-horizontal'],
                    spacing !== 'none' && styles[`divider-spacing-${spacing}`],
                    className
                )}
                {...props}
            />
        );
    }
);