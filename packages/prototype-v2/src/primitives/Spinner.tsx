import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '@/utils';
import styles from './primitives.module.css';

export interface SpinnerProps extends HTMLAttributes<HTMLDivElement> {
    /** Size preset */
    size?: 'sm' | 'md';
}

/**
 * Inline loading indicator with reduced-motion support.
 * Uses CSS animation for smooth spinning.
 *
 * @example
 * <Spinner size="sm" />
 * <Button disabled><Spinner size="sm" /> Saving...</Button>
 */
export const Spinner = forwardRef<HTMLDivElement, SpinnerProps>(
    function Spinner(
        {
            size = 'md',
            className,
            ...props
        },
        ref
    ) {
        return (
            <div
                ref={ref}
                role="status"
                aria-label="Loading"
                className={cn(
                    styles.spinner,
                    styles[`spinner-${size}`],
                    className
                )}
                {...props}
            />
        );
    }
);