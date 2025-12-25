/**
 * Utility for conditionally joining class names.
 * Filters out falsy values and joins with spaces.
 * 
 * @example
 * cn('base', isActive && 'active', isDisabled && 'disabled')
 * // -> "base active" (if isActive = true, isDisabled = false)
 * 
 * @example
 * cn(styles.card, variant === 'elevated' && styles.elevated)
 */
export function cn(...classes: (string | false | null | undefined)[]): string {
    return classes.filter(Boolean).join(' ');
}