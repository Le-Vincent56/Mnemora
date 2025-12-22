import { useState } from 'react';
import { ChevronDown, Square } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { SessionSwitcher } from './SessionSwitcher';
import { ActiveSession } from '@/types/session';
import { Entity } from '@/data/mockData';
import './SessionHeader.css';

interface SessionHeaderProps {
    activeSession: ActiveSession;
    onSwitchSession: (sessionEntity: Entity) => void;
    onEndSession: () => void;
}

export function SessionHeader({
    activeSession,
    onSwitchSession,
    onEndSession,
}: SessionHeaderProps) {
    const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);

    const toggleSwitcher = () => {
        setIsSwitcherOpen((prev) => !prev);
    };

    const handleSwitch = (sessionEntity: Entity) => {
        onSwitchSession(sessionEntity);
        setIsSwitcherOpen(false);
    };

    return (
        <header className="session-header">
            <div className="session-header__info">
                <button className="session-header__session-btn" onClick={toggleSwitcher}>
                    <span className="session-header__session-name">
                        {activeSession.sessionEntity.name}
                    </span>
                    <ChevronDown
                        size={14}
                        className={`session-header__chevron ${isSwitcherOpen ? 'session-header__chevron--open' : ''}`}
                    />
                </button>
                <span className="session-header__campaign">{activeSession.campaign.name}</span>

                {/* Session Switcher Dropdown */}
                <SessionSwitcher
                    currentSessionID={activeSession.sessionID}
                    campaign={activeSession.campaign}
                    onSwitch={handleSwitch}
                    onClose={() => setIsSwitcherOpen(false)}
                    isOpen={isSwitcherOpen}
                />
            </div>

            <div className="session-header__actions">
                <Button
                    variant="ghost"
                    onClick={onEndSession}
                    className="session-header__end-btn"
                >
                    <Square size={12} />
                    End Session
                </Button>
            </div>
        </header>
    );
}