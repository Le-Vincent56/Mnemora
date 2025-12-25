import { forwardRef, type ReactNode, type HTMLAttributes } from 'react';
import { cn } from '@/utils';
import styles from './primitives.module.css';

export interface StackProps extends HTMLAttributes<HTMLDivElement> {
    /** Content to stack */
    children: ReactNode;
    /** Stack direction */
    direction?: 'vertical' | 'horizontal';
    /** Gap between items */
    gap?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12;
    /** Horizontal alignment */
    align?: 'start' | 'center' | 'end' | 'stretch';
    /** Vertical alignment (for horizontal stacks) */
    justify?: 'start' | 'center' | 'end' | 'between' | 'around';
    /** Allow wrapping */
    wrap?: boolean;
}

/**
 * Stack arranges children in a vertical or horizontal flow.
 * 
 * @example
 * <Stack direction="horizontal" gap={4} align="center">
 *    <Icon />
 *    <Text>Label</Text>
 * </Stack>
 */
export const Stack = forwardRef<HTMLDivElement, StackProps>(
    function Stack(
        {
            children,
            direction = 'vertical',
            gap = 0,
            align = 'stretch',
            justify = 'start',
            wrap = false,
            className,
            style,
            ...props
        },
        ref
    ) {
        return (
            <div
                ref={ref}
                className={cn(
                    styles.stack,
                    styles[`stack-${direction}`],
                    styles[`align-${align}`],
                    styles[`justify-${justify}`],
                    wrap && styles.wrap,
                    className
                )}
                style={{
                    gap: `var(--space-${gap})`,
                    ...style,
                }}
                {...props}
            >
                {children}
            </div>
        );
    }
);