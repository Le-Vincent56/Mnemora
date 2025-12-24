import { ReactNode } from 'react';
import { IconRail } from './IconRail';
import './AppShell.css';

type AppMode = 'prep' | 'session';

interface AppShellProps {
    mode: AppMode;
    onModeChange: (mode: AppMode) => void;
    children: ReactNode;
    // IconRail passthrough props
    onSearchClick?: () => void;
    onSettingsClick?: () => void;
    // Prep mode
    onCreateClick?: () => void;
    onFilterClick?: () => void;
    isFilterActive?: boolean;
    // Session mode
    isSessionActive?: boolean;
    safetyToolCount?: number;
    quickNoteCount?: number;
    timerVisible?: boolean;
    onSafetyToolsClick?: () => void;
    onQuickNotesClick?: () => void;
    onTimerToggle?: () => void;
}

export function AppShell({
    mode,
    onModeChange,
    children,
    onSearchClick,
    onSettingsClick,
    onCreateClick,
    onFilterClick,
    isFilterActive,
    isSessionActive,
    safetyToolCount,
    quickNoteCount,
    timerVisible,
    onSafetyToolsClick,
    onQuickNotesClick,
    onTimerToggle,
}: AppShellProps) {
    return (
        <div className="app-shell" data-mode={mode}>
            <IconRail
                mode={mode}
                onModeChange={onModeChange}
                onSearchClick={onSearchClick}
                onSettingsClick={onSettingsClick}
                onCreateClick={onCreateClick}
                onFilterClick={onFilterClick}
                isFilterActive={isFilterActive}
                isSessionActive={isSessionActive}
                safetyToolCount={safetyToolCount}
                quickNoteCount={quickNoteCount}
                timerVisible={timerVisible}
                onSafetyToolsClick={onSafetyToolsClick}
                onQuickNotesClick={onQuickNotesClick}
                onTimerToggle={onTimerToggle}
            />
            <main className="app-shell__content">
                {children}
            </main>
        </div>
    );
}