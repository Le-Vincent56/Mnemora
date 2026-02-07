import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  CalendarClock,
  Star,
  Sparkles,
  Plus,
  Pencil,
  Trash2,
  Type,
  Heading,
  CheckSquare,
  Minus,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Text, Icon, Badge, Button } from '@/primitives';
import { Modal, FormField } from '@/components/composed';
import { useReducedMotion } from '@/hooks';
import { EASING, TIMING, toSeconds } from '@/tokens';
import { getAllSessions, type SessionData, type SessionBlock } from '@/data/mockSessions';
import styles from '@/components/prep/prep.module.css';

type SessionTab = 'upcoming' | 'history';

interface SessionFormData {
  title: string;
  date: string;
}

const EMPTY_FORM: SessionFormData = {
  title: '',
  date: '',
};

let blockCounter = 0;
function genBlockId(): string {
  return `blk-${Date.now()}-${++blockCounter}`;
}

function formatSessionDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatRelativeDate(dateStr: string): string {
  const diff = new Date(dateStr).getTime() - Date.now();
  const days = Math.ceil(diff / 86_400_000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days > 1) return `In ${days} days`;
  return `${Math.abs(days)}d ago`;
}

// ---------------------------------------------------------------------------
// Slash-command menu items
// ---------------------------------------------------------------------------

const SLASH_ITEMS = [
  { type: 'text' as const, label: 'Text', desc: 'Plain text block', icon: Type },
  { type: 'heading' as const, label: 'Heading', desc: 'Section heading', icon: Heading },
  { type: 'checklist' as const, label: 'Checklist', desc: 'To-do item', icon: CheckSquare },
  { type: 'divider' as const, label: 'Divider', desc: 'Horizontal rule', icon: Minus },
];

// ---------------------------------------------------------------------------
// Main Workspace
// ---------------------------------------------------------------------------

