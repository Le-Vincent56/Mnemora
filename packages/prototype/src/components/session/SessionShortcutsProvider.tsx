import { useState, useCallback, useMemo, createContext, useContext, useRef, ReactNode, RefObject } from 'react'
import { useSessionShortcuts } from '../../hooks/useSessionShortcuts'
import { SafetyToolQuickRef, SafetyTool } from './SafetyToolQuickRef'
import { QuickNoteCapture } from './QuickNoteCapture'

interface SessionShortcutsContextValue {
    openSafetyTools: (triggerRef?: RefObject<HTMLElement>) => void
    closeSafetyTools: () => void
    isSafetyToolsOpen: boolean
    openQuickNote: (triggerRef?: RefObject<HTMLElement>) => void
    closeQuickNote: () => void
    isQuickNoteOpen: boolean
}

const SessionShortcutsContext = createContext<SessionShortcutsContextValue | null>(null)

export function useSessionShortcutsContext() {
    const context = useContext(SessionShortcutsContext)
    if (!context) {
        throw new Error('useSessionShortcutsContext must be used within SessionShortcutsProvider')
    }
    return context
}

// Optional hook that doesn't throw — for components that may render outside provider
export function useSessionShortcutsContextOptional() {
    return useContext(SessionShortcutsContext)
}

interface SessionShortcutsProviderProps {
    children: ReactNode
    isSessionActive: boolean
    safetyTools: SafetyTool[]
    onSaveQuickNote: (content: string, timestamp: Date) => void
}

export function SessionShortcutsProvider({
    children,
    isSessionActive,
    safetyTools,
    onSaveQuickNote
}: SessionShortcutsProviderProps) {
    const [isSafetyToolsOpen, setIsSafetyToolsOpen] = useState(false)
    const [isQuickNoteOpen, setIsQuickNoteOpen] = useState(false)

    // Track which element triggered the modal for return focus
    const safetyToolsTriggerRef = useRef<RefObject<HTMLElement> | null>(null)
    const quickNoteTriggerRef = useRef<RefObject<HTMLElement> | null>(null)

    const openSafetyTools = useCallback((triggerRef?: RefObject<HTMLElement>) => {
        safetyToolsTriggerRef.current = triggerRef || null
        setIsSafetyToolsOpen(true)
    }, [])

    const closeSafetyTools = useCallback(() => {
        setIsSafetyToolsOpen(false)
        // Return focus after modal closes
        setTimeout(() => {
            safetyToolsTriggerRef.current?.current?.focus()
            safetyToolsTriggerRef.current = null
        }, 0)
    }, [])

    const openQuickNote = useCallback((triggerRef?: RefObject<HTMLElement>) => {
        quickNoteTriggerRef.current = triggerRef || null
        setIsQuickNoteOpen(true)
    }, [])

    const closeQuickNote = useCallback(() => {
        setIsQuickNoteOpen(false)
        // Return focus after popover closes
        setTimeout(() => {
            quickNoteTriggerRef.current?.current?.focus()
            quickNoteTriggerRef.current = null
        }, 0)
    }, [])

    // Any modal open suppresses shortcuts
    const isAnyModalOpen = isSafetyToolsOpen || isQuickNoteOpen

    useSessionShortcuts({
        isSessionActive,
        isModalOpen: isAnyModalOpen,
        handlers: {
            onSafetyTools: openSafetyTools,
            onQuickNote: openQuickNote
        }
    })

    const contextValue = useMemo(() => ({
        openSafetyTools,
        closeSafetyTools,
        isSafetyToolsOpen,
        openQuickNote,
        closeQuickNote,
        isQuickNoteOpen
    }), [openSafetyTools, closeSafetyTools, isSafetyToolsOpen, openQuickNote, closeQuickNote, isQuickNoteOpen])

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
    )
}