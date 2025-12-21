import { useState, useCallback, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AppShell } from '@/components/layout/AppShell';
import { SessionDashboard } from '@/screens/SessionDashboard';
import { QuickRefCard } from '@/components/modal/QuickRefCard';
import { WorldTitlePage } from '@/screens/WorldTitlePage';
import { PrepModeWorkspace } from '@/screens/PrepModeWorkspace';
import { Entity, getEntityByID } from '@/data/mockData';
import {
    World,
    Campaign,
    getWorldById,
    getCampaignById
} from '@/data/mockWorldData';
import { useSessionState } from '@/hooks/useSessionState';

// Types
type AppMode = 'prep' | 'session';
type PrepState = 'title-page' | 'workspace';

interface PrepContext {
    world: World | null;
    campaign: Campaign | null;
}

// Animation Variants
const contentVariants = {
    initial: { opacity: 0, y: 8 },
    animate: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.4,
            ease: [0.23, 1, 0.32, 1],
        }
    },
    exit: {
        opacity: 0,
        y: -8,
        transition: {
            duration: 0.25,
            ease: [0.4, 0, 1, 1],
        }
    },
};

// Main App Component
export default function App() {
    // Mode and Prep State
    const [mode, setMode] = useState<AppMode>('session');
    const [prepState, setPrepState] = useState<PrepState>('title-page');
    const [prepContext, setPrepContext] = useState<PrepContext>({
        world: null,
        campaign: null,
    });

    // Entity Selection State (for QuickRefCard)
    const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
    const [clickOrigin, setClickOrigin] = useState<{ x: number; y: number } | null>(null);
    const [viewHistory, setViewHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    const sessionState = useSessionState();

    // Sync mode to document root (for CSS theme switching)
    useEffect(() => {
        document.documentElement.setAttribute('data-mode', mode);
    }, [mode]);

    // Mode Change Handler
    const handleModeChange = useCallback((newMode: AppMode) => {
        setMode(newMode);

        if (newMode === 'prep') {
            // If we don't have a selected world, show the title page
            // Otherwise, go straight to the workspace (returning to prep)
            if (!prepContext.world) {
                setPrepState('title-page');
            } else {
                setPrepState('workspace');
            }
        }
    }, [prepContext.world]);

    // World Title Page Handlers
    const handleEnterWorkspace = useCallback((worldId: string, campaignId?: string) => {
        const world = getWorldById(worldId);

        if (world) {
            const campaign = campaignId
                ? getCampaignById(worldId, campaignId)
                : null;

            setPrepContext({
                world,
                campaign: campaign || null
            });
            setPrepState('workspace');
        }
    }, []);

    /**
     * Called when user clicks "Create World" on the Title Page.
     * TODO: Open world creation flow.
     */
    const handleCreateWorld = useCallback(() => {
        console.log('Create world - opening creation flow...');
        // TODO: Open world creation modal/overlay
    }, []);

    /**
     * Called when user wants to switch worlds (from header dropdown or back button).
     * Returns to the Title Page and clears the current context.
     */
    const handleSwitchWorld = useCallback(() => {
        setPrepState('title-page');
        setPrepContext({ world: null, campaign: null });
    }, []);

    // Entity Click Handler
    const openEntity = useCallback((entity: Entity, event?: React.MouseEvent) => {
        if (event) {
            setClickOrigin({ x: event.clientX, y: event.clientY });
        } else {
            setClickOrigin(null);
        }

        setSelectedEntity(entity);
        sessionState.addToRecent(entity);

        setViewHistory((prev) => {
            const newHistory = prev.slice(0, historyIndex + 1);
            newHistory.push(entity.id);
            return newHistory;
        });
        setHistoryIndex((prev) => prev + 1);
    }, [historyIndex, sessionState]);

    const navigateToEntity = useCallback((id: string) => {
        setClickOrigin(null);
        const entity = getEntityByID(id);
        if (entity) {
            openEntity(entity);
        }
    }, [openEntity]);

    const closeEntity = useCallback(() => {
        setSelectedEntity(null);
        setClickOrigin(null);
    }, []);

    const goToPrev = useCallback(() => {
        if (historyIndex > 0) {
            const prevIndex = historyIndex - 1;
            const prevId = viewHistory[prevIndex];
            const entity = getEntityByID(prevId);
            if (entity) {
                setSelectedEntity(entity);
                setHistoryIndex(prevIndex);
            }
        }
    }, [historyIndex, viewHistory]);

    const goToNext = useCallback(() => {
        if (historyIndex < viewHistory.length - 1) {
            const nextIndex = historyIndex + 1;
            const nextId = viewHistory[nextIndex];
            const entity = getEntityByID(nextId);
            if (entity) {
                setSelectedEntity(entity);
                setHistoryIndex(nextIndex);
            }
        }
    }, [historyIndex, viewHistory]);

    // Render
    // Prep Mode: Title Page (full screen, no AppShell)
    if (mode === 'prep' && prepState === 'title-page') {
        return (
            <>
                <AnimatePresence mode="wait">
                    <motion.div
                        key="title-page"
                        variants={contentVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        style={{ height: '100vh' }}
                    >
                        <WorldTitlePage
                            onEnterWorkspace={handleEnterWorkspace}
                            onCreateWorld={handleCreateWorld}
                        />
                    </motion.div>
                </AnimatePresence>

                {/* QuickRefCard still available if needed */}
                <QuickRefCard
                    entity={selectedEntity}
                    onClose={closeEntity}
                    onNavigate={navigateToEntity}
                    onPrev={goToPrev}
                    onNext={goToNext}
                    hasPrev={historyIndex > 0}
                    hasNext={historyIndex < viewHistory.length - 1}
                    clickOrigin={clickOrigin}
                />
            </>
        );
    }

    // Session Mode or Prep Mode Workspace (with AppShell)
    return (
        <>
            <AppShell mode={mode} onModeChange={handleModeChange}>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={`${mode}-${prepState}`}
                        variants={contentVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        style={{ height: '100%' }}
                    >
                        {mode === 'session' ? (
                            <SessionDashboard
                                sessionState={sessionState}
                                onEntityClick={openEntity}
                            />
                        ) : (
                            // Prep Mode Workspace
                            prepContext.world && (
                                <PrepModeWorkspace
                                    world={prepContext.world}
                                    campaign={prepContext.campaign}
                                    onSwitchWorld={handleSwitchWorld}
                                    onEntityClick={openEntity}
                                />
                            )
                        )}
                    </motion.div>
                </AnimatePresence>
            </AppShell>

            <QuickRefCard
                entity={selectedEntity}
                onClose={closeEntity}
                onNavigate={navigateToEntity}
                onPrev={goToPrev}
                onNext={goToNext}
                hasPrev={historyIndex > 0}
                hasNext={historyIndex < viewHistory.length - 1}
                clickOrigin={clickOrigin}
            />
        </>
    );
}