import { useState, useCallback, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AppShell } from '@/components/layout/AppShell';
import { SessionDashboard } from '@/screens/SessionDashboard';
import { QuickRefCard } from '@/components/modal/QuickRefCard';
import { Entity, getEntityByID } from '@/data/mockData';
import { useSessionState } from '@/hooks/useSessionState';
import { PrimerDemo } from '@/screens/PrimerDemo';

type AppMode = 'prep' | 'session';

// Content transition variants
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

export default function App() {
    const [mode, setMode] = useState<AppMode>('session');
    const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
    const [clickOrigin, setClickOrigin] = useState<{ x: number; y: number } | null>(null);
    const [viewHistory, setViewHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    const sessionState = useSessionState();

    // Sync mode to document root for CSS variable switching
    useEffect(() => {
        document.documentElement.setAttribute('data-mode', mode);
    }, [mode]);

    // Open an entity in the QuickRefCard
    const openEntity = useCallback((entity: Entity, event?: React.MouseEvent) => {
        // Capture click origin for animation
        if (event) {
            setClickOrigin({ x: event.clientX, y: event.clientY });
        } else {
            setClickOrigin(null);
        }

        setSelectedEntity(entity);
        sessionState.addToRecent(entity);

        // Add to view history
        setViewHistory((prev) => {
            const newHistory = prev.slice(0, historyIndex + 1);
            newHistory.push(entity.id);
            return newHistory;
        });
        setHistoryIndex((prev) => prev + 1);
    }, [historyIndex, sessionState]);

    // Open entity by ID (for connections) — no origin since modal is already open
    const navigateToEntity = useCallback((id: string) => {
        setClickOrigin(null); // Reset origin for in-modal navigation
        const entity = getEntityByID(id);
        if (entity) {
            openEntity(entity);
        }
    }, [openEntity]);

    // Close the modal
    const closeEntity = useCallback(() => {
        setSelectedEntity(null);
        setClickOrigin(null);
    }, []);

    // Navigate to previous entity in history
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

    // Navigate to next entity in history
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

    return (
        <>
            <AppShell mode={mode} onModeChange={setMode}>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={mode}
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
                            <PrimerDemo />
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