import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, User, MapPin, Users, FileText, StickyNote, ChevronDown } from 'lucide-react';
import './CreateEntityDropdown.css';

export type EntityType = 'character' | 'location' | 'faction' | 'session' | 'note';

interface CreateEntityDropdownProps {
    onCreateEntity: (type: EntityType) => void;
}

const ENTITY_OPTIONS: { type: EntityType; label: string; icon: React.ReactNode }[] = [
    { type: 'character', label: 'Character', icon: <User size={16} /> },
    { type: 'location', label: 'Location', icon: <MapPin size={16} /> },
    { type: 'faction', label: 'Faction', icon: <Users size={16} /> },
    { type: 'session', label: 'Session', icon: <FileText size={16} /> },
    { type: 'note', label: 'Note', icon: <StickyNote size={16} /> },
];

export function CreateEntityDropdown({ onCreateEntity }: CreateEntityDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
                e.preventDefault();
                setIsOpen(true);
            }
            if (e.key === 'Escape' && isOpen) {
                setIsOpen(false);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

    const handleSelect = useCallback((type: EntityType) => {
        onCreateEntity(type);
        setIsOpen(false);
    }, [onCreateEntity]);

    return (
        <div className="create-dropdown" ref={dropdownRef}>
            <button
                className={`create-dropdown__trigger ${isOpen ? 'create-dropdown__trigger--active' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
                aria-haspopup="menu"
                aria-label="Create new entity"
            >
                <Plus size={16} className="create-dropdown__plus" />
                <span className="create-dropdown__text">New</span>
                <motion.span
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <ChevronDown size={14} className="create-dropdown__chevron" />
                </motion.span>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="create-dropdown__menu"
                        initial={{ opacity: 0, y: -8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.98 }}
                        transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
                        role="menu"
                        aria-label="Entity types"
                    >
                        {/* Use CSS animations for menu items, not Framer Motion */}
                        {ENTITY_OPTIONS.map((option, i) => (
                            <button
                                key={option.type}
                                className="create-dropdown__item"
                                data-type={option.type}
                                onClick={() => handleSelect(option.type)}
                                style={{ animationDelay: `${i * 0.03}s` }}
                                role="menuitem"
                            >
                                <span className="create-dropdown__item-icon">
                                    {option.icon}
                                </span>
                                <span className="create-dropdown__item-label">
                                    {option.label}
                                </span>
                            </button>
                        ))}

                        <div
                            className="create-dropdown__footer"
                            style={{ animationDelay: '0.15s' }}
                        >
                            <kbd>⌘N</kbd> to create quickly
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}