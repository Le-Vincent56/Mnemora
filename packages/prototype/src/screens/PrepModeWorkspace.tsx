import { useState, useCallback } from 'react';
import { PrepModeHeader } from '@/components/prep/PrepModeHeader';
import { EntityBrowser } from '@/components/prep/EntityBrowser';
import { ViewMode } from '@/components/prep/ViewToggle';
import { EntityType, Entity } from '@/data/mockData';
import { World, Campaign, getCampaignById } from '@/data/mockWorldData';
import './PrepModeWorkspace.css';

interface PrepModeWorkspaceProps {
    world: World;
    campaign: Campaign | null;
    onSwitchWorld: () => void;
    onEntityClick: (entity: Entity, event: React.MouseEvent) => void;
}

export function PrepModeWorkspace({
    world,
    campaign,
    onSwitchWorld,
    onEntityClick,
}: PrepModeWorkspaceProps) {
    const [viewMode, setViewMode] = useState<ViewMode>('cards');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentCampaign, setCurrentCampaign] = useState<Campaign | null>(campaign);

    const handleCampaignChange = useCallback((campaignId: string | null) => {
        if (campaignId === null) {
            setCurrentCampaign(null);
        } else {
            const found = getCampaignById(world.id, campaignId);
            setCurrentCampaign(found || null);
        }
    }, [world.id]);

    const handleSearch = useCallback((query: string) => {
        setSearchQuery(query);
    }, []);

    const handleCreateEntity = useCallback((type: EntityType) => {
        console.log('Create entity of type:', type);
        // TODO: Open entity editor overlay
    }, []);

    return (
        <div className="prep-workspace">
            <PrepModeHeader
                world={world}
                campaign={currentCampaign}
                onWorldChange={onSwitchWorld}
                onCampaignChange={handleCampaignChange}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                onSearch={handleSearch}
                onCreateEntity={handleCreateEntity}
                entityCount={world.entityCount}
            />

            <EntityBrowser
                viewMode={viewMode}
                searchQuery={searchQuery}
                onEntityClick={onEntityClick}
                onCreateEntity={handleCreateEntity}
            />
        </div>
    );
}