import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Slash, EyeOff, Plus, X } from 'lucide-react';
import './LinesAndVeilsEditor.css';

export interface LinesAndVeilsEditorProps {
    isOpen: boolean
    onClose: () => void
    lines: string[]
    veils: string[]
    onSave: (lines: string[], veils: string[]) => void
}

const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
}

const cardVariants = {
    hidden: {
        opacity: 0,
        scale: 0.95,
        y: 12
    },
    visible: {
        opacity: 1, scale: 1,
        y: 0,
        transition: {
            duration: 0.3,
            ease: [0.23, 1, 0.32, 1] // --ease-memory
        }
    }, exit: {
        opacity: 0,
        scale: 0.98,
        y: 8,
        transition: {
            duration: 0.15,
            ease: [0.32, 0, 0.67, 0] // --ease-in
        }
    }
}

const itemVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 8 },
    visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: {
            duration: 0.2,
            ease: [0.23, 1, 0.32, 1]
        }
    },
    exit: {
        opacity: 0,
        scale: 0.95,
        transition: { duration: 0.15 }
    }
}
type ColumnType = 'line' | 'veil'

interface BoundaryColumnProps {
    type: ColumnType
    items: string[]
    onAdd: (value: string) => void
    onRemove: (index: number) => void
}

function BoundaryColumn({ type, items, onAdd, onRemove }: BoundaryColumnProps) {
    const [inputValue, setInputValue] = useState('')
    const [isAdding, setIsAdding] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)
    const addButtonRef = useRef<HTMLButtonElement>(null)

    const isLine = type === 'line'
    const Icon = isLine ? Slash : EyeOff
    const headingText = isLine ? 'Lines' : 'Veils'
    const subheadingText = isLine
        ? 'Hard limits — never appear in play'
        : 'Soft boundaries — fade to black'
    const placeholder = isLine
        ? 'e.g., graphic violence against children'
        : 'e.g., detailed romance scenes'
    const addLabel = isLine ? 'Add a line' : 'Add a veil'
    const emptyText = isLine
        ? 'No lines defined yet'
        : 'No veils defined yet'
    const headingId = `${type}-heading`

    // Focus input when adding mode activates
    useEffect(() => {
        if (isAdding) {
            inputRef.current?.focus()
        }
    }, [isAdding])

    const handleStartAdding = useCallback(() => {
        setIsAdding(true)
    }, [])

    const handleCancelAdding = useCallback(() => {
        setIsAdding(false)
        setInputValue('')
        addButtonRef.current?.focus()
    }, [])

    const handleSubmit = useCallback(() => {
        const trimmed = inputValue.trim()
        if (trimmed.length === 0) {
            handleCancelAdding()
            return
        }

        onAdd(trimmed)
        setInputValue('')
        // Keep input focused for rapid entry
        inputRef.current?.focus()
    }, [inputValue, onAdd, handleCancelAdding])

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            handleSubmit()
        } else if (e.key === 'Escape') {
            e.preventDefault()
            handleCancelAdding()
        }
    }, [handleSubmit, handleCancelAdding])

    const handleRemove = useCallback((index: number) => {
        onRemove(index)
        addButtonRef.current?.focus()
    }, [onRemove])

    return (
        <div
            className={`lv-editor__column lv-editor__column--${type}`}
            role="region"
            aria-labelledby={headingId}
        >
            <div className="lv-editor__column-header">
                <h3 id={headingId} className="lv-editor__column-heading">
                    <Icon size={18} className="lv-editor__column-icon" aria-hidden="true" />
                    <span>{headingText}</span>
                </h3>
                <p className="lv-editor__column-subheading">{subheadingText}</p>
            </div>

            <ul className="lv-editor__list" aria-label={`${headingText} list`}>
                <AnimatePresence mode="popLayout">
                    {items.length === 0 && !isAdding && (
                        <motion.li
                            key="empty"
                            className="lv-editor__empty"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            {emptyText}
                        </motion.li>
                    )}
                    {items.map((item, index) => (
                        <motion.li
                            key={`${type}-${index}-${item.slice(0, 10)}`}
                            className="lv-editor__item"
                            variants={itemVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            layout
                        >
                            <span className="lv-editor__item-text" title={item}>
                                {item}
                            </span>
                            <button
                                type="button"
                                className="lv-editor__item-remove"
                                onClick={() => handleRemove(index)}
                                aria-label={`Remove ${type}: ${item.slice(0, 30)}${item.length > 30 ? '...' : ''}`}
                            >
                                <X size={14} />
                            </button>
                        </motion.li>
                    ))}
                </AnimatePresence>
            </ul>

            {isAdding ? (
                <div className="lv-editor__input-wrapper">
                    <label htmlFor={`${type}-input`} className="sr-only">
                        {addLabel}
                    </label>
                    <input
                        ref={inputRef}
                        id={`${type}-input`}
                        type="text"
                        className="lv-editor__input"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onBlur={() => {
                            // Small delay to allow click on other elements
                            setTimeout(() => {
                                if (inputValue.trim() === '') {
                                    handleCancelAdding()
                                }
                            }, 150)
                        }}
                        placeholder={placeholder}
                        maxLength={200}
                    />
                </div>
            ) : (
                <button
                    ref={addButtonRef}
                    type="button"
                    className="lv-editor__add"
                    onClick={handleStartAdding}
                >
                    <Plus size={14} />
                    <span>{addLabel}</span>
                </button>
            )}
        </div>
    )
}

