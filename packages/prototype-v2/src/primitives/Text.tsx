import { type ReactNode, type ElementType, type HTMLAttributes } from 'react';
import { cn } from '@/utils';
import styles from './primitives.module.css';

type TextVariant =
    | 'display'     // Large headings
    | 'title'       // Section titles
    | 'heading'     // Subsection headings
    | 'body'        // Default body text
    | 'body-sm'     // Smaller body text
    | 'caption'     // Small labels
    | 'mono';        // Code/technical

type TextColor = 'primary' | 'secondary' | 'tertiary' | 'inherit';
type TextWeight = 'normal' | 'medium' | 'semibold' | 'bold';

// Map variants to default elements
const variantElements: Record<TextVariant, ElementType> = {
    display: 'h1',
    title: 'h2',
    heading: 'h3',
    body: 'p',
    'body-sm': 'p',
    caption: 'span',
    mono: 'code',
};

export interface TextProps extends HTMLAttributes<HTMLElement> {
    /** Text content */
    children: ReactNode;
    /** Visual style variant */
    variant?: TextVariant;
    /** Text color */
    color?: TextColor;
    /** Font weight override */
    weight?: TextWeight;
    /** Render as different element */
    as?: ElementType;
}

/**
 * Text handles all typography in the application.
 * Uses Fraunces for display/title variants, Jakarta Sans for body.
 * 
 * @example
 * <Text variant="display">Mnemora</Text>
 * <Text variant="body" color="secondary">Description text</Text>
 * <Text variant="caption" as="label">Form label</Text>
 */
export function Text({
    children,
    variant = 'body',
    color = 'primary',
    weight,
    as,
    className,
    ...props
}: TextProps) {
    const Component = as || variantElements[variant];

    return (
        <Component
            className={cn(
                styles.text,
                styles[`text-${variant}`],
                styles[`color-${color}`],
                weight && styles[`weight-${weight}`],
                className
            )}
            {...props}
        >
            {children}
        </Component>
    );
}