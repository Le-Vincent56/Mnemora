import type { LucideIcon } from 'lucide-react';
import { cn } from '@/utils';
import styles from './primitives.module.css';

export interface IconProps {
    /** Lucide icon component to render */
    icon: LucideIcon;
    /** Pixel size for width and height */
    size?: 16 | 20 | 24;
    /** Design system color token */
    color?: 'primary' | 'secondary' | 'muted' | 'inherit' | 'danger' | 'success';
    /** Required for standalone icons without adjacent text */
    'aria-label'?: string;
    /** Additional CSS class names */
    className?: string;
}

/**
 * Icon wrapper for consistent Lucide icon rendering.
 * Maps design system colors and enforces consistent sizing.
 *
 * @example
 * <Icon icon={Search} size={20} color="secondary" />
 * <Icon icon={AlertCircle} size={24} color="danger" aria-label="Error" />
 */
export function Icon({
    icon: IconComponent,
    size = 20,
    color = 'inherit',
    className,
    'aria-label': ariaLabel,
}: IconProps) {
    const hasLabel = Boolean(ariaLabel);

    return (
        <IconComponent
            size={size}
            strokeWidth={2}
            className={cn(
                styles.icon,
                styles[`icon-color-${color}`],
                className
            )}
            aria-hidden={!hasLabel}
            aria-label={ariaLabel}
            role={hasLabel ? 'img' : undefined}
        />
    );
}