import {
    Globe,
    Library,
    Search,
    History,
    Play,
    Clock,
    BookOpen,
    FileText,
    Shield,
    Square,
} from 'lucide-react';
import { useCeremony, CeremonyType } from '@/ceremony';
import { cn } from '@/utils';
import { IconRailItem } from './IconRailItem';
import styles from "./layout.module.css";

/**
 * Navigation item configuration
 */
interface NavItem {
    id: string;
    icon: typeof Globe;
    label: string;
}

/**
 * Prep Mode navigation items
 */
const PREP_NAV_ITEMS: NavItem[] = [
    { id: 'world', icon: Globe, label: 'World' },
    { id: 'entities', icon: Library, label: 'Entities' },
    { id: 'search', icon: Search, label: 'Search' },
    { id: 'history', icon: History, label: 'Session History' },
];

/**
 * Session Mode navigation items
 */
const SESSION_NAV_ITEMS: NavItem[] = [
    { id: 'quick-ref', icon: BookOpen, label: 'Quick Reference' },
    { id: 'notes', icon: FileText, label: 'Notes' },
    { id: 'safety', icon: Shield, label: 'Safety Tools' },
]

/**
 * Props for IconRail component
 */
export interface IconRailProps {
    /** Current application mode */
    mode: 'prep' | 'session';
    /** Currently active navigation item ID */
    activeItem?: string;
    /** Callback when a navigation item is clicked */
    onNavigate?: (itemId: string) => void;
    /** Optional: Override ceremony trigger (for testing) */
    onModeSwitch?: () => void;
    /** Optional: Session timer display (only shown in Session mode) */
    sessionTime?: string;
    /** Additional CSS classes */
    className?: string;
}

/**
 * Vertical navigation rail with mode-specific items.
 *
 * Displays different navigation options based on current mode:
 * - Prep Mode: World, Entities, Search, History, Start Session
 * - Session Mode: Timer, Quick Ref, Notes, Safety, End Session
 *
 * The mode switch button (Start/End Session) triggers the ceremony
 * transition and is disabled during active ceremonies.
 *
 * @example
 * ```tsx
 * <IconRail
 *   mode={mode}
 *   activeItem="entities"
 *   onNavigate={(id) => setActiveView(id)}
 * />
 * ```
 */
export function IconRail({
    mode,
    activeItem,
    onNavigate,
    onModeSwitch,
    sessionTime,
    className,
}: IconRailProps) {
    const { isBlocking, controls } = useCeremony();

    // Get navigation items for current mode
    const navItems = mode === 'prep' ? PREP_NAV_ITEMS : SESSION_NAV_ITEMS;

    // Handle mode switch - use provided callback or ceremony system
    const handleModeSwitch = () => {
        if(onModeSwitch) {
            onModeSwitch();
        } else {
            const ceremonyType = mode === 'prep'
                ?  CeremonyType.PREP_TO_SESSION
                : CeremonyType.SESSION_TO_PREP;
            
            controls.triggerCeremony(ceremonyType);
        }
    };

    // Mode switch button configuration
    const modeSwitchConfig = mode === 'prep'
        ? { icon: Play, label: 'Start Session' }
        : { icon: Square, label: 'End Session' };

    return (
        <nav
            className={cn(styles.rail, className)}
            aria-label={`${mode === 'prep' ? 'Preparation' : 'Session'} navigation`}
        >
            {/* Top navigation group */}
            <div className={styles.railGroup}>
                {/* Session Mode: Timer display at top */}
                {mode === 'session' && (
                    <div 
                        className={styles.timerDisplay}
                        aria-label="Session timer"
                    >
                        <Clock 
                            className={styles.timerDisplayIcon}
                            aria-hidden="true"
                        />
                        <span className={styles.timerDisplayTime}>
                            { sessionTime ?? '0:00' }
                        </span>
                    </div>
                )}

                {/* Navigation Items */}
                {navItems.map((item) => (
                    <IconRailItem
                        key={item.id}
                        icon={item.icon}
                        label={item.label}
                        isActive={activeItem === item.id}
                        onClick={() => onNavigate?.(item.id)}
                    />
                ))}
            </div>

            {/* Separator */}
            <div className={styles.railSeparator} aria-hidden="true" />

            {/* Bottom group: Mode switch */}
            <div className={cn(styles.railGroup, styles.railGroupBottom)}>
                <IconRailItem
                    icon={modeSwitchConfig.icon}
                    label={modeSwitchConfig.label}
                    onClick={handleModeSwitch}
                    isModeSwitch
                    ceremonyActive={isBlocking}
                />
            </div>
        </nav>
    );
}

export default IconRail;