import { forwardRef, type InputHTMLAttributes } from 'react';
import { Search } from 'lucide-react';
import { cn } from '@/utils';
import { Icon, Badge } from '@/primitives';
import styles from './composed.module.css';

export interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
    /** Keyboard shortcut label to display (e.g. "⌘K") */
    shortcut?: string;
    /** Visual size */
    size?: 'sm' | 'md';
}

/**
 * Styled search input with leading icon and optional shortcut badge.
 * Used in Prep Mode header and as the base for Session SearchPortal.
 *
 * @example
 * <SearchInput placeholder="Summon..." shortcut="⌘K" />
 * <SearchInput placeholder="Search your world..." size="md" />
 */
export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
    function SearchInput(
        {
            shortcut,
            size = 'md',
            className,
            ...props
        },
        ref
    ) {
        return (
            <div className={cn(
                styles.searchInput,
                styles[`searchInput-${size}`],
                className
            )}>
                <Icon
                    icon={Search}
                    size={size === 'sm' ? 16 : 20}
                    color="muted"
                    className={styles.searchInputIcon}
                />
                <input
                    ref={ref}
                    type="search"
                    className={styles.searchInputField}
                    {...props}
                />
                {shortcut && (
                    <Badge variant="default" size="sm" className={styles.searchInputShortcut}>
                        {shortcut}
                    </Badge>
                )}
            </div>
        );
    }
);