export function LinesAndVeilsEditor({
    isOpen,
    onClose,
    lines: initialLines,
    veils: initialVeils,
    onSave
}: LinesAndVeilsEditorProps) {
    // Local state for editing
    const [lines, setLines] = useState<string[]>([])
    const [veils, setVeils] = useState<string[]>([])

    const modalRef = useRef<HTMLDivElement>(null)
    const firstFocusableRef = useRef<HTMLButtonElement>(null)

    // Reset local state when modal opens
    useEffect(() => {
        if (isOpen) {
            setLines([...initialLines])
            setVeils([...initialVeils])
        }
    }, [isOpen, initialLines, initialVeils])

    // Focus first focusable element when modal opens
    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => {
                firstFocusableRef.current?.focus()
            }, 50)
            return () => clearTimeout(timer)
        }
    }, [isOpen])

    // Escape key handler
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose()
            }
        }

        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [isOpen, onClose])

    // Focus trap
    useEffect(() => {
        if (!isOpen || !modalRef.current) return

        const modal = modalRef.current
        const focusableElements = modal.querySelectorAll<HTMLElement>(
            'input, button, [tabindex]:not([tabindex="-1"])'
        )
        const firstFocusable = focusableElements[0]
        const lastFocusable = focusableElements[focusableElements.length - 1]

        const handleTab = (e: KeyboardEvent) => {
            if (e.key !== 'Tab') return

            if (e.shiftKey) {
                if (document.activeElement === firstFocusable) {
                    e.preventDefault()
                    lastFocusable?.focus()
                }
            } else {
                if (document.activeElement === lastFocusable) {
                    e.preventDefault()
                    firstFocusable?.focus()
                }
            }
        }

        document.addEventListener('keydown', handleTab)
        return () => document.removeEventListener('keydown', handleTab)
    }, [isOpen])

    // Line handlers
    const handleAddLine = useCallback((value: string) => {
        setLines(prev => [...prev, value])
    }, [])

    const handleRemoveLine = useCallback((index: number) => {
        setLines(prev => prev.filter((_, i) => i !== index))
    }, [])

    // Veil handlers
    const handleAddVeil = useCallback((value: string) => {
        setVeils(prev => [...prev, value])
    }, [])

    const handleRemoveVeil = useCallback((index: number) => {
        setVeils(prev => prev.filter((_, i) => i !== index))
    }, [])

    const handleSave = () => {
        onSave(lines, veils)
        onClose()
    }

    const handleCancel = () => {
        onClose()
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="lv-editor"
                    variants={overlayVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    transition={{ duration: 0.15 }}
                    onClick={onClose}
                >
                    <motion.div
                        ref={modalRef}
                        className="lv-editor__card"
                        variants={cardVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        onClick={(e) => e.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="lv-editor-title"
                    >
                        <div className="lv-editor__header">
                            <h2 id="lv-editor-title" className="lv-editor__title">
                                Configure Lines & Veils
                            </h2>
                            <p className="lv-editor__description">
                                Lines are hard limits that never appear in the game. Veils are content
                                that happens off-screen — we acknowledge it exists but fade to black.
                            </p>
                        </div>

                        <div className="lv-editor__columns">
                            <BoundaryColumn
                                type="line"
                                items={lines}
                                onAdd={handleAddLine}
                                onRemove={handleRemoveLine}
                            />
                            <BoundaryColumn
                                type="veil"
                                items={veils}
                                onAdd={handleAddVeil}
                                onRemove={handleRemoveVeil}
                            />
                        </div>

                        <div className="lv-editor__actions">
                            <button
                                type="button"
                                className="lv-editor__btn lv-editor__btn--ghost"
                                onClick={handleCancel}
                            >
                                Cancel
                            </button>
                            <button
                                ref={firstFocusableRef}
                                type="button"
                                className="lv-editor__btn lv-editor__btn--primary"
                                onClick={handleSave}
                            >
                                Save Changes
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}