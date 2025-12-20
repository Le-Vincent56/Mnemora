import { ReactNode } from 'react';
import { IconRail } from './IconRail';
import './AppShell.css';

type AppMode = 'prep' | 'session';

interface AppShellProps {
    mode: AppMode;
    onModeChange: (mode: AppMode) => void;
    children: ReactNode;
}

export function AppShell({ mode, onModeChange, children }: AppShellProps) {
    return (
        <div className="app-shell">
            <IconRail mode={mode} onModeChange={onModeChange} />
            <main className="app-shell__content">
                {children}
            </main>
        </div>
    );
}