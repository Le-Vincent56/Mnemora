import { type ReactNode, useId } from 'react';
import { cn } from '@/utils';
import { Text } from '@/primitives';
import styles from './composed.module.css';

export interface FormFieldProps {
    /** Field label */
    label: string;
    /** Input element (receives id via render prop) */
    children: (id: string) => ReactNode;
    /** Error message (replaces helper when present) */
    error?: string;
    /** Helper text below the input */
    helper?: string;
    /** Mark field as required (shows asterisk) */
    required?: boolean;
    /** Additional CSS classes */
    className?: string;
}

/**
 * Accessible form field wrapper with label, input slot, and error/helper text.
 * Uses render prop for input to ensure correct id/htmlFor linking.
 *
 * @example
 * <FormField label="World Name" required error={nameError}>
 *   {(id) => <input id={id} value={name} onChange={...} />}
 * </FormField>
 */
export function FormField({
    label,
    children,
    error,
    helper,
    required = false,
    className,
}: FormFieldProps) {
    const id = useId();
    const message = error || helper;
    const messageId = message ? `${id}-msg` : undefined;

    return (
        <div className={cn(styles.formField, className)}>
            <label htmlFor={id} className={styles.formFieldLabel}>
                <Text variant="body-sm" weight="medium" color="secondary" as="span">
                    {label}
                </Text>
                {required && (
                    <span className={styles.formFieldRequired} aria-hidden="true">
                        *
                    </span>
                )}
            </label>

            <div
                className={cn(
                    styles.formFieldInput,
                    error && styles.formFieldInputError
                )}
                aria-describedby={messageId}
            >
                {children(id)}
            </div>

            {message && (
                <Text
                    id={messageId}
                    variant="body-sm"
                    color={error ? 'inherit' : 'tertiary'}
                    as="span"
                    className={cn(error && styles.formFieldError)}
                >
                    {message}
                </Text>
            )}
        </div>
    );
}
