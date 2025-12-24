import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Lock, Trash2, Search, PanelLeftClose, PanelLeft
} from 'lucide-react';
import { Entity, EntityType } from '@/data/mockData';
import { EntityTypeIcon } from '@/components/entity/EntityTypeIcon';
import { EditorField } from './EditorField';
import { EditorTextArea } from './EditorTextArea';
import { TagInput } from './TagInput';
import { ConnectionsEditor } from './ConnectionsEditor';
import { InlineEditableTitle } from './InlineEditableTitle';
import { CharacterFieldsLayout } from './layouts/CharacterFieldsLayout';
import { LocationFieldsLayout } from './layouts/LocationFieldsLayout';
import { FactionFieldsLayout } from './layouts/FactionFieldsLayout';
import { NoteFieldsLayout } from './layouts/NoteFieldsLayout';
import { SessionEditorLayout } from './layouts/SessionEditorLayout';
import { WarningModal } from './WarningModal';
import './ManuscriptEditor.css';

interface ManuscriptEditorProps {
    entity: Entity | null;
    entities: Entity[];
    onClose: () => void;
    onSave: (entity: Entity) => void;
    onDelete?: (entity: Entity) => void;
    onEntitySelect: (entity: Entity) => void;
    onCreateEntity?: (type: EntityType) => void;
    availableTags?: string[];
    onConnectionClick?: (id: string) => void;
    hasStarsAndWishes?: boolean;
}

type SaveStatus = 'saved' | 'unsaved' | 'saving' | 'error';
type WarningType = 'unsaved' | 'delete' | null;

interface FormState {
    name: string;
    description: string;
    secrets: string;
    tags: string[];
    connections: Array<{ id: string; name: string; type: EntityType }>;
    typeSpecificFields: Record<string, string>;
    prepNotes?: string;
    quickNotes?: Array<{ id: string; content: string; capturedAt: string; linkedEntityIds: string[] }>;
    starsAndWishes?: { stars: string[]; wishes: string[] };
}

const AUTOSAVE_DELAY = 1500;

// Animation variants
const pageVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] }
    },
    exit: {
        opacity: 0,
        transition: { duration: 0.25 }
    }
};

const indexItemVariants = {
    hidden: { opacity: 0, x: -8 },
    visible: {
        opacity: 1,
        x: 0,
        transition: { duration: 0.25, ease: [0.23, 1, 0.32, 1] }
    }
};

