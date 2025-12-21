import { useState, useRef, useEffect, useCallback } from 'react';
import { Plus, X } from 'lucide-react';
import { Entity, EntityType } from '@/data/mockData';
import { EntityTypeIcon } from '@/components/entity/EntityTypeIcon';
import { ConnectionPicker } from './ConnectionPicker';
import './ConnectionsEditor.css';

interface Connection {
    id: string;
    name: string;
    type: EntityType;
}

interface ConnectionState extends Connection {
    isRemoving: boolean;
}

interface ConnectionsEditorProps {
    value: Connection[];                            // Current connections
    onChange: (connections: Connection[]) => void;  // Called when connections change
    allEntities: Entity[];                          // All entities for the picker
    currentEntityId: string;                        // Current entity ID (to exclude from picker)
    onConnectionClick?: (id: string) => void;       // Called when a connection chip is clicked (to peek)
}

export function ConnectionsEditor({
    value,
    onChange,
    allEntities,
    currentEntityId,
    onConnectionClick,
}: ConnectionsEditorProps) {
    const [showPicker, setShowPicker] = useState(false);
    const [connections, setConnections] = useState<ConnectionState[]>(() =>
        value.map(conn => ({ ...conn, isRemoving: false }))
    );

    const containerRef = useRef<HTMLDivElement>(null);

    // Sync with external value
    useEffect(() => {
        setConnections(value.map(conn => ({ ...conn, isRemoving: false })));
    }, [value]);

    // Close picker when clicking outside
    useEffect(() => {
        if (!showPicker) return;

        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setShowPicker(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showPicker]);

    // Close picker on Escape
    useEffect(() => {
        if (!showPicker) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setShowPicker(false);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [showPicker]);

    const handleRemove = useCallback((id: string) => {
        // Trigger exit animation
        setConnections(prev =>
            prev.map(conn =>
                conn.id === id ? { ...conn, isRemoving: true } : conn
            )
        );

        // After animation, actually remove
        setTimeout(() => {
            onChange(value.filter(conn => conn.id !== id));
        }, 100);
    }, [value, onChange]);

    const handleSelect = useCallback((entity: Entity) => {
        const newConnection: Connection = {
            id: entity.id,
            name: entity.name,
            type: entity.type,
        };

        onChange([...value, newConnection]);
        setShowPicker(false);
    }, [value, onChange]);

    // IDs to exclude from picker (current entity + already connected)
    const excludeIds = [currentEntityId, ...value.map(c => c.id)];

    return (
        <div className="connections-editor" ref={containerRef}>
            {connections.length > 0 || showPicker ? (
                <div className="connections-editor__list">
                    {connections.map(conn => (
                        <div
                            key={conn.id}
                            className={`connections-editor__chip ${conn.isRemoving ? 'connections-editor__chip--removing' : ''}`}
                        >
                            <EntityTypeIcon
                                type={conn.type}
                                size={14}
                                className="connections-editor__chip-icon"
                            />
                            <span
                                className="connections-editor__chip-name"
                                onClick={() => onConnectionClick?.(conn.id)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        onConnectionClick?.(conn.id);
                                    }
                                }}
                            >
                                {conn.name}
                            </span>
                            <button
                                type="button"
                                className="connections-editor__chip-remove"
                                onClick={() => handleRemove(conn.id)}
                                aria-label={`Remove connection to ${conn.name}`}
                            >
                                <X />
                            </button>
                        </div>
                    ))}

                    <button
                        type="button"
                        className={`connections-editor__add ${showPicker ? 'connections-editor__add--active' : ''}`}
                        onClick={() => setShowPicker(!showPicker)}
                        aria-expanded={showPicker}
                        aria-haspopup="listbox"
                    >
                        <Plus size={14} />
                        Add
                    </button>
                </div>
            ) : (
                <div className="connections-editor__empty">
                    <button
                        type="button"
                        className="connections-editor__add"
                        onClick={() => setShowPicker(true)}
                        style={{ margin: '0 auto' }}
                    >
                        <Plus size={14} />
                        Add connection
                    </button>
                </div>
            )}

            {showPicker && (
                <ConnectionPicker
                    entities={allEntities}
                    excludeIds={excludeIds}
                    onSelect={handleSelect}
                    onClose={() => setShowPicker(false)}
                />
            )}
        </div>
    );
}