import { Book, Dice5, Search, Settings } from 'lucide-react';
import { IconRailItem } from './IconRailItem';
import './IconRail.css';

type AppMode = 'prep' | 'session';

interface IconRailProps {
    mode: AppMode;
    onModeChange: (mode: AppMode) => void;
}

export function IconRail({ mode, onModeChange }: IconRailProps) {
    return (
        <nav className="icon-rail">
            <div className="icon-rail__logo">M</div>

            <div className="icon-rail__divider" />

            <IconRailItem
                icon={<Search size={20} />}
                label="Search"
                shortcut="⌘K"
            />

            <div className="icon-rail__divider" />

            <IconRailItem
                icon={<Book size={20} />}
                label="Prep Mode"
                isActive={mode === 'prep'}
                onClick={() => onModeChange('prep')}
            />
            <IconRailItem
                icon={<Dice5 size={20} />}
                label="Session Mode"
                isActive={mode === 'session'}
                onClick={() => onModeChange('session')}
            />

            <div className="icon-rail__spacer" />

            <div className="icon-rail__divider" />

            <IconRailItem
                icon={<Settings size={20} />}
                label="Settings"
            />
        </nav>
    );
}