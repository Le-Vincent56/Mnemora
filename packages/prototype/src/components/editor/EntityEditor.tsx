import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, Trash2 } from 'lucide-react';
import { Entity, EntityType } from '@/data/mockData';
import { EntityTypeIcon } from '@/components/entity/EntityTypeIcon';
import { EditorField } from './EditorField';
import { EditorTextArea as EditorTextArea } from './EditorTextArea';
import { TagInput } from './TagInput';
import { ConnectionsEditor } from './ConnectionsEditor';
import { InlineEditableTitle } from './InlineEditableTitle';
import './EntityEditor.css';

interface EntityEditorProps {
    entity: Entity | null;
    onClose: () => void;
    onSave: (entity: Entity) => void;
    onDelete?: (entity: Entity) => void;
    availableTags?: string[];
    allEntities?: Entity[];
    onConnectionClick?: (id: string) => void;
}

type SaveStatus = 'saved' | 'unsaved' | 'saving' | 'error';
type WarningType = 'unsaved' | 'delete' | null;

interface FormState {
    name: string;
    description: string;
    secrets: string;
    tags: string[];
    connections: Array<{ id: string; name: string; type: EntityType }>;
}

const AUTOSAVE_DELAY = 1500; // 1.5 seconds after last keystroke

export function EntityEditor({
    entity,
    onClose,
    onSave,
    onDelete,
    availableTags = [],
    allEntities = [],
    onConnectionClick,
}: EntityEditorProps) {
    // Form state
    const [formState, setFormState] = useState<FormState>({
        name: '',
        description: '',
        secrets: '',
        tags: [],
        connections: [],
    });
    const [originalState, setOriginalState] = useState<FormState | null>(null);
    const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
    const [warningType, setWarningType] = useState<WarningType>(null);

    // Refs for auto-save
    const autoSaveTimerRef = useRef<number | null>(null);
    const lastSavedRef = useRef<FormState | null>(null);

    // Initialize form when entity changes
    useEffect(() => {
        if (entity) {
            const initial: FormState = {
                name: entity.name,
                description: entity.description,
                secrets: entity.secrets || '',
                tags: [...entity.tags],
                connections: [...entity.connections],
            };
            setFormState(initial);
            setOriginalState(initial);
            lastSavedRef.current = initial;
            setSaveStatus('saved');
            setWarningType(null);
        }
    }, [entity]);

    // Check if form has unsaved changes
    const isDirty = useCallback(() => {
        if (!originalState) return false;
        return (
            formState.name !== originalState.name ||
            formState.description !== originalState.description ||
            formState.secrets !== originalState.secrets ||
            JSON.stringify(formState.tags) !== JSON.stringify(originalState.tags) ||
            JSON.stringify(formState.connections) !== JSON.stringify(originalState.connections)
        );
    }, [formState, originalState]);

    // Check if there are changes since last save (for auto-save)
    const hasChangesSinceLastSave = useCallback(() => {
        if (!lastSavedRef.current) return false;
        return (
            formState.name !== lastSavedRef.current.name ||
            formState.description !== lastSavedRef.current.description ||
            formState.secrets !== lastSavedRef.current.secrets ||
            JSON.stringify(formState.tags) !== JSON.stringify(lastSavedRef.current.tags) ||
            JSON.stringify(formState.connections) !== JSON.stringify(lastSavedRef.current.connections)
        );
    }, [formState]);

    // Update save status when form changes
    useEffect(() => {
        if (isDirty()) {
            setSaveStatus('unsaved');
        }
    }, [isDirty]);

    // Auto-save effect
    useEffect(() => {
        if (!entity || !hasChangesSinceLastSave()) return;

        // Clear existing timer
        if (autoSaveTimerRef.current) {
            clearTimeout(autoSaveTimerRef.current);
        }

        // Set new timer
        autoSaveTimerRef.current = window.setTimeout(() => {
            performSave();
        }, AUTOSAVE_DELAY);

        return () => {
            if (autoSaveTimerRef.current) {
                clearTimeout(autoSaveTimerRef.current);
            }
        };
    }, [formState, entity, hasChangesSinceLastSave]);

    // Perform the actual save
    const performSave = useCallback(() => {
        if (!entity || !formState.name.trim()) return;

        setSaveStatus('saving');

        // Simulate save delay (replace with actual save logic)
        setTimeout(() => {
            const updatedEntity: Entity = {
                ...entity,
                name: formState.name,
                description: formState.description,
                secrets: formState.secrets || undefined,
                tags: formState.tags,
                connections: formState.connections,
                modifiedAt: new Date().toISOString(),
            };

            onSave(updatedEntity);
            lastSavedRef.current = { ...formState };
            setOriginalState({ ...formState });
            setSaveStatus('saved');
        }, 300);
    }, [entity, formState, onSave]);

    // Handle manual save
    const handleSave = useCallback(() => {
        // Clear auto-save timer
        if (autoSaveTimerRef.current) {
            clearTimeout(autoSaveTimerRef.current);
        }
        performSave();
    }, [performSave]);

    // Handle close request
    const handleCloseRequest = useCallback(() => {
        // Clear auto-save timer
        if (autoSaveTimerRef.current) {
            clearTimeout(autoSaveTimerRef.current);
        }

        if (isDirty()) {
            setWarningType('unsaved');
        } else {
            onClose();
        }
    }, [isDirty, onClose]);

    // Handle cancel (discard changes)
    const handleCancel = useCallback(() => {
        if (isDirty()) {
            setWarningType('unsaved');
        } else {
            onClose();
        }
    }, [isDirty, onClose]);

    // Handle delete request
    const handleDeleteRequest = useCallback(() => {
        setWarningType('delete');
    }, []);

    // Handle delete confirm
    const handleDeleteConfirm = useCallback(() => {
        if (entity && onDelete) {
            onDelete(entity);
            setWarningType(null);
            onClose();
        }
    }, [entity, onDelete, onClose]);

    // Handle discard changes
    const handleDiscard = useCallback(() => {
        setWarningType(null);
        onClose();
    }, [onClose]);

    // Handle cancel warning
    const handleCancelWarning = useCallback(() => {
        setWarningType(null);
    }, []);

    // Handle save and close
    const handleSaveAndClose = useCallback(() => {
        handleSave();
        setWarningType(null);
        // Small delay to let save complete
        setTimeout(() => onClose(), 350);
    }, [handleSave, onClose]);

    // Keyboard shortcuts
    useEffect(() => {
        if (!entity) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            // Escape to close
            if (e.key === 'Escape') {
                e.preventDefault();
                if (warningType) {
                    handleCancelWarning();
                } else {
                    handleCloseRequest();
                }
            }

            // Cmd+S to save
            if ((e.metaKey || e.ctrlKey) && e.key === 's') {
                e.preventDefault();
                handleSave();
            }

            // Cmd+Enter to save and close
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                e.preventDefault();
                handleSaveAndClose();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [entity, warningType, handleCloseRequest, handleSave, handleSaveAndClose, handleCancelWarning]);

    // Lock body scroll when open
    useEffect(() => {
        if (entity) {
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [entity]);

    // Update form field
    const updateField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
        setFormState(prev => ({ ...prev, [field]: value }));
    };

    // Format entity type for display
    const formatType = (type: EntityType): string => {
        return type.charAt(0).toUpperCase() + type.slice(1);
    };

    // Get status text
    const getStatusText = (): string => {
        switch (saveStatus) {
            case 'saved': return 'Saved';
            case 'unsaved': return 'Unsaved';
            case 'saving': return 'Saving...';
            case 'error': return 'Error';
        }
    };

    return (
        <AnimatePresence>
            {entity && (
                <motion.div
                    className="entity-editor-backdrop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={handleCloseRequest}
                >
                    <motion.div
                        className="entity-editor"
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{
                            type: 'tween',
                            duration: 0.3,
                            ease: [0.23, 1, 0.32, 1],
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <header className="entity-editor__header">
                            <div className="entity-editor__header-left">
                                <div className="entity-editor__icon">
                                    <EntityTypeIcon type={entity.type} size={24} />
                                </div>
                                <div className="entity-editor__title-group">
                                    <InlineEditableTitle
                                        value={formState.name}
                                        onChange={(name) => updateField('name', name)}
                                        placeholder="Untitled entity"
                                    />
                                    <span className="entity-editor__type">
                                        {formatType(entity.type)}
                                    </span>
                                </div>
                            </div>
                            <div className="entity-editor__header-right">
                                <div className={`entity-editor__status entity-editor__status--${saveStatus}`}>
                                    <span className="entity-editor__status-dot" />
                                    <span>{getStatusText()}</span>
                                </div>
                                <button
                                    className="entity-editor__close"
                                    onClick={handleCloseRequest}
                                    aria-label="Close editor"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </header>

                        {/* Content */}
                        <div className="entity-editor__content">
                            {/* Description field */}
                            <EditorField label="Description">
                                <EditorTextArea
                                    value={formState.description}
                                    onChange={(description: string) => updateField('description', description)}
                                    entityType={entity.type}
                                    field="description"
                                    placeholder="Describe this entity..."
                                />
                            </EditorField>

                            {/* Secrets field */}
                            <EditorField
                                label="Secrets (GM Only)"
                                icon={Lock}
                                variant="secrets"
                            >
                                <EditorTextArea
                                    value={formState.secrets}
                                    onChange={(secrets: string) => updateField('secrets', secrets)}
                                    entityType={entity.type}
                                    field="secrets"
                                    placeholder="Hidden information only you can see..."
                                    borderless
                                />
                            </EditorField>

                            {/* Tags */}
                            <EditorField label="Tags">
                                <TagInput
                                    value={formState.tags}
                                    onChange={(tags) => updateField('tags', tags)}
                                    availableTags={availableTags}
                                    placeholder="Add tags..."
                                />
                            </EditorField>

                            {/* Connections */}
                            <EditorField label="Connections">
                                <ConnectionsEditor
                                    value={formState.connections}
                                    onChange={(connections) => updateField('connections', connections)}
                                    allEntities={allEntities}
                                    currentEntityId={entity.id}
                                    onConnectionClick={onConnectionClick}
                                />
                            </EditorField>
                        </div>

                        {/* Footer */}
                        <footer className="entity-editor__footer">
                            <div className="entity-editor__footer-left">
                                {onDelete && (
                                    <button
                                        type="button"
                                        className="entity-editor__delete-btn"
                                        onClick={handleDeleteRequest}
                                    >
                                        <Trash2 size={14} />
                                        Delete
                                    </button>
                                )}
                            </div>

                            <div className="entity-editor__footer-right">
                                <span className="entity-editor__autosave-hint">
                                    Auto-saves after changes
                                </span>

                                <div className="entity-editor__actions">
                                    <button
                                        type="button"
                                        className="entity-editor__cancel-btn"
                                        onClick={handleCancel}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        className={`entity-editor__save-btn ${saveStatus === 'unsaved' ? 'entity-editor__save-btn--unsaved' : ''}`}
                                        onClick={handleSave}
                                        disabled={saveStatus === 'saving' || !isDirty()}
                                    >
                                        {saveStatus === 'saving' ? 'Saving...' : 'Save'}
                                    </button>
                                </div>
                            </div>
                        </footer>

                        {/* Warning Modal */}
                        <AnimatePresence>
                            {warningType && (
                                <motion.div
                                    className="entity-editor__warning"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.15 }}
                                >
                                    <motion.div
                                        className={`entity-editor__warning-card ${warningType === 'delete' ? 'entity-editor__warning-card--delete' : ''}`}
                                        initial={{ scale: 0.95, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0.95, opacity: 0 }}
                                        transition={{
                                            duration: 0.2,
                                            ease: [0.23, 1, 0.32, 1]
                                        }}
                                    >
                                        {warningType === 'unsaved' ? (
                                            <>
                                                <h3 className="entity-editor__warning-title">
                                                    Unsaved Changes
                                                </h3>
                                                <p className="entity-editor__warning-text">
                                                    You have unsaved changes. Would you like to save before closing?
                                                </p>
                                                <div className="entity-editor__warning-actions">
                                                    <button
                                                        type="button"
                                                        className="entity-editor__cancel-btn"
                                                        onClick={handleDiscard}
                                                    >
                                                        Discard
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="entity-editor__cancel-btn"
                                                        onClick={handleCancelWarning}
                                                    >
                                                        Keep Editing
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="entity-editor__save-btn"
                                                        onClick={handleSaveAndClose}
                                                    >
                                                        Save & Close
                                                    </button>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <h3 className="entity-editor__warning-title">
                                                    Delete Entity
                                                </h3>
                                                <p className="entity-editor__warning-text">
                                                    Are you sure you want to delete{' '}
                                                    <span className="entity-editor__warning-entity-name">
                                                        {entity.name}
                                                    </span>
                                                    ? This action cannot be undone.
                                                </p>
                                                <div className="entity-editor__warning-actions">
                                                    <button
                                                        type="button"
                                                        className="entity-editor__cancel-btn"
                                                        onClick={handleCancelWarning}
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="entity-editor__delete-confirm-btn"
                                                        onClick={handleDeleteConfirm}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}