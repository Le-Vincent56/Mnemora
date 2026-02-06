import { type ReactNode } from 'react';
import { cn } from '@/utils';
import { Text } from '@/primitives';
import styles from './composed.module.css';

export interface SectionHeaderProps {
    /** Section label text */
    title: string;
    /** Optional right-aligned action (button, link, etc.) */
    action?: ReactNode;
    /** Show bottom border (default: true) */
    bordered?: boolean;
    /** Text variant for the title */
    variant?: 'heading' | 'caption';
    /** Additional CSS classes */
    className?: string;
}

/**
 * Labeled section header with optional right-side action.
 * Used to introduce content groups across the app.
 *
 * @example
 * <SectionHeader title="Characters" action={<Button variant="ghost" size="sm">See all</Button>} />
 * <SectionHeader title="Filters" variant="caption" bordered={false} />
 */
export function SectionHeader({
    title,
    action,
    bordered = true,
    variant = 'caption',
    className,
}: SectionHeaderProps) {
    return (
        <div
            className={cn(
                styles.sectionHeader,
                bordered && styles.sectionHeaderBordered,
                className
            )}
        >
            <Text
                variant={variant}
                color={variant === 'caption' ? 'tertiary' : 'primary'}
                as="span"
            >
                {title}
            </Text>
            {action && (
                <div className={styles.sectionHeaderAction}>
                    {action}
                </div>
            )}
        </div>
    );
}
