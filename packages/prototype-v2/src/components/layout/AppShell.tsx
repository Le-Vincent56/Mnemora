import { type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/utils';
import { EASING } from '@/tokens';
import styles from './layout.module.css';

/**
 * Props for the AppShell component
 */
export interface AppShellProps {
    /** Navigation rail slot (typically IconRail) */
    rail: ReactNode;
    /** Main content slot */
    children: ReactNode;
    /** Optional header content above main content */
    header?: ReactNode;
    /** Additional CSS classes for the shell container */
    className?: string;
    /** Additional CSS classes for the content area */
    contentClassName?: string;
    /** Whether to aniamte content entrance (default: true) */
    animateContent?: boolean;
}

/**
 * Memory surfacing animation variants for content area.
 * Content emerges from below with a gentle fade,
 * embodying the "memories rising to the surface"
 */
const contentVariants = {
    hidden: {
        opacity: 0,
        y: 24,
    },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.4,
            ease: EASING.memory,
        },
    },
};

/**
 * Main application layout shell.
 * Provides the foundational two-column structure:
 * - Fixed 48px IconRail on the left
 * - Fluid content area on the right
 *
 * Uses slot-based composition for maximum flexibility.
 * The shell itself is "invisible infrastructure" — it doesn't
 * draw attention, allowing content and ceremony to shine.
 *
 * @example
 * ```tsx
 * <AppShell
 *   rail={<IconRail mode={mode} onNavigate={handleNav} />}
 *   header={<PageHeader title="Entities" />}
 * >
 *   <EntityBrowser entities={entities} />
 * </AppShell>
 * ```
*/
export function AppShell({
    rail,
    children,
    header,
    className,
    contentClassName,
    animateContent = true,
}: AppShellProps) {
    const ContentWrapper = animateContent ? motion.main : 'main';
    const contentProps = animateContent
        ? {
            variants: contentVariants,
            initial: 'hidden',
            animate: 'visible'
        }
        : { };
    
        return (
            <div className={cn(styles.shell, className)}>
                {/* Navigation rail - fixed position */}
                {rail}

                {/* Content Area - fluid, scrollable */}
                <ContentWrapper
                    className={cn(styles.content, contentClassName)}
                    {...contentProps}
                >
                    {/* Optional header */}
                    {header && (
                        <header className={styles.contentHeader}>
                            {header}
                        </header>
                    )}

                    {/* Main Content */}
                    {children}
                </ContentWrapper>
            </div>
        );
}

/**
 * Pre-styled page header for use within AppShell.
 * Provides consistent title/subtitle typography.
 */
export interface PageHeaderProps {
    /** Page title (uses display font) */
    title: string;
    /** Optional subtitle */
    subtitle?: string;
    /** Optional right-aligned actions */
    actions?: ReactNode;
    /** Additional CSS classes */
    className?: string;
}

export function PageHeader({
    title,
    subtitle,
    actions,
    className
}: PageHeaderProps) {
    return (
        <div
            className={cn(styles.contentHeader, className)}
            style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start'
            }}
        >
            <div>
                <h1 className={styles.contentTitle}>{title}</h1>
                {subtitle && (
                    <p className={styles.contentSubtitle}>{subtitle}</p>
                )}
            </div>
            {actions && (
                <div style={{ flexShrink: 0 }}>
                    {actions}
                </div>
            )}
        </div>
    );
}

export default AppShell;