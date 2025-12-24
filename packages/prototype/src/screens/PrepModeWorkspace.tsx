import { useState, useCallback, useMemo } from 'react';
import { PrepModeHeader } from '@/components/prep/PrepModeHeader';
import { EntityBrowser } from '@/components/prep/EntityBrowser';
import { ManuscriptEditor } from '@/components/editor/ManuscriptEditor';
import { ViewMode } from '@/components/prep/ViewToggle';
import {
    EntityType,
    Entity,
    getAllEntities,
    getAllTags,
    createEntity,
    updateEntity,
    deleteEntity,
    getEntityByID,
} from '@/data/mockData';
import { World, Campaign, getCampaignById } from '@/data/mockWorldData';
import './PrepModeWorkspace.css';

interface PrepModeWorkspaceProps {
    world: World;
    campaign: Campaign | null;
    onSwitchWorld: () => void;
    onEntityClick: (entity: Entity, event: React.MouseEvent) => void;
    activeSessionID?: string | null;
    onStartSession?: (entity: Entity) => void;
}

export function PrepModeWorkspace({
    world,
    campaign,
    onSwitchWorld,
    onEntityClick,
    activeSessionID,
    onStartSession,
}: PrepModeWorkspaceProps) {
    // View state
    const [viewMode, setViewMode] = useState<ViewMode>('cards');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentCampaign, setCurrentCampaign] = useState<Campaign | null>(campaign);

    // Entity state - triggers re-render when entities change
    const [entitiesVersion, setEntitiesVersion] = useState(0);

    // Editor state
    const [editingEntity, setEditingEntity] = useState<Entity | null>(null);

    // Get current entities (re-fetched when version changes)
    const entities = useMemo(() => getAllEntities(), [entitiesVersion]);
    const availableTags = useMemo(() => getAllTags(), [entitiesVersion]);

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

    // Open entity for editing
    const handleEntityClick = useCallback((entity: Entity, _event: React.MouseEvent) => {
        // Open in editor instead of QuickRefCard
        setEditingEntity(entity);
    }, []);

    // Create new entity and open in editor
    const handleCreateEntity = useCallback((type: EntityType) => {
        const newEntity = createEntity(type);
        setEntitiesVersion(v => v + 1);
        setEditingEntity(newEntity);
    }, []);

    // Save entity changes
    const handleSaveEntity = useCallback((updatedEntity: Entity) => {
        updateEntity(updatedEntity.id, updatedEntity);
        setEntitiesVersion(v => v + 1);

        // Update the editing entity reference with fresh data
        const fresh = getEntityByID(updatedEntity.id);
        if (fresh) {
            setEditingEntity(fresh);
        }
    }, []);

    // Delete entity
    const handleDeleteEntity = useCallback((entity: Entity) => {
        deleteEntity(entity.id);
        setEntitiesVersion(v => v + 1);
        setEditingEntity(null);
    }, []);

    // Close editor
    const handleCloseEditor = useCallback(() => {
        setEditingEntity(null);
    }, []);

    // Handle entity selection from within the editor (index panel)
    const handleEntitySelectFromEditor = useCallback((entity: Entity) => {
        setEditingEntity(entity);
    }, []);

    // Handle connection click - open in QuickRefCard for peek
    const handleConnectionClick = useCallback((id: string) => {
        const entity = getEntityByID(id);
        if (entity) {
            // Use the parent's onEntityClick to open QuickRefCard
            // Create a synthetic event at center of screen
            const syntheticEvent = {
                clientX: window.innerWidth / 2,
                clientY: window.innerHeight / 2,
            } as React.MouseEvent;
            onEntityClick(entity, syntheticEvent);
        }
    }, [onEntityClick]);

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
                entityCount={entities.length}
            />

            <EntityBrowser
                entities={entities}
                viewMode={viewMode}
                searchQuery={searchQuery}
                onEntityClick={handleEntityClick}
                onCreateEntity={handleCreateEntity}
                activeSessionID={activeSessionID}
                onStartSession={onStartSession}
            />

            {/* Manuscript Editor - Full Page Codex Layout */}
            <ManuscriptEditor
                entity={editingEntity}
                entities={entities}
                onClose={handleCloseEditor}
                onSave={handleSaveEntity}
                onDelete={handleDeleteEntity}
                onEntitySelect={handleEntitySelectFromEditor}
                onCreateEntity={handleCreateEntity}
                availableTags={availableTags}
                onConnectionClick={handleConnectionClick}
                hasStarsAndWishes={false} // TODO: Get from campaign safety tools
            />
        </div>
    );
}