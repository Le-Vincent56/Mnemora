import { useMemo, useState } from 'react';
import { Pencil, Plus, Redo2, Trash2, Undo2 } from 'lucide-react';
import { Button, Icon, Stack, Surface, Text } from '@/primitives';
import { useSessionMode } from '@/adapters/session-mode';
import styles from './session.module.css';

function formatTime(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function SessionNotesPanel() {
    const sessionMode = useSessionMode();
    const [draft, setDraft] = useState('');
    const [editingID, setEditingID] = useState<string | null>(null);

    const notes = sessionMode.notes.quickNotes;
    const canSubmit = draft.trim().length > 0 && !sessionMode.status.notesSaving;

    const headerLabel = useMemo(() => {
        if (!sessionMode.activeRun) return 'No active session';
        return `Session Notes (${notes.length})`;
    }, [notes.length, sessionMode.activeRun]);

    const handleSubmit = async () => {
        // Exit case - cannot submit
        if (!canSubmit) return;

        // Exit case - updating a quick note
        if (editingID) {
            const result = await sessionMode.updateQuickNote(editingID, draft);
            
            if (result.isSuccess) {
                setEditingID(null);
                setDraft('');
            }

            return;
        }

        const result = await sessionMode.addQuickNote(draft);
        if (result.isSuccess) setDraft('');
    };

    return (
        <Stack gap={6} className={styles.panel}>
            <Surface elevation="raised" radius="lg" padding="md" bordered>
                <Stack gap={4}>
                    <Stack direction="horizontal" justify="between" align="center" wrap>
                        <Text variant="heading">{headerLabel}</Text>
                        <Stack direction="horizontal" gap={2}>
                            <Button
                                variant="ghost"
                                size="sm"
                                iconOnly
                                disabled={!sessionMode.undoRedo.canUndo || sessionMode.status.notesSaving}
                                onClick={() => void sessionMode.undo()}
                                aria-label={sessionMode.undoRedo.nextUndoDescription
                                    ? `Undo: ${sessionMode.undoRedo.nextUndoDescription}`
                                    : 'Undo'}
                            >
                                <Icon icon={Undo2} size={16} />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                iconOnly
                                disabled={!sessionMode.undoRedo.canRedo || sessionMode.status.notesSaving}
                                onClick={() => void sessionMode.redo()}
                                aria-label={sessionMode.undoRedo.nextRedoDescription
                                    ? `Redo: ${sessionMode.undoRedo.nextRedoDescription}`
                                    : 'Redo'}
                            >
                                <Icon icon={Redo2} size={16} />
                            </Button>
                        </Stack>
                    </Stack>

                    <div className={styles.inputRow}>
                        <textarea
                            className={styles.textarea}
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            rows={3}
                            placeholder={editingID ? 'Edit note...' : 'Capture a thought...'}
                        />
                        <Stack direction="horizontal" gap={2} justify="end" wrap>
                            {editingID && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setEditingID(null);
                                        setDraft('');
                                    }}
                                >
                                    Cancel
                                </Button>
                            )}
                            <Button
                                variant="primary"
                                size="sm"
                                disabled={!canSubmit}
                                onClick={() => void handleSubmit()}
                            >
                                <Icon icon={Plus} size={16} color="inherit" />
                                {editingID ? 'Save' : 'Add'}
                            </Button>
                        </Stack>
                    </div>

                    {sessionMode.error && (
                        <Text variant="body-sm" color="secondary">
                            {sessionMode.error.message}
                        </Text>
                    )}
                </Stack>
            </Surface>

            <Surface elevation="flat" radius="lg" padding="md" bordered>
                {notes.length === 0 ? (
                    <Text variant="body-sm" color="tertiary">
                        No notes yet. Capture quick bullets during play.
                    </Text>
                ) : (
                    <div className={styles.noteList}>
                        {notes.map((n) => (
                            <div key={n.id} className={styles.noteItem}>
                                <div className={styles.noteMain}>
                                    <Text variant="body">{n.content}</Text>
                                    <Text variant="caption" color="tertiary">
                                        {formatTime(n.capturedAt)}
                                    </Text>
                                </div>
                                <Stack direction="horizontal" gap={2}>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        iconOnly
                                        disabled={sessionMode.status.notesSaving}
                                        onClick={() => {
                                            setEditingID(n.id);
                                            setDraft(n.content);
                                        }}
                                        aria-label="Edit note"
                                    >
                                        <Icon icon={Pencil} size={16} />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        iconOnly
                                        disabled={sessionMode.status.notesSaving}
                                        onClick={() => void sessionMode.removeQuickNote(n.id)}
                                        aria-label="Delete note"
                                    >
                                        <Icon icon={Trash2} size={16} />
                                    </Button>
                                </Stack>
                            </div>
                        ))}
                    </div>
                )}
            </Surface>
        </Stack>
    );
}