export function SessionsWorkspace() {
  const [sessions, setSessions] = useState<SessionData[]>(() => getAllSessions());
  const [activeTab, setActiveTab] = useState<SessionTab>('upcoming');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingForm, setEditingForm] = useState<SessionFormData>(EMPTY_FORM);
  const [activeSlashEditorId, setActiveSlashEditorId] = useState<string | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const reducedMotion = useReducedMotion();

  const upcoming = useMemo(
    () => sessions.filter((s) => s.isUpcoming).sort((a, b) => a.date.localeCompare(b.date)),
    [sessions],
  );

  const history = useMemo(
    () => sessions.filter((s) => !s.isUpcoming).sort((a, b) => b.date.localeCompare(a.date)),
    [sessions],
  );

  // Auto-select first upcoming session if none selected or selection becomes invalid
  useEffect(() => {
    if (upcoming.length === 0) {
      setActiveSessionId(null);
      return;
    }
    if (!activeSessionId || !upcoming.some((s) => s.id === activeSessionId)) {
      setActiveSessionId(upcoming[0]?.id ?? null);
    }
  }, [upcoming, activeSessionId]);

  const activeSession = useMemo(
    () => upcoming.find((s) => s.id === activeSessionId),
    [upcoming, activeSessionId],
  );

  // Auto-select first history session
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);

  useEffect(() => {
    if (history.length === 0) {
      setActiveHistoryId(null);
      return;
    }
    if (!activeHistoryId || !history.some((s) => s.id === activeHistoryId)) {
      setActiveHistoryId(history[0]?.id ?? null);
    }
  }, [history, activeHistoryId]);

  const activeHistorySession = useMemo(
    () => history.find((s) => s.id === activeHistoryId),
    [history, activeHistoryId],
  );

  // -- CRUD handlers --------------------------------------------------------

  const handleCreate = useCallback(() => {
    setEditingForm(EMPTY_FORM);
    setEditingId(null);
    setModalMode('create');
    setModalOpen(true);
  }, []);

  const handleEdit = useCallback((session: SessionData) => {
    setEditingForm({
      title: session.title,
      date: session.date.slice(0, 10),
    });
    setEditingId(session.id);
    setModalMode('edit');
    setModalOpen(true);
  }, []);

  const handleDelete = useCallback((session: SessionData) => {
    if (!window.confirm(`Delete session "${session.title}"? This cannot be undone.`)) return;
    setSessions((prev) => prev.filter((s) => s.id !== session.id));
  }, []);

  const handleSave = useCallback(
    (data: SessionFormData) => {
      const dateBase = data.date.slice(0, 10);
      const fullDate = `${dateBase}T19:00:00Z`;
      const isUpcoming = new Date(fullDate).getTime() > Date.now();

      if (modalMode === 'create') {
        const newId = `sess-${Date.now()}`;
        setSessions((prev) => {
          const maxNum = prev.reduce((max, s) => Math.max(max, s.number), 0);
          return [
            ...prev,
            {
              id: newId,
              number: maxNum + 1,
              title: data.title,
              date: fullDate,
              recap: '',
              prepNotes: '',
              isUpcoming,
              feedback: { stars: 0, wishes: 0 },
              prepChecklist: [],
              blocks: [{ id: genBlockId(), type: 'text', content: '' }],
            },
          ];
        });
        // Navigate to the new session
        setActiveTab(isUpcoming ? 'upcoming' : 'history');
        if (isUpcoming) {
          setActiveSessionId(newId);
        } else {
          setActiveHistoryId(newId);
        }
      } else if (editingId) {
        setSessions((prev) =>
          prev.map((s) =>
            s.id === editingId
              ? { ...s, title: data.title, date: fullDate, isUpcoming }
              : s,
          ),
        );
      }
      setModalOpen(false);
    },
    [modalMode, editingId],
  );

  // -- Block updates --------------------------------------------------------

  const handleUpdateBlocks = useCallback((sessionId: string, blocks: SessionBlock[]) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, blocks } : s)),
    );
  }, []);

  // -- Render ---------------------------------------------------------------

  return (
    <div className={styles.sessionsWorkspace}>
      <div className={styles.sessionsToolbar}>
        <div className={styles.sessionsTabBar}>
          <button
            type="button"
            className={`${styles.sessionsTab} ${activeTab === 'upcoming' ? styles.sessionsTabActive : ''}`}
            onClick={() => setActiveTab('upcoming')}
          >
            Upcoming
            {upcoming.length > 0 && (
              <span className={styles.sessionsTabCount}>{upcoming.length}</span>
            )}
          </button>
          <button
            type="button"
            className={`${styles.sessionsTab} ${activeTab === 'history' ? styles.sessionsTabActive : ''}`}
            onClick={() => setActiveTab('history')}
          >
            History
            {history.length > 0 && (
              <span className={styles.sessionsTabCount}>{history.length}</span>
            )}
          </button>
        </div>
        <Button variant="ghost" size="sm" onClick={handleCreate}>
          <Icon icon={Plus} size={16} />
          New Session
        </Button>
      </div>

      {activeTab === 'upcoming' ? (
        upcoming.length === 0 ? (
          <div className={styles.sessionsEmpty}>
            <Icon icon={CalendarClock} size={24} color="muted" />
            <Text variant="body" color="secondary">No upcoming sessions scheduled.</Text>
          </div>
        ) : (
          <div className={styles.sessionsUpcoming}>
            {upcoming.length > 1 && (
              <div className={styles.sessionsPickerStrip}>
                {upcoming.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className={`${styles.sessionsPickerItem} ${s.id === activeSessionId ? styles.sessionsPickerItemActive : ''}`}
                    onClick={() => setActiveSessionId(s.id)}
                  >
                    <span className={styles.sessionsPickerNumber}>{s.number}</span>
                    <span className={styles.sessionsPickerTitle}>{s.title}</span>
                  </button>
                ))}
              </div>
            )}
            {activeSession && (
              <UpcomingSection
                key={activeSession.id}
                session={activeSession}
                index={0}
                reducedMotion={reducedMotion}
                onEdit={() => handleEdit(activeSession)}
                onDelete={() => handleDelete(activeSession)}
                onUpdateBlocks={(blocks) => handleUpdateBlocks(activeSession.id, blocks)}
                isSlashOwner={activeSlashEditorId === activeSession.id}
                onSlashOpen={() => setActiveSlashEditorId(activeSession.id)}
                onSlashClose={() => setActiveSlashEditorId((prev) => prev === activeSession.id ? null : prev)}
              />
            )}
          </div>
        )
      ) : history.length === 0 ? (
        <div className={styles.sessionsEmpty}>
          <Icon icon={CalendarClock} size={24} color="muted" />
          <Text variant="body" color="secondary">No past sessions yet.</Text>
        </div>
      ) : (
        <div className={styles.sessionsUpcoming}>
          {history.length > 1 && (
            <div className={styles.sessionsPickerStrip}>
              {history.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={`${styles.sessionsPickerItem} ${s.id === activeHistoryId ? styles.sessionsPickerItemActive : ''}`}
                  onClick={() => setActiveHistoryId(s.id)}
                >
                  <span className={styles.sessionsPickerNumber}>{s.number}</span>
                  <span className={styles.sessionsPickerTitle}>{s.title}</span>
                </button>
              ))}
            </div>
          )}
          {activeHistorySession && (
            <HistorySection
              key={activeHistorySession.id}
              session={activeHistorySession}
              reducedMotion={reducedMotion}
              onEdit={() => handleEdit(activeHistorySession)}
              onDelete={() => handleDelete(activeHistorySession)}
              onUpdateBlocks={(blocks) => handleUpdateBlocks(activeHistorySession.id, blocks)}
              isSlashOwner={activeSlashEditorId === activeHistorySession.id}
              onSlashOpen={() => setActiveSlashEditorId(activeHistorySession.id)}
              onSlashClose={() => setActiveSlashEditorId((prev) => prev === activeHistorySession.id ? null : prev)}
            />
          )}
        </div>
      )}

      <SessionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        initial={editingForm}
        mode={modalMode}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Session Modal (Create / Edit) — simplified: title + date only
