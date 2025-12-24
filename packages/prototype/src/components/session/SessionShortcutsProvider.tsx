import { useState, useCallback, useMemo, createContext, useContext, ReactNode } from 'react';
import { useSessionShortcuts } from '../../hooks/useSessionShortcuts';
import { SafetyToolQuickRef, SafetyTool } from './SafetyToolQuickRef';
import { QuickNoteCapture } from './QuickNoteCapture';

interface SessionShortcutsContextValue {
    openSafetyTools: () => void;
    closeSafetyTools: () => void;
    isSafetyToolsOpen: boolean;
    openQuickNote: () => void;
    closeQuickNote: () => void;
    isQuickNoteOpen: boolean;
}

const SessionShortcutsContext = createContext<SessionShortcutsContextValue | null>(null);

export function useSessionShortcutsContext() {
    const context = useContext(SessionShortcutsContext);
    if (!context) {
        throw new Error('useSessionShortcutsContext must be used within SessionShortcutsProvider');
    }
    return context;
}

interface SessionShortcutsProviderProps {
    children: ReactNode;
    isSessionActive: boolean;
    safetyTools: SafetyTool[];
    onSaveQuickNote: (content: string, timestamp: Date) => void;
}

export function SessionShortcutsProvider({
    children,
    isSessionActive,
    safetyTools,
    onSaveQuickNote
}: SessionShortcutsProviderProps) {
    const [isSafetyToolsOpen, setIsSafetyToolsOpen] = useState(false);
    const [isQuickNoteOpen, setIsQuickNoteOpen] = useState(false);

    const openSafetyTools = useCallback(() => {
        setIsSafetyToolsOpen(true);
    }, []);

    const closeSafetyTools = useCallback(() => {
        setIsSafetyToolsOpen(false);
    }, []);

    const openQuickNote = useCallback(() => {
        setIsQuickNoteOpen(true);
    }, []);

    const closeQuickNote = useCallback(() => {
        setIsQuickNoteOpen(false);
    }, []);

    // Any modal open suppresses shortcuts
    const isAnyModalOpen = isSafetyToolsOpen || isQuickNoteOpen;

    useSessionShortcuts({
        isSessionActive,
        isModalOpen: isAnyModalOpen,
        handlers: {
            onSafetyTools: openSafetyTools,
            onQuickNote: openQuickNote
        }
    });

    const contextValue = useMemo(() => ({
        openSafetyTools,
        closeSafetyTools,
        isSafetyToolsOpen,
        openQuickNote,
        closeQuickNote,
        isQuickNoteOpen
    }), [openSafetyTools, closeSafetyTools, isSafetyToolsOpen, openQuickNote, closeQuickNote, isQuickNoteOpen]);

    return (
        <SessionShortcutsContext.Provider value={contextValue}>
            {children}

            <SafetyToolQuickRef
                isOpen={isSafetyToolsOpen}
                onClose={closeSafetyTools}
                tools={safetyTools}
            />

            <QuickNoteCapture
                isOpen={isQuickNoteOpen}
                onClose={closeQuickNote}
                onSave={onSaveQuickNote}
            />
        </SessionShortcutsContext.Provider>
    );
}
