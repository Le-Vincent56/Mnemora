import { useMemo } from 'react';
  import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
  import {
    Book,
    Dice5,
    Search,
    Settings,
    Plus,
    Filter,
    Shield,
    StickyNote,
    Timer,
  } from 'lucide-react';
  import { IconRailItem } from './IconRailItem';
  import { IconRailBadge } from './IconRailBadge';
  import './IconRail.css';

  type AppMode = 'prep' | 'session';

  interface IconRailProps {
    mode: AppMode;
    onModeChange: (mode: AppMode) => void;
    onSearchClick?: () => void;
    onSettingsClick?: () => void;
    // Prep mode actions
    onCreateClick?: () => void;
    onFilterClick?: () => void;
    isFilterActive?: boolean;
    // Session mode props
    isSessionActive?: boolean;
    safetyToolCount?: number;
    quickNoteCount?: number;
    timerVisible?: boolean;
    onSafetyToolsClick?: () => void;
    onQuickNotesClick?: () => void;
    onTimerToggle?: () => void;
  }

  // Animation variants for contextual icons
  const contextualVariants = {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 },
  };

  const staggerChildren = {
    animate: {
      transition: {
        staggerChildren: 0.055,
        delayChildren: 0.1,
      },
    },
    exit: {
      transition: {
        staggerChildren: 0.055,
        staggerDirection: -1,
      },
    },
  };

  const itemTransition = {
    duration: 0.2,
    ease: [0.23, 1, 0.32, 1],
  };

  export function IconRail({
    mode,
    onModeChange,
    onSearchClick,
    onSettingsClick,
    onCreateClick,
    onFilterClick,
    isFilterActive = false,
    isSessionActive = false,
    safetyToolCount = 0,
    quickNoteCount = 0,
    timerVisible = false,
    onSafetyToolsClick,
    onQuickNotesClick,
    onTimerToggle,
  }: IconRailProps) {
    // Determine if we should use reduced motion
    const prefersReducedMotion = useMemo(() => {
      if (typeof window === 'undefined') return false;
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }, []);

    const animationProps = prefersReducedMotion
      ? { initial: false, animate: 'animate', exit: 'animate' }
      : { initial: 'initial', animate: 'animate', exit: 'exit' };

    return (
      <LayoutGroup>
        <nav className="icon-rail" data-mode={mode} aria-label="Main navigation">
          {/* Logo */}
          <div className="icon-rail__logo" aria-hidden="true">
            M
          </div>

          <div className="icon-rail__divider" aria-hidden="true" />

          {/* Search - Always visible */}
          <IconRailItem
            icon={<Search size={20} />}
            label="Search"
            shortcut="⌘K"
            onClick={onSearchClick}
          />

          <div className="icon-rail__divider" aria-hidden="true" />

          {/* Mode Toggle */}
          <IconRailItem
            icon={<Book size={20} />}
            label="Prep Mode"
            isActive={mode === 'prep'}
            onClick={() => onModeChange('prep')}
            showGlow={mode === 'prep'}
          />
          <IconRailItem
            icon={<Dice5 size={20} />}
            label="Session Mode"
            isActive={mode === 'session'}
            onClick={() => onModeChange('session')}
            showGlow={mode === 'session'}
          />

          <div className="icon-rail__divider" aria-hidden="true" />

          {/* Contextual Section - Mode-specific icons */}
          <div className="icon-rail__contextual" role="group" aria-label="Mode tools">
            <AnimatePresence mode="wait">
              {mode === 'prep' ? (
                <motion.div
                  key="prep-tools"
                  className="icon-rail__contextual-group"
                  variants={staggerChildren}
                  {...animationProps}
                >
                  <motion.div variants={contextualVariants} transition={itemTransition}>
                    <IconRailItem
                      icon={<Plus size={20} />}
                      label="Create Entity"
                      shortcut="⌘N"
                      onClick={onCreateClick}
                    />
                  </motion.div>
                  <motion.div variants={contextualVariants} transition={itemTransition}>
                    <IconRailItem
                      icon={<Filter size={20} />}
                      label="Filter"
                      isActive={isFilterActive}
                      onClick={onFilterClick}
                    />
                  </motion.div>
                </motion.div>
              ) : (
                <motion.div
                  key="session-tools"
                  className="icon-rail__contextual-group"
                  variants={staggerChildren}
                  {...animationProps}
                >
                  <motion.div variants={contextualVariants} transition={itemTransition}>
                    <IconRailItem
                      icon={<Shield size={20} />}
                      label="Safety Tools"
                      shortcut="S"
                      onClick={onSafetyToolsClick}
                      disabled={!isSessionActive}
                      badge={
                        safetyToolCount > 0 && isSessionActive ? (
                          <IconRailBadge count={safetyToolCount} variant="session" />
                        ) : undefined
                      }
                    />
                  </motion.div>
                  <motion.div variants={contextualVariants} transition={itemTransition}>
                    <IconRailItem
                      icon={<StickyNote size={20} />}
                      label="Quick Notes"
                      shortcut="N"
                      onClick={onQuickNotesClick}
                      disabled={!isSessionActive}
                      badge={
                        quickNoteCount > 0 && isSessionActive ? (
                          <IconRailBadge count={quickNoteCount} variant="session" />
                        ) : undefined
                      }
                    />
                  </motion.div>
                  <motion.div variants={contextualVariants} transition={itemTransition}>
                    <IconRailItem
                      icon={<Timer size={20} />}
                      label={timerVisible ? 'Hide Timer' : 'Show Timer'}
                      shortcut="T"
                      isActive={timerVisible && isSessionActive}
                      onClick={onTimerToggle}
                      disabled={!isSessionActive}
                    />
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Spacer */}
          <div className="icon-rail__spacer" />

          <div className="icon-rail__divider" aria-hidden="true" />

          {/* Settings - Always visible */}
          <IconRailItem
            icon={<Settings size={20} />}
            label="Settings"
            shortcut="⌘,"
            onClick={onSettingsClick}
          />
        </nav>
      </LayoutGroup>
    );
  }