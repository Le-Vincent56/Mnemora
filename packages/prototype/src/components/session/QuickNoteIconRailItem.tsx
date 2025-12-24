import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { StickyNote } from 'lucide-react'
import { useSessionShortcutsContextOptional } from './SessionShortcutsProvider'
import './QuickNoteIconRailItem.css'

export interface QuickNote {
    id: string
    content: string
    timestamp: Date
}

export interface QuickNoteIconRailItemProps {
    notes: QuickNote[]
    onSaveNote: (content: string, timestamp: Date) => void
    isSessionActive?: boolean
}

const badgeVariants = {
    initial: { scale: 0, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0, opacity: 0 }
}

export function QuickNoteIconRailItem({
    notes,
    onSaveNote: _onSaveNote, // Now handled by provider, but keep prop for API compatibility
    isSessionActive = true
}: QuickNoteIconRailItemProps) {
    const buttonRef = useRef<HTMLButtonElement>(null)
    const shortcutsContext = useSessionShortcutsContextOptional()
    const prevCountRef = useRef(notes.length)

    const noteCount = notes.length
    const hasNotes = noteCount > 0

    // Track pulse state for badge animation
    const [shouldPulse, setShouldPulse] = useState(false)

    // Detect when count increments to trigger pulse
    useEffect(() => {
        if (noteCount > prevCountRef.current) {
            setShouldPulse(true)
            const timer = setTimeout(() => setShouldPulse(false), 300)
            prevCountRef.current = noteCount
            return () => clearTimeout(timer)
        }
        prevCountRef.current = noteCount
    }, [noteCount])

    const handleOpen = useCallback(() => {
        if (isSessionActive && shortcutsContext) {
            shortcutsContext.openQuickNote(buttonRef)
        }
    }, [isSessionActive, shortcutsContext])

    // Construct accessible label
    const ariaLabel = hasNotes
        ? `Quick notes, ${noteCount} ${noteCount === 1 ? 'note' : 'notes'} captured`
        : 'Quick notes, none captured'

    return (
        <motion.button
            ref={buttonRef}
            className={`quick-note-icon-rail-item ${!isSessionActive ? 'quick-note-icon-rail-item--disabled' : ''}`}
            onClick={handleOpen}
            whileHover={isSessionActive ? { scale: 1.05 } : undefined}
            whileTap={isSessionActive ? { scale: 0.95 } : undefined}
            title="Quick Notes (N)"
            aria-label={ariaLabel}
            aria-haspopup="dialog"
            aria-expanded={shortcutsContext?.isQuickNoteOpen ?? false}
            disabled={!isSessionActive}
        >
            <StickyNote size={20} />

            <AnimatePresence>
                {hasNotes && (
                    <motion.span
                        className={`quick-note-icon-rail-item__badge ${shouldPulse ? 'quick-note-icon-rail-item__badge--pulse' : ''}`}
                        variants={badgeVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={{
                            type: 'spring',
                            stiffness: 500,
                            damping: 25
                        }}
                        aria-hidden="true"
                    >
                        {noteCount}
                    </motion.span>
                )}
            </AnimatePresence>
        </motion.button>
    )
}