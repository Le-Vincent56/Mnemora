import type { LucideIcon } from 'lucide-react';
import { cn } from '@/utils';
import { Icon } from '@/primitives';
import styles from './composed.module.css';

export interface ViewToggleOption {
    /** Unique value identifier */
    value: string;
    /** Lucide icon for the option */
    icon: LucideIcon;
    /** Accessible label */
    label: string;
}

export interface ViewToggleProps {
    /** Available view options */
    options: ViewToggleOption[];
    /** Currently selected value */
    value: string;
    /** Called when selection changes */
    onChange: (value: string) => void;
    /** Additional CSS classes */
    className?: string;
}

/**
 * Segmented radio toggle for switching between views.
 * Used in Prep Mode header for card/list view switching.
 *
 * @example
 * <ViewToggle
 *   options={[
 *     { value: 'grid', icon: LayoutGrid, label: 'Card view' },
 *     { value: 'list', icon: List, label: 'List view' },
 *   ]}
 *   value={view}
 *   onChange={setView}
 * />
 */
export function ViewToggle({
    options,
    value,
    onChange,
    className,
}: ViewToggleProps) {
    return (
        <div className={cn(styles.viewToggle, className)} role="radiogroup">
            {options.map((opt) => (
                <button
                    key={opt.value}
                    type="button"
                    role="radio"
                    aria-checked={value === opt.value}
                    aria-label={opt.label}
                    className={cn(
                        styles.viewToggleOption,
                        value === opt.value && styles.viewToggleOptionActive
                    )}
                    onClick={() => onChange(opt.value)}
                >
                    <Icon icon={opt.icon} size={16} color="inherit" />
                </button>
            ))}
        </div>
    );
}
