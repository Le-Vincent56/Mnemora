import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { World, Campaign } from '@/data/mockWorldData';
import { WorldCampaignSelector } from './WorldcampaignSelector'
import { PrepModeSearch } from './PrepModeSearch';
import { ViewToggle, ViewMode } from './ViewToggle';
import { CreateEntityDropdown, EntityType } from './CreateEntityDropdown';
import './PrepModeHeader.css';

interface PrepModeHeaderProps {
    world: World;
    campaign: Campaign | null; // null = "All Campaigns"
    onWorldChange: () => void; // Opens world selection
    onCampaignChange: (campaignId: string | null) => void;
    viewMode: ViewMode;
    onViewModeChange: (mode: ViewMode) => void;
    onSearch: (query: string) => void;
    onCreateEntity: (type: EntityType) => void;
    entityCount: number;
}

export function PrepModeHeader({
    world,
    campaign,
    onWorldChange,
    onCampaignChange,
    viewMode,
    onViewModeChange,
    onSearch,
    onCreateEntity,
    entityCount,
}: PrepModeHeaderProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchFocused, setIsSearchFocused] = useState(false);

    const handleSearchChange = useCallback((query: string) => {
        setSearchQuery(query);
        onSearch(query);
    }, [onSearch]);

    return (
        <motion.header
            className="prep-header"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
        >
            {/* Left: World & Campaign Selectors */}
            <div className="prep-header__left">
                <WorldCampaignSelector
                    world={world}
                    campaign={campaign}
                    onWorldChange={onWorldChange}
                    onCampaignChange={onCampaignChange}
                />
            </div>

            {/* Center: Search */}
            <div className={`prep-header__center ${isSearchFocused ? 'prep-header__center--expanded' : ''}`}>
                <PrepModeSearch
                    query={searchQuery}
                    onQueryChange={handleSearchChange}
                    onFocusChange={setIsSearchFocused}
                    placeholder="Summon..."
                />
            </div>

            {/* Right: View Toggle & Create */}
            <div className="prep-header__right">
                <ViewToggle
                    mode={viewMode}
                    onChange={onViewModeChange}
                />

                <div className="prep-header__divider" />

                <CreateEntityDropdown
                    onCreateEntity={onCreateEntity}
                />
            </div>
        </motion.header>
    );
}