export function ManuscriptEditor({
    entity,
    entities,
    onClose,
    onSave,
    onDelete,
    onEntitySelect,
    onCreateEntity,
    availableTags = [],
    onConnectionClick,
    hasStarsAndWishes = false,
}: ManuscriptEditorProps) {
    // Index panel state
    const [isIndexCollapsed, setIsIndexCollapsed] = useState(false);
    const [indexSearch, setIndexSearch] = useState('');
    const [indexTypeFilter, setIndexTypeFilter] = useState<EntityType | 'all'>('all');

    // Form state
    const [formState, setFormState] = useState<FormState>({
        name: '',
        description: '',
        secrets: '',
        tags: [],
        connections: [],
        typeSpecificFields: {},
    });
    const [originalState, setOriginalState] = useState<FormState | null>(null);
    const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
    const [warningType, setWarningType] = useState<WarningType>(null);
    const [focusedSection, setFocusedSection] = useState<string | null>(null);

    const autoSaveTimerRef = useRef<number | null>(null);
    const lastSavedRef = useRef<FormState | null>(null);

    // Filter entities for index
    const filteredEntities = useMemo(() => {
        return entities.filter(e => {
            const matchesSearch = !indexSearch ||
                e.name.toLowerCase().includes(indexSearch.toLowerCase());
            const matchesType = indexTypeFilter === 'all' || e.type === indexTypeFilter;
            return matchesSearch && matchesType;
        });
    }, [entities, indexSearch, indexTypeFilter]);

    // Group entities by type for the index
    const groupedEntities = useMemo(() => {
        const groups: Record<EntityType, Entity[]> = {
            character: [],
            location: [],
            faction: [],
            session: [],
            note: [],
        };
        filteredEntities.forEach(e => {
            groups[e.type].push(e);
        });
        return groups;
    }, [filteredEntities]);

    // Initialize form when entity changes
    useEffect(() => {
        if (entity) {
            const initial: FormState = {
                name: entity.name,
                description: entity.description,
                secrets: entity.secrets || '',
                tags: [...entity.tags],
                connections: [...entity.connections],
                typeSpecificFields: extractTypeSpecificFields(entity),
            };

            if (entity.type === 'session') {
                initial.prepNotes = (entity as any).prepNotes || '';
                initial.quickNotes = (entity as any).quickNotes || [];
                initial.starsAndWishes = (entity as any).starsAndWishes || { stars: [], wishes: [] };
            }

            setFormState(initial);
            setOriginalState(initial);
            lastSavedRef.current = initial;
            setSaveStatus('saved');
            setWarningType(null);
        }
    }, [entity]);

    function extractTypeSpecificFields(entity: Entity): Record<string, string> {
        return (entity as Entity & { typeSpecificFields?: Record<string, string> }).typeSpecificFields || {};
    }

    const isDirty = useCallback(() => {
        if (!originalState) return false;
        return JSON.stringify(formState) !== JSON.stringify(originalState);
    }, [formState, originalState]);

    const hasChangesSinceLastSave = useCallback(() => {
        if (!lastSavedRef.current) return false;
        return JSON.stringify(formState) !== JSON.stringify(lastSavedRef.current);
    }, [formState]);

    // Auto-save effect
    useEffect(() => {
        if (!entity || !hasChangesSinceLastSave()) return;
        setSaveStatus('unsaved');

        if (autoSaveTimerRef.current) {
            clearTimeout(autoSaveTimerRef.current);
        }

        autoSaveTimerRef.current = window.setTimeout(() => {
            performSave();
        }, AUTOSAVE_DELAY);

        return () => {
            if (autoSaveTimerRef.current) {
                clearTimeout(autoSaveTimerRef.current);
            }
        };
    }, [formState, entity, hasChangesSinceLastSave]);

    const performSave = useCallback(() => {
        if (!entity || !formState.name.trim()) return;

        setSaveStatus('saving');

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

            (updatedEntity as any).typeSpecificFields = formState.typeSpecificFields;

            if (entity.type === 'session') {
                (updatedEntity as any).prepNotes = formState.prepNotes;
                (updatedEntity as any).quickNotes = formState.quickNotes;
                (updatedEntity as any).starsAndWishes = formState.starsAndWishes;
            }

            onSave(updatedEntity);
            lastSavedRef.current = { ...formState };
            setOriginalState({ ...formState });
            setSaveStatus('saved');
        }, 300);
    }, [entity, formState, onSave]);

    const handleSave = useCallback(() => {
        if (autoSaveTimerRef.current) {
            clearTimeout(autoSaveTimerRef.current);
        }
        performSave();
    }, [performSave]);

    const handleCloseRequest = useCallback(() => {
        if (autoSaveTimerRef.current) {
            clearTimeout(autoSaveTimerRef.current);
        }

        if (isDirty()) {
            setWarningType('unsaved');
        } else {
            onClose();
        }
    }, [isDirty, onClose]);

    const handleDeleteRequest = useCallback(() => {
        setWarningType('delete');
    }, []);

    const handleDeleteConfirm = useCallback(() => {
        if (entity && onDelete) {
            onDelete(entity);
            setWarningType(null);
        }
    }, [entity, onDelete]);

    const handleDiscard = useCallback(() => {
        setWarningType(null);
        onClose();
    }, [onClose]);

    const handleCancelWarning = useCallback(() => {
        setWarningType(null);
    }, []);

    const handleSaveAndClose = useCallback(() => {
        handleSave();
        setWarningType(null);
        setTimeout(() => onClose(), 350);
    }, [handleSave, onClose]);

    // Entity selection with unsaved check
    const handleEntitySelect = useCallback((selectedEntity: Entity) => {
        if (entity && isDirty()) {
            // Auto-save before switching
            performSave();
        }
        onEntitySelect(selectedEntity);
    }, [entity, isDirty, performSave, onEntitySelect]);

    // Keyboard shortcuts
    useEffect(() => {
        if (!entity) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                if (warningType) {
                    handleCancelWarning();
                } else {
                    handleCloseRequest();
                }
            }

            if ((e.metaKey || e.ctrlKey) && e.key === 's') {
                e.preventDefault();
                handleSave();
            }

            // Toggle index with Cmd+\
            if ((e.metaKey || e.ctrlKey) && e.key === '\\') {
                e.preventDefault();
                setIsIndexCollapsed(c => !c);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [entity, warningType, handleCloseRequest, handleSave, handleCancelWarning]);

    // Lock body scroll
    useEffect(() => {
        if (entity) {
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [entity]);

    const updateField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
        setFormState(prev => ({ ...prev, [field]: value }));
    };

    const updateTypeSpecificField = useCallback((fieldName: string, value: string) => {
        setFormState(prev => ({
            ...prev,
            typeSpecificFields: {
                ...prev.typeSpecificFields,
                [fieldName]: value,
            },
        }));
    }, []);

    const formatType = (type: EntityType): string => {
        return type.charAt(0).toUpperCase() + type.slice(1);
    };

    const getStatusText = (): string => {
        switch (saveStatus) {
            case 'saved': return 'Saved';
            case 'unsaved': return 'Unsaved';
            case 'saving': return 'Saving...';
            case 'error': return 'Error';
        }
    };

    const entityColor = useMemo(() => {
        if (!entity) return 'var(--primary)';
        return `var(--entity-${entity.type})`;
    }, [entity]);

    const isSessionEntity = entity?.type === 'session';

    // Render type-specific fields layout
    const renderTypeSpecificLayout = () => {
        if (!entity) return null;

        const commonProps = {
            fields: formState.typeSpecificFields,
            onChange: updateTypeSpecificField,
            focusedSection,
            onFocusChange: setFocusedSection,
        };

        switch (entity.type) {
            case 'character':
                return <CharacterFieldsLayout {...commonProps} />;
            case 'location':
                return <LocationFieldsLayout {...commonProps} />;
            case 'faction':
                return <FactionFieldsLayout {...commonProps} />;
            case 'note':
                return <NoteFieldsLayout {...commonProps} />;
            case 'session':
                return (
                    <SessionEditorLayout
                        prepNotes={formState.prepNotes || ''}
                        onPrepNotesChange={(value: string) => updateField('prepNotes', value)}
                        quickNotes={formState.quickNotes || []}
                        starsAndWishes={formState.starsAndWishes}
                        onStarsAndWishesChange={(value: { stars: string[]; wishes: string[] }) => updateField('starsAndWishes', value)}
                        hasStarsAndWishes={hasStarsAndWishes}
                        focusedSection={focusedSection}
                        onFocusChange={setFocusedSection}
                    />
                );
            default:
                return null;
        }
    };

    const entityTypes: EntityType[] = ['character', 'location', 'faction', 'session', 'note'];

    return (
        <AnimatePresence>
            {entity && (
                <motion.div
                    className="manuscript-editor"
                    variants={pageVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                >
                    {/* Left Page: Index */}
                    <motion.aside
                        className={`manuscript-editor__index ${isIndexCollapsed ? 'manuscript-editor__index--collapsed' : ''}`}
                        initial={false}
                        animate={{
                            width: isIndexCollapsed ? 48 : 280,
                            transition: { duration: 0.3, ease: [0.23, 1, 0.32, 1] }
                        }}
                    >
                        {/* Index Header */}
                        <div className="manuscript-editor__index-header">
                            {!isIndexCollapsed && (
                                <motion.div
                                    className="manuscript-editor__index-title"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.1 }}
                                >
                                    <span className="manuscript-editor__index-label">Index</span>
                                    <span className="manuscript-editor__index-count">{entities.length}</span>
                                </motion.div>
                            )}
                            <button
                                className="manuscript-editor__toggle-btn"
                                onClick={() => setIsIndexCollapsed(!isIndexCollapsed)}
                                aria-label={isIndexCollapsed ? 'Expand index' : 'Collapse index'}
                            >
                                {isIndexCollapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
                            </button>
                        </div>

                        {/* Index Search & Filter */}
                        {!isIndexCollapsed && (
                            <motion.div
                                className="manuscript-editor__index-controls"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.15 }}
                            >
                                <div className="manuscript-editor__index-search">
                                    <Search size={14} />
                                    <input
                                        type="text"
                                        placeholder="Search..."
                                        value={indexSearch}
                                        onChange={(e) => setIndexSearch(e.target.value)}
                                    />
                                </div>
                                <div className="manuscript-editor__index-filters">
                                    <button
                                        className={`manuscript-editor__filter-btn ${indexTypeFilter === 'all' ? 'manuscript-editor__filter-btn--active' : ''}`}
                                        onClick={() => setIndexTypeFilter('all')}
                                    >
                                        All
                                    </button>
                                    {entityTypes.map(type => (
                                        <button
                                            key={type}
                                            className={`manuscript-editor__filter-btn ${indexTypeFilter === type ? 'manuscript-editor__filter-btn--active' : ''}`}
                                            onClick={() => setIndexTypeFilter(type)}
                                            style={{ '--filter-color': `var(--entity-${type})` } as React.CSSProperties}
                                        >
                                            <EntityTypeIcon type={type} size={12} />
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* Index List */}
                        {!isIndexCollapsed && (
                            <motion.div
                                className="manuscript-editor__index-list"
                                initial="hidden"
                                animate="visible"
                                variants={{
                                    visible: { transition: { staggerChildren: 0.02, delayChildren: 0.2 } }
                                }}
                            >
                                {indexTypeFilter === 'all' ? (
                                    // Grouped view
                                    entityTypes.map(type => {
                                        const typeEntities = groupedEntities[type];
                                        if (typeEntities.length === 0) return null;

                                        return (
                                            <div key={type} className="manuscript-editor__index-group">
                                                <div className="manuscript-editor__index-group-header">
                                                    <EntityTypeIcon type={type} size={12} />
                                                    <span>{formatType(type)}s</span>
                                                    <span className="manuscript-editor__group-count">{typeEntities.length}</span>
                                                </div>
                                                {typeEntities.map(e => (
                                                    <motion.button
                                                        key={e.id}
                                                        className={`manuscript-editor__index-item ${e.id === entity.id ? 'manuscript-editor__index-item--active' : ''}`}
                                                        onClick={() => handleEntitySelect(e)}
                                                        variants={indexItemVariants}
                                                        style={{ '--item-color': `var(--entity-${e.type})` } as React.CSSProperties}
                                                    >
                                                        <span className="manuscript-editor__item-indicator" />
                                                        <span className="manuscript-editor__item-name">{e.name}</span>
                                                    </motion.button>
                                                ))}
                                            </div>
                                        );
                                    })
                                ) : (
                                    // Flat filtered view
                                    filteredEntities.map(e => (
                                        <motion.button
                                            key={e.id}
                                            className={`manuscript-editor__index-item ${e.id === entity.id ? 'manuscript-editor__index-item--active' : ''}`}
                                            onClick={() => handleEntitySelect(e)}
                                            variants={indexItemVariants}
                                            style={{ '--item-color': `var(--entity-${e.type})` } as React.CSSProperties}
                                        >
                                            <EntityTypeIcon type={e.type} size={14} />
                                            <span className="manuscript-editor__item-name">{e.name}</span>
                                        </motion.button>
                                    ))
                                )}

                                {/* Create New Button */}
                                {onCreateEntity && (
                                    <div className="manuscript-editor__index-create">
                                        <span className="manuscript-editor__create-label">Create New</span>
                                        <div className="manuscript-editor__create-buttons">
                                            {entityTypes.map(type => (
                                                <button
                                                    key={type}
                                                    className="manuscript-editor__create-btn"
                                                    onClick={() => onCreateEntity(type)}
                                                    title={`New ${formatType(type)}`}
                                                    style={{ '--btn-color': `var(--entity-${type})` } as React.CSSProperties}
                                                >
                                                    <EntityTypeIcon type={type} size={14} />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* Collapsed: Just icons */}
                        {isIndexCollapsed && (
                            <div className="manuscript-editor__index-collapsed-icons">
                                {entityTypes.map(type => {
                                    const count = groupedEntities[type].length;
                                    if (count === 0) return null;
                                    return (
                                        <button
                                            key={type}
                                            className="manuscript-editor__collapsed-type"
                                            onClick={() => {
                                                setIndexTypeFilter(type);
                                                setIsIndexCollapsed(false);
                                            }}
                                            title={`${count} ${formatType(type)}${count !== 1 ? 's' : ''}`}
                                            style={{ '--type-color': `var(--entity-${type})` } as React.CSSProperties}
                                        >
                                            <EntityTypeIcon type={type} size={16} />
                                            <span className="manuscript-editor__collapsed-count">{count}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </motion.aside>

                    {/* The Spine */}
                    <div className="manuscript-editor__spine" />

                    {/* Right Page: Editor */}
                    <motion.main
                        className="manuscript-editor__workspace"
                        style={{ '--entity-color': entityColor } as React.CSSProperties}
                    >
                        {/* Workspace Header */}
                        <header className="manuscript-editor__header">
                            <div className="manuscript-editor__header-main">
                                <div className="manuscript-editor__entity-icon">
                                    <EntityTypeIcon type={entity.type} size={32} />
                                </div>
                                <div className="manuscript-editor__title-area">
                                    <InlineEditableTitle
                                        value={formState.name}
                                        onChange={(name) => updateField('name', name)}
                                        placeholder="Untitled entity"
                                    />
                                    <div className="manuscript-editor__meta">
                                        <span className="manuscript-editor__type-badge">
                                            {formatType(entity.type)}
                                        </span>
                                        <span className={`manuscript-editor__status manuscript-editor__status--${saveStatus}`}>
                                            <span className="manuscript-editor__status-dot" />
                                            {getStatusText()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="manuscript-editor__header-actions">
                                <button
                                    className="manuscript-editor__action-btn"
                                    onClick={handleSave}
                                    disabled={saveStatus === 'saving' || !isDirty()}
                                >
                                    Save
                                </button>
                                <button
                                    className="manuscript-editor__close-btn"
                                    onClick={handleCloseRequest}
                                    aria-label="Close editor"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </header>

                        {/* Workspace Content */}
                        <div className="manuscript-editor__content">
                            <div className="manuscript-editor__scroll-area">
                                {/* Description (not for sessions) */}
                                {!isSessionEntity && (
                                    <section
                                        className={`manuscript-editor__section ${focusedSection && focusedSection !== 'description'
                                                ? 'manuscript-editor__section--dimmed'
                                                : ''
                                            }`}
                                    >
                                        <EditorField label="Description">
                                            <EditorTextArea
                                                value={formState.description}
                                                onChange={(value) => updateField('description', value)}
                                                entityType={entity.type}
                                                field="description"
                                                placeholder="Describe this entity..."
                                                onFocus={() => setFocusedSection('description')}
                                                onBlur={() => setFocusedSection(null)}
                                            />
                                        </EditorField>
                                    </section>
                                )}

                                {/* Type-Specific Fields */}
                                <section className="manuscript-editor__section manuscript-editor__section--type-specific">
                                    {renderTypeSpecificLayout()}
                                </section>

                                {/* Secrets */}
                                <section
                                    className={`manuscript-editor__section manuscript-editor__section--secrets ${focusedSection && focusedSection !== 'secrets'
                                            ? 'manuscript-editor__section--dimmed'
                                            : ''
                                        }`}
                                >
                                    <EditorField
                                        label="Secrets (GM Only)"
                                        icon={Lock}
                                        variant="secrets"
                                    >
                                        <EditorTextArea
                                            value={formState.secrets}
                                            onChange={(value) => updateField('secrets', value)}
                                            entityType={entity.type}
                                            field="secrets"
                                            placeholder="Hidden information only you can see..."
                                            borderless
                                            onFocus={() => setFocusedSection('secrets')}
                                            onBlur={() => setFocusedSection(null)}
                                        />
                                    </EditorField>
                                </section>

                                {/* Marginalia: Tags & Connections */}
                                <aside className="manuscript-editor__marginalia">
                                    <div className="manuscript-editor__marginalia-section">
                                        <EditorField label="Tags">
                                            <TagInput
                                                value={formState.tags}
                                                onChange={(tags) => updateField('tags', tags)}
                                                availableTags={availableTags}
                                                placeholder="Add tags..."
                                            />
                                        </EditorField>
                                    </div>
                                    <div className="manuscript-editor__marginalia-section">
                                        <EditorField label="Connections">
                                            <ConnectionsEditor
                                                value={formState.connections}
                                                onChange={(connections) => updateField('connections', connections)}
                                                allEntities={entities}
                                                currentEntityId={entity.id}
                                                onConnectionClick={onConnectionClick}
                                            />
                                        </EditorField>
                                    </div>
                                </aside>
                            </div>
                        </div>

                        {/* Footer */}
                        <footer className="manuscript-editor__footer">
                            <div className="manuscript-editor__footer-left">
                                {onDelete && (
                                    <button
                                        type="button"
                                        className="manuscript-editor__delete-btn"
                                        onClick={handleDeleteRequest}
                                    >
                                        <Trash2 size={14} />
                                        Delete
                                    </button>
                                )}
                            </div>
                            <div className="manuscript-editor__footer-right">
                                <span className="manuscript-editor__shortcut-hint">
                                    <kbd>⌘</kbd><kbd>\</kbd> toggle index
                                </span>
                                <span className="manuscript-editor__shortcut-hint">
                                    <kbd>⌘</kbd><kbd>S</kbd> save
                                </span>
                            </div>
                        </footer>

                        {/* Warning Modal */}
                        <WarningModal
                            type={warningType}
                            entityName={entity.name}
                            onDiscard={handleDiscard}
                            onKeepEditing={handleCancelWarning}
                            onSaveAndClose={handleSaveAndClose}
                            onDeleteConfirm={handleDeleteConfirm}
                            onCancel={handleCancelWarning}
                        />
                    </motion.main>
                </motion.div>
            )}
        </AnimatePresence>
    );
}