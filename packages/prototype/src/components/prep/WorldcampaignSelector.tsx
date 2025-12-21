import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Globe, BookOpen } from 'lucide-react';
import { World, Campaign, formatRelativeTime } from '@/data/mockWorldData';
import './WorldCampaignSelector.css';

interface WorldCampaignSelectorProps {
    world: World;
    campaign: Campaign | null;
    onWorldChange: () => void;
    onCampaignChange: (campaignId: string | null) => void;
}

export function WorldCampaignSelector({
    world,
    campaign,
    onWorldChange,
    onCampaignChange,
}: WorldCampaignSelectorProps) {
    const [isCampaignOpen, setIsCampaignOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsCampaignOpen(false);
            }
        };

        if (isCampaignOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isCampaignOpen]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (isCampaignOpen && e.key === 'Escape') {
                setIsCampaignOpen(false);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isCampaignOpen]);

    const handleCampaignSelect = useCallback((campaignId: string | null) => {
        onCampaignChange(campaignId);
        setIsCampaignOpen(false);
    }, [onCampaignChange]);

    const dropdownVariants = {
        hidden: {
            opacity: 0,
            y: -8,
            scale: 0.96,
        },
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
                duration: 0.2,
                ease: [0.23, 1, 0.32, 1],
            },
        },
        exit: {
            opacity: 0,
            y: -4,
            transition: {
                duration: 0.15,
                ease: [0.4, 0, 1, 1],
            },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, x: -8 },
        visible: (i: number) => ({
            opacity: 1,
            x: 0,
            transition: {
                delay: i * 0.03,
                duration: 0.2,
                ease: [0.23, 1, 0.32, 1],
            },
        }),
    };

    return (
        <div className="world-campaign-selector">
            {/* World Button */}
            <button
                className="selector-btn selector-btn--world"
                onClick={onWorldChange}
                aria-label={`Current world: ${world.name}. Click to change world.`}
            >
                <Globe size={14} className="selector-btn__icon" />
                <span className="selector-btn__text">{world.name}</span>
                <ChevronDown size={14} className="selector-btn__chevron" />
            </button>

            <span className="selector-divider" aria-hidden="true" />

            {/* Campaign Button & Dropdown */}
            <div className="selector-dropdown-wrapper" ref={dropdownRef}>
                <button
                    className={`selector-btn selector-btn--campaign ${isCampaignOpen ? 'selector-btn--active' : ''}`}
                    onClick={() => setIsCampaignOpen(!isCampaignOpen)}
                    aria-expanded={isCampaignOpen}
                    aria-haspopup="listbox"
                    aria-label={`Current campaign: ${campaign?.name || 'All Campaigns'}. Click to change.`}
                >
                    <BookOpen size={14} className="selector-btn__icon" />
                    <span className="selector-btn__text">
                        {campaign?.name || 'All Campaigns'}
                    </span>
                    <motion.span
                        animate={{ rotate: isCampaignOpen ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <ChevronDown size={14} className="selector-btn__chevron" />
                    </motion.span>
                </button>

                <AnimatePresence>
                    {isCampaignOpen && (
                        <motion.div
                            className="selector-dropdown"
                            variants={dropdownVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            role="listbox"
                            aria-label="Select campaign"
                        >
                            {/* All Campaigns Option */}
                            <motion.button
                                className={`selector-dropdown__item ${!campaign ? 'selector-dropdown__item--selected' : ''}`}
                                onClick={() => handleCampaignSelect(null)}
                                variants={itemVariants}
                                custom={0}
                                initial="hidden"
                                animate="visible"
                                role="option"
                                aria-selected={!campaign}
                            >
                                <span className="selector-dropdown__item-name">All Campaigns</span>
                                <span className="selector-dropdown__item-meta">
                                    {world.entityCount} entities
                                </span>
                            </motion.button>

                            <div className="selector-dropdown__divider" />

                            {/* Campaign Options */}
                            {world.campaigns.map((c, i) => (
                                <motion.button
                                    key={c.id}
                                    className={`selector-dropdown__item ${campaign?.id === c.id ? 'selector-dropdown__item--selected' : ''}`}
                                    onClick={() => handleCampaignSelect(c.id)}
                                    variants={itemVariants}
                                    custom={i + 1}
                                    initial="hidden"
                                    animate="visible"
                                    role="option"
                                    aria-selected={campaign?.id === c.id}
                                >
                                    <span className="selector-dropdown__item-name">{c.name}</span>
                                    <span className="selector-dropdown__item-meta">
                                        {c.sessionCount} sessions · {formatRelativeTime(c.lastOpenedAt)}
                                    </span>
                                </motion.button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}