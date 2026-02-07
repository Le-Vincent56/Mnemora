import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye } from 'lucide-react';
import { cn } from '@/utils';
import { useReducedMotion } from '@/hooks';
import { Text, Icon } from '@/primitives';
import { EASING } from '@/tokens';
import { PrepTabStrip, type PrepTab } from './PrepTabStrip';
import { PrepModeWorkspace } from '@/screens/PrepModeWorkspace';
import { PlayerViewPage } from './PrepPageStubs';
import { AssetsWorkspace } from '@/screens/AssetsWorkspace';
import { SearchWorkspace } from '@/screens/SearchWorkspace';
import { SessionsWorkspace } from '@/screens/SessionsWorkspace';
import { EventsWorkspace } from '@/screens/EventsWorkspace';
import { DashboardWorkspace } from '@/screens/DashboardWorkspace';
import styles from './prep.module.css';

export type PrepPage =
  | 'dashboard'
  | 'entities'
  | 'events'
  | 'sessions'
  | 'search'
  | 'assets';

const PAGE_COMPONENTS: Record<PrepPage, React.ComponentType> = {
  dashboard: DashboardWorkspace,
  entities: PrepModeWorkspace,
  events: EventsWorkspace,
  sessions: SessionsWorkspace,
  search: SearchWorkspace,
  assets: AssetsWorkspace,
};

const pageVariants = {
  initial: { opacity: 0, y: 24 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: EASING.memory },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.15, ease: EASING.in },
  },
};

const reducedVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.01 } },
  exit: { opacity: 0, transition: { duration: 0.01 } },
};

export interface PrepModeShellProps {
  className?: string;
}

export function PrepModeShell({ className }: PrepModeShellProps) {
  const initialPage: PrepPage = 'entities';
  const [activePage, setActivePage] = useState<PrepPage>(initialPage);
  const [playerView, setPlayerView] = useState(false);
  const lastActivePageRef = useRef<PrepPage>(initialPage);
  const reducedMotion = useReducedMotion();
  const variants = reducedMotion ? reducedVariants : pageVariants;

  // Keep ref in sync whenever activePage changes outside of player view
  useEffect(() => {
    if (!playerView) {
      lastActivePageRef.current = activePage;
    }
  }, [activePage, playerView]);

  const handleTabChange = useCallback((tab: PrepTab) => {
    setPlayerView(false);
    setActivePage(tab.id as PrepPage);
  }, []);

  const handlePlayerToggle = useCallback(() => {
    setPlayerView((prev) => {
      if (!prev) {
        // Toggling ON — ref already tracks current activePage
        return true;
      }
      // Toggling OFF — restore last active page
      setActivePage(lastActivePageRef.current);
      return false;
    });
  }, []);

  const ActivePageComponent = playerView ? PlayerViewPage : PAGE_COMPONENTS[activePage];
  const animationKey = playerView ? 'player' : activePage;

  return (
    <div className={cn(styles.prepShell, className)}>
      {/* World/Campaign context bar */}
      <div className={styles.worldBar}>
        <Text variant="caption" color="tertiary" style={{ letterSpacing: '0.08em' }}>
          WORLD
        </Text>
        <Text variant="body-sm" weight="medium">
          Brindlemark
        </Text>
        <span className={styles.worldBarDivider} aria-hidden="true" />
        <Text variant="caption" color="tertiary" style={{ letterSpacing: '0.08em' }}>
          CAMPAIGN
        </Text>
        <Text variant="body-sm" weight="medium" color="secondary">
          The Shattered Oath
        </Text>

        {/* Player View toggle — far right */}
        <button
          type="button"
          className={cn(styles.playerToggle, playerView && styles.playerToggleActive)}
          aria-pressed={playerView}
          onClick={handlePlayerToggle}
        >
          <Icon icon={Eye} size={16} />
          <span className={styles.playerToggleLabel}>Player View</span>
        </button>
      </div>

      {/* Tab strip */}
      <PrepTabStrip
        activeTab={activePage}
        onTabChange={handleTabChange}
      />

      {/* Page content */}
      <div className={styles.prepPageContent}>
        <AnimatePresence mode="popLayout">
          <motion.div
            key={animationKey}
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            style={{ height: '100%' }}
          >
            <ActivePageComponent />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
