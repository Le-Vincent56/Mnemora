import { useRef, useEffect } from 'react';
import {
  LayoutDashboard,
  Library,
  CalendarClock,
  Clapperboard,
  Search,
  FolderOpen,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/utils';
import styles from './prep.module.css';

export interface PrepTab {
  id: string;
  label: string;
  icon: LucideIcon;
  accentColor: string;
  status: 'real' | 'mocked' | 'partial';
}

const PREP_TABS: PrepTab[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, accentColor: 'var(--primary)', status: 'mocked' },
  { id: 'entities', label: 'Entities', icon: Library, accentColor: 'var(--primary)', status: 'real' },
  { id: 'events', label: 'Events', icon: CalendarClock, accentColor: 'var(--primary)', status: 'partial' },
  { id: 'sessions', label: 'Sessions', icon: Clapperboard, accentColor: 'var(--entity-session)', status: 'real' },
  { id: 'search', label: 'Search', icon: Search, accentColor: 'var(--primary)', status: 'mocked' },
  { id: 'assets', label: 'Assets', icon: FolderOpen, accentColor: 'var(--primary)', status: 'mocked' },
];

export interface PrepTabStripProps {
  activeTab: string;
  onTabChange: (tab: PrepTab) => void;
  className?: string;
}

export function PrepTabStrip({ activeTab, onTabChange, className }: PrepTabStripProps) {
  const stripRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  // Scroll active tab into view on mobile
  useEffect(() => {
    if (activeRef.current && stripRef.current) {
      activeRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [activeTab]);

  return (
    <div
      ref={stripRef}
      className={cn(styles.tabStrip, className)}
      role="tablist"
      aria-label="Prep Mode pages"
    >
      {PREP_TABS.map((tab) => {
        const isActive = tab.id === activeTab;
        const TabIcon = tab.icon;

        return (
          <button
            key={tab.id}
            ref={isActive ? activeRef : undefined}
            role="tab"
            aria-selected={isActive}
            aria-controls={`prep-page-${tab.id}`}
            className={cn(
              styles.tabItem,
              isActive && styles.tabItemActive,
            )}
            style={{
              '--_tab-accent': tab.accentColor,
            } as React.CSSProperties}
            onClick={() => onTabChange(tab)}
          >
            <TabIcon
              className={styles.tabItemIcon}
              aria-hidden="true"
            />
            <span className={styles.tabItemLabel}>{tab.label}</span>
            {tab.status === 'mocked' && (
              <span className={styles.tabStatusDot} title="Mocked (no backend)" />
            )}
          </button>
        );
      })}
    </div>
  );
}
