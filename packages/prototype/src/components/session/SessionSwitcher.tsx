import { useRef, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { Entity, getAllEntities } from '@/data/mockData';
import { Campaign } from '@/data/mockWorldData';
import { AnimatePresence, motion } from 'framer-motion';
import './SessionSwitcher.css';

interface SessionSwitcherProps {
    currentSessionID: string;
    campaign: Campaign;
    onSwitch: (sessionEntity: Entity) => void;
    onClose: () => void;
    isOpen: boolean;
}

export function SessionSwitcher({
    currentSessionID,
    campaign,
    onSwitch,
    onClose,
    isOpen,
}: SessionSwitcherProps) {
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Get all session entities
    const sessionEntities = getAllEntities().filter((e) => e.type === 'session');

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    // Close on escape
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen, onClose]);

    const handleSelect = (session: Entity) => {
        if (session.id !== currentSessionID) {
            onSwitch(session);
        }
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    ref={dropdownRef}
                    className="session-switcher"
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
                >
                    <div className="session-switcher__header">
                        <span className="session-switcher__label">Switch Session</span>
                        <span className="session-switcher__campaign">{campaign.name}</span>
                    </div>

                    <div className="session-switcher__list">
                        {sessionEntities.length === 0 ? (
                            <div className="session-switcher__empty">
                                No other sessions available
                            </div>
                        ) : (
                            sessionEntities.map((session) => (
                                <button
                                    key={session.id}
                                    className={`session-switcher__item ${session.id === currentSessionID
                                            ? 'session-switcher__item--current'
                                            : ''
                                        }`}
                                    onClick={() => handleSelect(session)}
                                >
                                    <Calendar size={14} className="session-switcher__icon" />
                                    <span className="session-switcher__name">{session.name}</span>
                                    {session.id === currentSessionID && (
                                        <span className="session-switcher__badge">Current</span>
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}