// ---------------------------------------------------------------------------

function SessionModal({
  open,
  onClose,
  onSave,
  initial,
  mode,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: SessionFormData) => void;
  initial: SessionFormData;
  mode: 'create' | 'edit';
}) {
  const [form, setForm] = useState<SessionFormData>(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof SessionFormData, string>>>({});

  useEffect(() => {
    if (open) {
      setForm(initial);
      setErrors({});
    }
  }, [open, initial]);

  const update = (field: keyof SessionFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSave = () => {
    const newErrors: Partial<Record<keyof SessionFormData, string>> = {};
    if (!form.title.trim()) newErrors.title = 'Title is required';
    if (!form.date.trim()) newErrors.date = 'Date is required';
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    onSave({
      title: form.title.trim(),
      date: form.date.trim(),
    });
  };

  return (
    <Modal open={open} onClose={onClose} maxWidth={480} aria-label={mode === 'create' ? 'Create session' : 'Edit session'}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
        <Text variant="title">{mode === 'create' ? 'New Session' : 'Edit Session'}</Text>

        <FormField label="Title" required error={errors.title}>
          {(id) => (
            <input
              id={id}
              type="text"
              className={styles.createInput}
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
              placeholder="Session title..."
              autoFocus
            />
          )}
        </FormField>

        <FormField label="Date" required error={errors.date}>
          {(id) => (
            <input
              id={id}
              type="date"
              className={styles.createInput}
              value={form.date}
              onChange={(e) => update('date', e.target.value)}
            />
          )}
        </FormField>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSave}>
            {mode === 'create' ? 'Create Session' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Block Editor
// ---------------------------------------------------------------------------

function BlockEditor({
  blocks,
  onUpdateBlocks,
  isSlashOwner,
  onSlashOpen,
  onSlashClose,
}: {
  blocks: SessionBlock[];
  onUpdateBlocks: (blocks: SessionBlock[]) => void;
  isSlashOwner: boolean;
  onSlashOpen: () => void;
  onSlashClose: () => void;
}) {
  const [slashMenuIndex, setSlashMenuIndex] = useState<number | null>(null);
  const [slashFilter, setSlashFilter] = useState('');
  const [slashHighlight, setSlashHighlight] = useState(0);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [slashAbove, setSlashAbove] = useState(false);
  const pendingFocusRef = useRef<{ blockId: string; cursorPos?: number } | null>(null);
  const blockRefsMap = useRef<Map<string, HTMLTextAreaElement>>(new Map());
  const slashAnchorRef = useRef<HTMLDivElement | null>(null);

  // Close our slash menu if another editor claimed ownership
  useEffect(() => {
    if (!isSlashOwner && slashMenuIndex !== null) {
      setSlashMenuIndex(null);
      setSlashFilter('');
      setSlashHighlight(0);
    }
  }, [isSlashOwner, slashMenuIndex]);

  // Focus newly created blocks after render
  useEffect(() => {
    if (!pendingFocusRef.current) return;
    const { blockId, cursorPos } = pendingFocusRef.current;
    pendingFocusRef.current = null;
    const el = blockRefsMap.current.get(blockId);
    if (el) {
      el.focus();
      if (cursorPos !== undefined) {
        el.selectionStart = cursorPos;
        el.selectionEnd = cursorPos;
      }
    }
  });

  // Measure available space for slash menu positioning
  useEffect(() => {
    if (slashMenuIndex === null || !slashAnchorRef.current) return;
    const rect = slashAnchorRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    setSlashAbove(spaceBelow < 220);
  }, [slashMenuIndex]);

  const filteredSlash = SLASH_ITEMS.filter((item) =>
    slashFilter ? item.label.toLowerCase().includes(slashFilter.toLowerCase()) : true,
  );

  const resizeTextarea = (el: HTMLTextAreaElement) => {
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  };

  const setBlockRef = (blockId: string) => (el: HTMLTextAreaElement | null) => {
    if (el) {
      blockRefsMap.current.set(blockId, el);
      resizeTextarea(el);
    } else {
      blockRefsMap.current.delete(blockId);
    }
  };

  const commitSlash = (blockIndex: number, slashItem: (typeof SLASH_ITEMS)[number]) => {
    const current = blocks[blockIndex];
    if (!current) return;
    const updated = [...blocks];
    updated[blockIndex] = {
      ...current,
      type: slashItem.type,
      content: '',
      checked: slashItem.type === 'checklist' ? false : undefined,
    };
    onUpdateBlocks(updated);
    setSlashMenuIndex(null);
    setSlashFilter('');
    setSlashHighlight(0);
    onSlashClose();
    if (slashItem.type !== 'divider') {
      pendingFocusRef.current = { blockId: current.id };
    }
  };

  const handleBlockChange = (index: number, value: string) => {
    const block = blocks[index];
    if (!block) return;

    // Detect slash trigger: content becomes "/" from empty
    if (value === '/' && block.content === '') {
      setSlashMenuIndex(index);
      setSlashFilter('');
      setSlashHighlight(0);
      onSlashOpen();
      return;
    }

    // Update slash filter if menu is open
    if (slashMenuIndex === index && value.startsWith('/')) {
      setSlashFilter(value.slice(1));
      setSlashHighlight(0);
      return;
    }

    // Close slash menu if we're editing away from it
    if (slashMenuIndex === index) {
      setSlashMenuIndex(null);
      setSlashFilter('');
      onSlashClose();
    }

    const updated = [...blocks];
    updated[index] = { ...block, content: value };
    onUpdateBlocks(updated);
  };

  const handleBlockKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>, index: number) => {
    const block = blocks[index];
    if (!block) return;
    const el = e.currentTarget;

    // Slash menu navigation
    if (slashMenuIndex === index) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSlashHighlight((p) => Math.min(p + 1, filteredSlash.length - 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSlashHighlight((p) => Math.max(p - 1, 0));
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        const highlighted = filteredSlash[slashHighlight];
        if (highlighted) commitSlash(index, highlighted);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        const updated = [...blocks];
        updated[index] = { ...block, content: '' };
        onUpdateBlocks(updated);
        setSlashMenuIndex(null);
        setSlashFilter('');
        onSlashClose();
        return;
      }
    }

    // Enter: split or create new block
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();

      // Empty checklist Enter → convert to plain text (end the list)
      if (block.type === 'checklist' && block.content === '') {
        const updated = [...blocks];
        updated[index] = { ...block, type: 'text', checked: undefined };
        onUpdateBlocks(updated);
        pendingFocusRef.current = { blockId: block.id };
        return;
      }

      const cursorPos = el.selectionStart;
      const before = block.content.slice(0, cursorPos);
      const after = block.content.slice(cursorPos);
      const newId = genBlockId();
      const updated = [...blocks];

      updated[index] = { ...block, content: before };
      const newBlock: SessionBlock = {
        id: newId,
        type: block.type === 'checklist' ? 'checklist' : 'text',
        content: after,
        checked: block.type === 'checklist' ? false : undefined,
      };
      updated.splice(index + 1, 0, newBlock);
      onUpdateBlocks(updated);
      pendingFocusRef.current = { blockId: newId, cursorPos: 0 };
      return;
    }

    // Backspace at position 0
    if (e.key === 'Backspace' && el.selectionStart === 0 && el.selectionEnd === 0) {
      e.preventDefault();

      // Convert non-text block to text first
      if (block.type !== 'text' && block.type !== 'divider') {
        const updated = [...blocks];
        updated[index] = { ...block, type: 'text', checked: undefined };
        onUpdateBlocks(updated);
        pendingFocusRef.current = { blockId: block.id, cursorPos: 0 };
        return;
      }

      // Merge with previous block (if exists and is text/heading/checklist)
      if (index > 0) {
        const prevB = blocks[index - 1];
        if (!prevB) return;
        if (prevB.type === 'divider') {
          const updated = blocks.filter((_, i) => i !== index - 1);
          onUpdateBlocks(updated);
          pendingFocusRef.current = { blockId: block.id, cursorPos: 0 };
          return;
        }
        const mergePos = prevB.content.length;
        const updated = [...blocks];
        updated[index - 1] = { ...prevB, content: prevB.content + block.content };
        updated.splice(index, 1);
        onUpdateBlocks(updated);
        pendingFocusRef.current = { blockId: prevB.id, cursorPos: mergePos };
      }
      return;
    }

    // Arrow up at position 0 → focus previous
    if (e.key === 'ArrowUp' && el.selectionStart === 0 && index > 0) {
      e.preventDefault();
      const prevB = blocks[index - 1];
      if (prevB && prevB.type !== 'divider') {
        pendingFocusRef.current = { blockId: prevB.id, cursorPos: prevB.content.length };
        onUpdateBlocks([...blocks]);
      }
      return;
    }

    // Arrow down at end → focus next
    if (e.key === 'ArrowDown' && el.selectionStart === block.content.length && index < blocks.length - 1) {
      e.preventDefault();
      const nextB = blocks[index + 1];
      if (nextB && nextB.type !== 'divider') {
        pendingFocusRef.current = { blockId: nextB.id, cursorPos: 0 };
        onUpdateBlocks([...blocks]);
      }
      return;
    }
  };

  const handleCheckToggle = (index: number) => {
    const block = blocks[index];
    if (!block) return;
    const updated = [...blocks];
    updated[index] = { ...block, checked: !block.checked };
    onUpdateBlocks(updated);
  };

  const handleDividerClick = (index: number) => {
    // Insert a new text block after the divider
    const newId = genBlockId();
    const updated = [...blocks];
    updated.splice(index + 1, 0, { id: newId, type: 'text', content: '' });
    onUpdateBlocks(updated);
    pendingFocusRef.current = { blockId: newId, cursorPos: 0 };
  };

  const handleAddBlock = () => {
    const newId = genBlockId();
    onUpdateBlocks([...blocks, { id: newId, type: 'text', content: '' }]);
    pendingFocusRef.current = { blockId: newId, cursorPos: 0 };
  };

  const handleFocus = (index: number) => setFocusedIndex(index);
  const handleBlur = () => setFocusedIndex(null);

  return (
    <div className={styles.sessionsBlockEditor}>
      {blocks.map((block, i) => {
        const isFocused = focusedIndex === i;
        const showHint = block.type === 'text' && block.content === '' && !isFocused;

        return (
          <div
            key={block.id}
            className={`${styles.sessionsBlock} ${isFocused ? styles.sessionsBlockFocused : ''}`}
            ref={slashMenuIndex === i ? slashAnchorRef : undefined}
          >
            {block.type === 'divider' ? (
              <button
                type="button"
                className={styles.sessionsBlockDividerBtn}
                onClick={() => handleDividerClick(i)}
                aria-label="Insert block after divider"
              >
                <div className={styles.sessionsBlockDividerLine} />
              </button>
            ) : block.type === 'checklist' ? (
              <div className={styles.sessionsBlockRow}>
                <input
                  type="checkbox"
                  className={styles.sessionsBlockCheckbox}
                  checked={block.checked ?? false}
                  onChange={() => handleCheckToggle(i)}
                  aria-label={`Toggle: ${block.content}`}
                />
                <textarea
                  ref={setBlockRef(block.id)}
                  className={`${styles.sessionsBlockChecklistInput} ${block.checked ? styles.sessionsBlockChecked : ''}`}
                  value={block.content}
                  onChange={(e) => {
                    handleBlockChange(i, e.target.value);
                    resizeTextarea(e.currentTarget);
                  }}
                  onKeyDown={(e) => handleBlockKeyDown(e, i)}
                  onFocus={() => handleFocus(i)}
                  onBlur={handleBlur}
                  placeholder="To-do..."
                  rows={1}
                />
              </div>
            ) : (
              <>
                {showHint && (
                  <button
                    type="button"
                    className={styles.sessionsBlockHint}
                    onClick={() => {
                      const el = blockRefsMap.current.get(block.id);
                      el?.focus();
                    }}
                  >
                    <span className={styles.sessionsBlockHintSlash}>/</span>
                    <span className={styles.sessionsBlockHintText}>Type / for blocks</span>
                  </button>
                )}
                <textarea
                  ref={setBlockRef(block.id)}
                  className={
                    block.type === 'heading'
                      ? styles.sessionsBlockHeadingInput
                      : styles.sessionsBlockInput
                  }
                  value={block.content}
                  onChange={(e) => {
                    handleBlockChange(i, e.target.value);
                    resizeTextarea(e.currentTarget);
                  }}
                  onKeyDown={(e) => handleBlockKeyDown(e, i)}
                  onFocus={() => handleFocus(i)}
                  onBlur={handleBlur}
                  placeholder={block.type === 'heading' ? 'Heading...' : ''}
                  rows={1}
                  style={showHint ? { position: 'absolute', opacity: 0, pointerEvents: 'none' } : undefined}
                />
              </>
            )}

            {/* Slash command menu */}
            {slashMenuIndex === i && (
              <div className={`${styles.sessionsSlashMenu} ${slashAbove ? styles.sessionsSlashMenuAbove : ''}`}>
                {filteredSlash.length === 0 ? (
                  <div className={styles.sessionsSlashEmpty}>
                    <Text variant="body-sm" color="tertiary">No matching blocks</Text>
                  </div>
                ) : (
                  filteredSlash.map((item, si) => (
                    <button
                      key={item.type}
                      type="button"
                      className={`${styles.sessionsSlashItem} ${si === slashHighlight ? styles.sessionsSlashItemActive : ''}`}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        commitSlash(i, item);
                      }}
                      onMouseEnter={() => setSlashHighlight(si)}
                    >
                      <span className={styles.sessionsSlashItemIcon}>
                        <Icon icon={item.icon} size={16} color="inherit" />
                      </span>
                      <span className={styles.sessionsSlashItemText}>
                        <span className={styles.sessionsSlashItemLabel}>{item.label}</span>
                        <span className={styles.sessionsSlashItemDesc}>{item.desc}</span>
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        );
      })}

      {!blocks.some((b) => b.type === 'text' && b.content === '') && (
        <button
          type="button"
          className={styles.sessionsAddBlockBtn}
          onClick={handleAddBlock}
          aria-label="Add block"
        >
          <Icon icon={Plus} size={16} color="muted" />
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Upcoming Section (full-page canvas)
// ---------------------------------------------------------------------------

function UpcomingSection({
  session,
  index,
  reducedMotion,
  onEdit,
  onDelete,
  onUpdateBlocks,
  isSlashOwner,
  onSlashOpen,
  onSlashClose,
}: {
  session: SessionData;
  index: number;
  reducedMotion: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onUpdateBlocks: (blocks: SessionBlock[]) => void;
  isSlashOwner: boolean;
  onSlashOpen: () => void;
  onSlashClose: () => void;
}) {
  return (
    <motion.section
      className={styles.sessionsSection}
      initial={reducedMotion ? false : { opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={
        reducedMotion
          ? { duration: 0 }
          : { duration: toSeconds(TIMING.gentle), ease: EASING.memory, delay: index * 0.04 }
      }
    >
      <div className={styles.sessionsSectionHeader}>
        <span className={styles.sessionsNextNumber}>{session.number}</span>
        <div className={styles.sessionsNextInfo}>
          <Text variant="title" weight="semibold" className={styles.sessionsNextTitle}>
            {session.title}
          </Text>
          <span className={styles.sessionsNextDate}>
            {formatSessionDate(session.date)}
          </span>
        </div>
        <div className={styles.sessionsCardActions}>
          <Badge variant="session" size="sm">
            {formatRelativeDate(session.date)}
          </Badge>
          <button
            type="button"
            className={styles.sessionsActionBtn}
            onClick={onEdit}
            aria-label="Edit session"
          >
            <Icon icon={Pencil} size={16} />
          </button>
          <button
            type="button"
            className={`${styles.sessionsActionBtn} ${styles.sessionsActionBtnDanger}`}
            onClick={onDelete}
            aria-label="Delete session"
          >
            <Icon icon={Trash2} size={16} />
          </button>
        </div>
      </div>

      <div className={styles.sessionsSectionCanvas}>
        <BlockEditor
          blocks={session.blocks}
          onUpdateBlocks={onUpdateBlocks}
          isSlashOwner={isSlashOwner}
          onSlashOpen={onSlashOpen}
          onSlashClose={onSlashClose}
        />
      </div>
    </motion.section>
  );
}

// ---------------------------------------------------------------------------
// History Section (full-page view, same canvas treatment as upcoming)
// ---------------------------------------------------------------------------

function HistorySection({
  session,
  reducedMotion,
  onEdit,
  onDelete,
  onUpdateBlocks,
  isSlashOwner,
  onSlashOpen,
  onSlashClose,
}: {
  session: SessionData;
  reducedMotion: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onUpdateBlocks: (blocks: SessionBlock[]) => void;
  isSlashOwner: boolean;
  onSlashOpen: () => void;
  onSlashClose: () => void;
}) {
  return (
    <motion.section
      className={styles.sessionsSection}
      initial={reducedMotion ? false : { opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={
        reducedMotion
          ? { duration: 0 }
          : { duration: toSeconds(TIMING.gentle), ease: EASING.memory }
      }
    >
      <div className={styles.sessionsSectionHeader}>
        <span className={styles.sessionsNextNumber}>{session.number}</span>
        <div className={styles.sessionsNextInfo}>
          <Text variant="title" weight="semibold" className={styles.sessionsNextTitle}>
            {session.title}
          </Text>
          <div className={styles.sessionsHeaderMeta}>
            <span className={styles.sessionsNextDate}>
              {formatSessionDate(session.date)}
            </span>
            {session.feedback.stars > 0 && (
              <span className={styles.sessionsHistoryBadge}>
                <Icon icon={Star} size={16} color="inherit" />
                {session.feedback.stars}
              </span>
            )}
            {session.feedback.wishes > 0 && (
              <span className={styles.sessionsHistoryBadge}>
                <Icon icon={Sparkles} size={16} color="inherit" />
                {session.feedback.wishes}
              </span>
            )}
          </div>
        </div>
        <div className={styles.sessionsCardActions}>
          <button
            type="button"
            className={styles.sessionsActionBtn}
            onClick={onEdit}
            aria-label="Edit session"
          >
            <Icon icon={Pencil} size={16} />
          </button>
          <button
            type="button"
            className={`${styles.sessionsActionBtn} ${styles.sessionsActionBtnDanger}`}
            onClick={onDelete}
            aria-label="Delete session"
          >
            <Icon icon={Trash2} size={16} />
          </button>
        </div>
      </div>

      <div className={styles.sessionsSectionCanvas}>
        {session.recap && (
          <div className={styles.sessionsRecapBlock}>
            <Text variant="caption" color="tertiary" className={styles.sessionsRecapLabel}>
              RECAP
            </Text>
            <Text variant="body-sm" color="secondary">
              {session.recap}
            </Text>
          </div>
        )}

        <BlockEditor
          blocks={session.blocks}
          onUpdateBlocks={onUpdateBlocks}
          isSlashOwner={isSlashOwner}
          onSlashOpen={onSlashOpen}
          onSlashClose={onSlashClose}
        />
      </div>
    </motion.section>
  );
}
