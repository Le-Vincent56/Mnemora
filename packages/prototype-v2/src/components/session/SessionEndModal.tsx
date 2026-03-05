import { useEffect, useMemo, useState } from 'react';
import { Pencil, Plus, Redo2, Sparkles, Star, Trash2, Undo2 } from 'lucide-react';
import { Modal } from '@/components/composed';
import { Button, Icon, Stack, Surface, Text } from '@/primitives';
import { useSessionMode } from '@/adapters/session-mode';
import styles from './session.module.css';

function formatStartedAt(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleString();
}

export interface SessionEndModalProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    sessionName: string;
    startedAt: string;
    elapsedLabel: string;
}

export function SessionEndModal({
    open,
    onClose,
    onConfirm,
    sessionName,
    startedAt,
    elapsedLabel,
}: SessionEndModalProps) {
    const sessionMode = useSessionMode();
    const [draft, setDraft] = useState('');
    const [editingID, setEditingID] = useState<string | null>(null);
    const [starDraft, setStarDraft] = useState('');
    const [wishDraft, setWishDraft] = useState('');

    const notes = sessionMode.notes.quickNotes;
    const stars = sessionMode.notes.starsAndWishes?.stars ?? [];
    const wishes = sessionMode.notes.starsAndWishes?.wishes ?? [];

    const canSubmitNote = draft.trim().length > 0 && !sessionMode.status.notesSaving;
    const canAddStar = starDraft.trim().length > 0 && !sessionMode.status.notesSaving;
    const canAddWish = wishDraft.trim().length > 0 && !sessionMode.status.notesSaving;

    useEffect(() => {
        if (!open) return;
        setDraft('');
        setEditingID(null);
        setStarDraft('');
        setWishDraft('');
    }, [open]);

    const handleSubmitNote = async () => {
        // Exit case - cannot submit the note
        if (!canSubmitNote) return;

        // Exit case - editing a note
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

    const meta = useMemo(() => {
        return `Started: ${formatStartedAt(startedAt)} • Elapsed: ${elapsedLabel}`;
    }, [elapsedLabel, startedAt]);

    return (
        <Modal
            open={open}
            onClose={onClose}
            closeOnBackdrop={false}
            maxWidth={720}
            aria-label="Chapter concluded"
        >
            <Stack gap={5}>
                <Stack direction="horizontal" justify="between" align="center" wrap>
                    <Stack gap={1}>
                        <Text variant="title">Chapter Concluded</Text>
                        <Text variant="body-sm" color="tertiary">{sessionName}</Text>
                    </Stack>
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

                <Surface elevation="flat" radius="lg" padding="md" bordered>
                    <Stack gap={2}>
                        <Text variant="caption" color="tertiary">SESSION</Text>
                        <Text variant="body-sm" color="secondary">{meta}</Text>
                    </Stack>
                </Surface>

                <Surface elevation="flat" radius="lg" padding="md" bordered>
                    <Stack gap={3}>
                        <Text variant="heading">Session Thoughts</Text>

                        <div className={styles.inputRow}>
                            <textarea
                                className={styles.textarea}
                                value={draft}
                                onChange={(e) => setDraft(e.target.value)}
                                rows={3}
                                placeholder={editingID ? 'Edit thought...' : 'Add a final thought...'}
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
                                    disabled={!canSubmitNote}
                                    onClick={() => void handleSubmitNote()}
                                >
                                    <Icon icon={Plus} size={16} color="inherit" />
                                    {editingID ? 'Save' : 'Add'}
                                </Button>
                            </Stack>
                        </div>

                        {notes.length === 0 ? (
                            <Text variant="body-sm" color="tertiary">
                                No thoughts captured yet.
                            </Text>
                        ) : (
                            <div className={styles.noteList}>
                                {notes.map((n) => (
                                    <div key={n.id} className={styles.noteItem}>
                                        <div className={styles.noteMain}>
                                            <Text variant="body">{n.content}</Text>
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
                                                aria-label="Edit thought"
                                            >
                                                <Icon icon={Pencil} size={16} />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                iconOnly
                                                disabled={sessionMode.status.notesSaving}
                                                onClick={() => void sessionMode.removeQuickNote(n.id)}
                                                aria-label="Delete thought"
                                            >
                                                <Icon icon={Trash2} size={16} />
                                            </Button>
                                        </Stack>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Stack>
                </Surface>

                <Surface elevation="flat" radius="lg" padding="md" bordered>
                    <Stack gap={4}>
                        <Text variant="heading">Reflection</Text>
                        <Stack direction="horizontal" gap={4} wrap>
                            <div style={{ flex: 1, minWidth: 240 }}>
                                <Stack gap={2}>
                                    <Stack direction="horizontal" gap={2} align="center">
                                        <Icon icon={Star} size={16} color="secondary" />
                                        <Text variant="body-sm" color="secondary">Stars</Text>
                                    </Stack>
                                    <div className={styles.pillInputRow}>
                                        <input
                                            className={styles.input}
                                            value={starDraft}
                                            onChange={(e) => setStarDraft(e.target.value)}
                                            placeholder="What shone brightest?"
                                        />
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            iconOnly
                                            disabled={!canAddStar}
                                            onClick={() => void (async () => {
                                                const r = await sessionMode.addStar(starDraft);
                                                if (r.isSuccess) setStarDraft('');
                                            })()}
                                            aria-label="Add star"
                                        >
                                            <Icon icon={Plus} size={16} />
                                        </Button>
                                    </div>
                                    {stars.length > 0 && (
                                        <div className={styles.pillList}>
                                            {stars.map((s, i) => (
                                                <div key={`${s}-${i}`} className={styles.pill}>
                                                    <span className={styles.pillText}>{s}</span>
                                                    <button
                                                        type="button"
                                                        className={styles.pillDelete}
                                                        onClick={() => void sessionMode.removeStar(i)}
                                                        aria-label="Remove star"
                                                    >
                                                        <Icon icon={Trash2} size={16} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </Stack>
                            </div>

                            <div style={{ flex: 1, minWidth: 240 }}>
                                <Stack gap={2}>
                                    <Stack direction="horizontal" gap={2} align="center">
                                        <Icon icon={Sparkles} size={16} color="secondary" />
                                        <Text variant="body-sm" color="secondary">Wishes</Text>
                                    </Stack>
                                    <div className={styles.pillInputRow}>
                                        <input
                                            className={styles.input}
                                            value={wishDraft}
                                            onChange={(e) => setWishDraft(e.target.value)}
                                            placeholder="What calls to you?"
                                        />
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            iconOnly
                                            disabled={!canAddWish}
                                            onClick={() => void (async () => {
                                                const r = await sessionMode.addWish(wishDraft);
                                                if (r.isSuccess) setWishDraft('');
                                            })()}
                                            aria-label="Add wish"
                                        >
                                            <Icon icon={Plus} size={16} />
                                        </Button>
                                    </div>
                                    {wishes.length > 0 && (
                                        <div className={styles.pillList}>
                                            {wishes.map((w, i) => (
                                                <div key={`${w}-${i}`} className={styles.pill}>
                                                    <span className={styles.pillText}>{w}</span>
                                                    <button
                                                        type="button"
                                                        className={styles.pillDelete}
                                                        onClick={() => void sessionMode.removeWish(i)}
                                                        aria-label="Remove wish"
                                                    >
                                                        <Icon icon={Trash2} size={16} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </Stack>
                            </div>
                        </Stack>
                    </Stack>
                </Surface>

                {sessionMode.error && (
                    <Text variant="body-sm" color="secondary">
                        {sessionMode.error.message}
                    </Text>
                )}

                <Stack direction="horizontal" gap={3} justify="end" wrap>
                    <Button variant="ghost" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        disabled={sessionMode.status.ending || sessionMode.status.notesSaving}
                        onClick={onConfirm}
                    >
                        Close This Chapter
                    </Button>
                </Stack>
            </Stack>
        </Modal>
    );
}
