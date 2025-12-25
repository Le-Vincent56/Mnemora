import { forwardRef, type ReactNode, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/utils';
import styles from './primitives.module.css'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    /** Button constant */
    children: ReactNode;
    /** Visual style variant */
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    /** Size variant */
    size?: 'sm' | 'md' | 'lg';
    /** Full width button */
    fullWidth?: boolean;
    /** Icon-only button (square aspect ration) */
    iconOnly?: boolean;
}

/**
 * Button primitive with variants for different contexts.
 * 
 * Primary: Main call-to-action (filled)
 * Secondary: Secondary actions (outlined)
 * Ghost: Tertiary actions (minimal)
 * Danger: Destructive actions (red)
 * 
 * @example
 * <Button variant="primary" size="md">Start Session</Button>
 * <Button variant="ghost" iconOnly><Icon /><Button>
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    function Button(
        {
            children,
            variant = 'secondary',
            size = 'md',
            fullWidth = false,
            iconOnly = false,
            className,
            disabled,
            ...props
        },
        ref
    ) {
        return (
            <button
                ref={ref}
                className={cn(
                    styles.button,
                    styles[`button-${variant}`],
                    styles[`button-${size}`],
                    fullWidth && styles.fullWidth,
                    iconOnly && styles.iconOnly,
                    className
                )}
                disabled={disabled}
                {...props}
            >
                {children}
            </button>
        );
    }
);