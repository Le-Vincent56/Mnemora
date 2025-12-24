import { useState, useCallback, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AppShell } from '@/components/layout/AppShell';
import { SessionDashboard } from '@/screens/SessionDashboard';
import { QuickRefCard } from '@/components/modal/QuickRefCard';
import { WorldTitlePage } from '@/screens/WorldTitlePage';
import { PrepModeWorkspace } from '@/screens/PrepModeWorkspace';
import { ComponentShowcase } from '@/screens/ComponentShowcase';
import { Entity, getEntityByID } from '@/data/mockData';
import {
    World,
    Campaign,
    getWorldById,
    getCampaignById
} from '@/data/mockWorldData';
import { SessionSummaryModal } from '@/components/session/SessionSummaryModal';
import { SessionSummary } from '@/types/session';
import { useActiveSession } from '@/hooks/useActiveSession';
import { SafetyTool } from '@/components/session/SafetyToolQuickRef';
import { QuickNote } from '@/components/session/QuickNoteIconRailItem';
import { SessionShortcutsProvider } from '@/components/session/SessionShortcutsProvider';

// Types
type AppMode = 'prep' | 'session';
type PrepState = 'title-page' | 'workspace';

interface PrepContext {
    world: World | null;
    campaign: Campaign | null;
}

// Mock safety tools (prototype data - would come from campaign settings in production)
const MOCK_SAFETY_TOOLS: SafetyTool[] = [
    {
        id: 'xcard',
        name: 'X-Card',
        description: 'Any player can "X" a scene to immediately pause, skip, or fade-to-black — no explanation needed.'
    },
    {
        id: 'lines',
        name: 'Lines & Veils',
        description: 'Define content that should never appear (Lines) or happen off-screen (Veils).',
        details: 'Lines: Harm to children, Sexual assault. Veils: Graphic torture, Explicit romance.'
    },
    {
        id: 'opendoor',
        name: 'Open Door',
        description: 'Anyone can step away from the table at any time. No questions asked, no pressure to explain.'
    },
    {
        id: 'starswishes',
        name: 'Stars & Wishes',
        description: 'At session end, players share what they loved (Stars) and what they hope for (Wishes).'
    }
];

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

    // Session State
    const [sessionSummary, setSessionSummary] = useState<SessionSummary | null>(null);
    const activeSessionContext = useActiveSession();

    // Quick Notes State (for session tools)
    const [quickNotes, setQuickNotes] = useState<QuickNote[]>([]);
    const [reflection, setReflection] = useState('');
    const [stars, setStars] = useState<string[]>([]);
    const [wishes, setWishes] = useState<string[]>([]);

    // Check if Stars & Wishes tool is enabled
    const isStarsWishesEnabled = MOCK_SAFETY_TOOLS.some(tool => tool.id === 'starswishes');

    // Check for showcase route
    const [showShowcase, setShowShowcase] = useState(() =>
        window.location.hash === '#showcase'
    );

    useEffect(() => {
        const handleHashChange = () => {
            setShowShowcase(window.location.hash === '#showcase');
        };
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    // Render showcase if on that route
    if (showShowcase) {
        return <ComponentShowcase />;
    }

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
        activeSessionContext.recordEntityAccess(entity);

        setViewHistory((prev) => {
            const newHistory = prev.slice(0, historyIndex + 1);
            newHistory.push(entity.id);
            return newHistory;
        });
        setHistoryIndex((prev) => prev + 1);
    }, [historyIndex, activeSessionContext]);

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

    const handleEditFromQuickRef = useCallback((_entity: Entity) => {
        // Close QuickRefCard
        setSelectedEntity(null);
        // The PrepModeWorkspace will handle opening the editor
    }, []);

    // Handle starting a session from Prep Mode
    const handleStartSession = useCallback((sessionEntity: Entity) => {
        // Need the campaign for the session
        // For now, use the current prep context campaign or first available
        const sessionCampaign = prepContext.campaign || prepContext.world?.campaigns[0];

        if (sessionCampaign) {
            activeSessionContext.startSession(sessionEntity, sessionCampaign);
            setMode('session');
            // Reset session-specific state
            setQuickNotes([]);
            setReflection('');
            setStars([]);
            setWishes([]);
        }
    }, [activeSessionContext, prepContext]);

    // Quick Notes Handlers
    const handleSaveNote = useCallback((content: string, timestamp: Date) => {
        setQuickNotes(prev => [...prev, {
            id: String(Date.now()),
            content,
            timestamp
        }]);
    }, []);

    const handleRemoveNote = useCallback((id: string) => {
        setQuickNotes(prev => prev.filter(n => n.id !== id));
    }, []);

    // Stars & Wishes Handlers
    const handleAddStar = useCallback((star: string) => {
        setStars(prev => [...prev, star]);
    }, []);

    const handleRemoveStar = useCallback((index: number) => {
        setStars(prev => prev.filter((_, i) => i !== index));
    }, []);

    const handleAddWish = useCallback((wish: string) => {
        setWishes(prev => [...prev, wish]);
    }, []);

    const handleRemoveWish = useCallback((index: number) => {
        setWishes(prev => prev.filter((_, i) => i !== index));
    }, []);

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
                            <SessionShortcutsProvider
                                isSessionActive={!!activeSessionContext.activeSession}
                                safetyTools={MOCK_SAFETY_TOOLS}
                                onSaveQuickNote={handleSaveNote}
                            >
                                <SessionDashboard
                                    activeSession={activeSessionContext.activeSession}
                                    recentEntities={activeSessionContext.recentEntities}
                                    timerVisible={activeSessionContext.timerVisible}
                                    formattedDuration={activeSessionContext.formattedDuration}
                                    safetyTools={MOCK_SAFETY_TOOLS}
                                    quickNotes={quickNotes}
                                    onSaveNote={handleSaveNote}
                                    onEntityClick={openEntity}
                                    onToggleTimerVisibility={activeSessionContext.toggleTimerVisibility}
                                    onToggleTimer={activeSessionContext.toggleTimer}
                                    onResetTimer={activeSessionContext.resetTimer}
                                    onClearRecent={activeSessionContext.clearRecent}
                                    onSwitchSession={(sessionEntity) => {
                                        activeSessionContext.switchSession(sessionEntity, activeSessionContext.activeSession!.campaign)
                                    }}
                                    onEndSession={() => {
                                        const summary = activeSessionContext.endSession()
                                        if (summary) {
                                            setSessionSummary(summary)
                                        }
                                    }}
                                    onGoToPrep={() => handleModeChange('prep')}
                                />
                            </SessionShortcutsProvider>
                        ) : (
                            // Prep Mode Workspace
                            prepContext.world && (
                                <PrepModeWorkspace
                                    world={prepContext.world}
                                    campaign={prepContext.campaign}
                                    onSwitchWorld={handleSwitchWorld}
                                    onEntityClick={openEntity}
                                    activeSessionID={activeSessionContext.activeSession?.sessionID}
                                    onStartSession={handleStartSession}
                                />
                            )
                        )}
                    </motion.div>
                </AnimatePresence>
            </AppShell>

            <QuickRefCard
                entity={selectedEntity}
                onClose={closeEntity}
                onEdit={mode === 'prep' ? handleEditFromQuickRef : undefined}  // Only show in prep mode
                onNavigate={navigateToEntity}
                onPrev={goToPrev}
                onNext={goToNext}
                hasPrev={historyIndex > 0}
                hasNext={historyIndex < viewHistory.length - 1}
                clickOrigin={clickOrigin}
            />

            <SessionSummaryModal
                summary={sessionSummary}
                onClose={() => setSessionSummary(null)}
                onCopyNotes={() => {
                    if (sessionSummary) {
                        navigator.clipboard.writeText(sessionSummary.generatedNotes);
                        // Could add a toast notification here
                    }
                    setSessionSummary(null);
                }}
                onSaveToSession={() => {
                    // TODO: Append notes to session entity
                    console.log('Saving notes to session...');
                    setSessionSummary(null);
                }}
                quickNotes={quickNotes}
                onRemoveNote={handleRemoveNote}
                reflection={reflection}
                onReflectionChange={setReflection}
                isStarsWishesEnabled={isStarsWishesEnabled}
                stars={stars}
                wishes={wishes}
                onAddStar={handleAddStar}
                onRemoveStar={handleRemoveStar}
                onAddWish={handleAddWish}
                onRemoveWish={handleRemoveWish}
            />
        </>
    );
}