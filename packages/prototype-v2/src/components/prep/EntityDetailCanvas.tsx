import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronLeft,
  Pencil,
  Trash2,
  Link2,
  Tag,
  CalendarClock,
  Info,
  X,
  Plus,
  Type,
  Heading,
  CheckSquare,
  Minus,
  Sparkles,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Text, Icon, Badge, Button } from '@/primitives';
import { useReducedMotion } from '@/hooks';
import { EASING, TIMING, toSeconds } from '@/tokens';
import {
  ENTITY_ICONS,
  type Entity,
  type EntityType,
  type EntityBlock,
  type EntityBlockType,
} from '@/data/mockEntities';
import styles from './prep.module.css';

const ENTITY_TYPE_OPTIONS: Array<{ value: EntityType; label: string }> = [
  { value: 'character', label: 'Character' },
  { value: 'location', label: 'Location' },
  { value: 'faction', label: 'Faction' },
  { value: 'note', label: 'Note' },
];

const TYPE_COLORS: Record<EntityType, string> = {
  character: 'var(--entity-character)',
  location: 'var(--entity-location)',
  faction: 'var(--entity-faction)',
  note: 'var(--entity-note)',
};

type EntityPatch = Partial<Pick<
  Entity,
  'type' | 'name' | 'tags' | 'connections' | 'typeSpecificFields' | 'blocks'
>>;

type EditSection = 'basics' | 'connections' | 'tags' | 'fields' | null;

function parseTags(input: string): string[] {
  const parts = input
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of parts) {
    if (!seen.has(t)) {
      seen.add(t);
      out.push(t);
    }
  }
  return out;
}

type FieldRow = { key: string; value: string };

function recordToRows(record: Record<string, string> | undefined): FieldRow[] {
  if (!record) return [];
  return Object.entries(record).map(([k, v]) => ({ key: k, value: v }));
}

function rowsToRecord(rows: FieldRow[]): Record<string, string> | undefined {
  const out: Record<string, string> = {};
  for (const row of rows) {
    const k = row.key.trim();
    const v = row.value.trim();
    if (!k) continue;
    out[k] = v;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

function formatMeta(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

let blockCounter = 0;
function genBlockId(): string {
  return `eblk-${Date.now()}-${++blockCounter}`;
}

const SLASH_ITEMS: Array<{ type: EntityBlockType; label: string; desc: string; icon: LucideIcon }> = [
  { type: 'text', label: 'Text', desc: 'Plain text block', icon: Type },
  { type: 'heading', label: 'Heading', desc: 'Section heading', icon: Heading },
  { type: 'checklist', label: 'Checklist', desc: 'To-do item', icon: CheckSquare },
  { type: 'divider', label: 'Divider', desc: 'Horizontal rule', icon: Minus },
  { type: 'secret', label: 'Secret', desc: 'GM-only callout', icon: Sparkles },
];

function EntityBlockEditor({
  blocks,
  onUpdateBlocks,
}: {
  blocks: EntityBlock[];
  onUpdateBlocks: (blocks: EntityBlock[]) => void;
}) {
  const reducedMotion = useReducedMotion();
  const sig = blocks.map((b) => b.id).join('|');
  const prevSigRef = useRef(sig);
  const [layoutArmed, setLayoutArmed] = useState(false);
  const layoutTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (sig === prevSigRef.current) return;
    prevSigRef.current = sig;

    setLayoutArmed(true);
    if (layoutTimerRef.current) window.clearTimeout(layoutTimerRef.current);
    layoutTimerRef.current = window.setTimeout(() => setLayoutArmed(false), TIMING.fast);
    return () => {
      if (layoutTimerRef.current) window.clearTimeout(layoutTimerRef.current);
    };
  }, [sig]);

  const [slashMenuIndex, setSlashMenuIndex] = useState<number | null>(null);
  const [slashFilter, setSlashFilter] = useState('');
  const [slashHighlight, setSlashHighlight] = useState(0);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [slashAbove, setSlashAbove] = useState(false);
  const pendingFocusRef = useRef<{ blockId: string; cursorPos?: number } | null>(null);
  const blockRefsMap = useRef<Map<string, HTMLTextAreaElement>>(new Map());
  const slashAnchorRef = useRef<HTMLDivElement | null>(null);

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

  const filteredSlash = useMemo(() => {
    const q = slashFilter.trim().toLowerCase();
    if (!q) return SLASH_ITEMS;
    return SLASH_ITEMS.filter((item) =>
      item.label.toLowerCase().includes(q) || item.desc.toLowerCase().includes(q)
    );
  }, [slashFilter]);

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
        e.stopPropagation();
        const updated = [...blocks];
        updated[index] = { ...block, content: '' };
        onUpdateBlocks(updated);
        setSlashMenuIndex(null);
        setSlashFilter('');
        return;
      }
    }

    // Enter: split or create new block
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();

      // Empty checklist Enter -> convert to plain text (end the list)
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
      const newBlock: EntityBlock = {
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

      // Merge with previous block
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

    // Arrow up at position 0 -> focus previous
    if (e.key === 'ArrowUp' && el.selectionStart === 0 && index > 0) {
      e.preventDefault();
      const prevB = blocks[index - 1];
      if (prevB && prevB.type !== 'divider') {
        pendingFocusRef.current = { blockId: prevB.id, cursorPos: prevB.content.length };
        onUpdateBlocks([...blocks]);
      }
      return;
    }

    // Arrow down at end -> focus next
    if (e.key === 'ArrowDown' && el.selectionStart === block.content.length && index < blocks.length - 1) {
      e.preventDefault();
      const nextB = blocks[index + 1];
      if (nextB && nextB.type !== 'divider') {
        pendingFocusRef.current = { blockId: nextB.id, cursorPos: 0 };
        onUpdateBlocks([...blocks]);
      }
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
    <div
      className={styles.sessionsBlockEditor}
      style={{ '--entity-session': 'var(--_entity-color)' } as React.CSSProperties}
    >
      <AnimatePresence initial={false} mode="popLayout">
        {blocks.map((block, i) => {
          const isFocused = focusedIndex === i;
          const showHint = block.type === 'text' && block.content === '' && !isFocused;
          const isSecret = block.type === 'secret';

          return (
            <motion.div
              key={block.id}
              layout={layoutArmed ? 'position' : false}
              initial={reducedMotion ? false : { opacity: 0, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.99 }}
              transition={
                reducedMotion
                  ? { duration: 0 }
                  : {
                      layout: {
                        duration: toSeconds(TIMING.fast),
                        ease: EASING.standard,
                      },
                      opacity: { duration: toSeconds(TIMING.fast), ease: EASING.out },
                      scale: { duration: toSeconds(TIMING.fast), ease: EASING.out },
                    }
              }
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

                {isSecret ? (
                  <div className={styles.entityBlockSecret}>
                    <Text variant="caption" className={styles.entitySecretsLabel}>
                      SECRET (GM-only)
                    </Text>
                    <textarea
                      ref={setBlockRef(block.id)}
                      className={styles.entityBlockSecretInput}
                      value={block.content}
                      onChange={(e) => {
                        handleBlockChange(i, e.target.value);
                        resizeTextarea(e.currentTarget);
                      }}
                      onKeyDown={(e) => handleBlockKeyDown(e, i)}
                      onFocus={() => handleFocus(i)}
                      onBlur={handleBlur}
                      placeholder="Hidden truth, leverage, or omen..."
                      rows={1}
                    />
                  </div>
                ) : (
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
                )}

                {/* Slash command menu */}
                <AnimatePresence initial={false}>
                  {slashMenuIndex === i && (
                    <motion.div
                      key="slash-menu"
                      initial={reducedMotion ? false : { opacity: 0, scale: 0.99 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.99 }}
                      transition={reducedMotion ? { duration: 0 } : { duration: toSeconds(TIMING.fast), ease: EASING.out }}
                      className={`${styles.sessionsSlashMenu} ${slashAbove ? styles.sessionsSlashMenuAbove : ''}`}
                    >
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
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
            </motion.div>
          );
        })}
      </AnimatePresence>

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

export interface EntityDetailCanvasProps {
  entity: Entity;
  allEntities: Entity[];
  onBack: () => void;
  onDelete: () => void;
  onUpdateEntity: (id: string, patch: EntityPatch) => void;
  onOpenEntity?: (id: string) => void;
  backButtonRef?: React.Ref<HTMLButtonElement>;
}

export function EntityDetailCanvas({
  entity,
  allEntities,
  onBack,
  onDelete,
  onUpdateEntity,
  onOpenEntity,
  backButtonRef,
}: EntityDetailCanvasProps) {
  const reducedMotion = useReducedMotion();
  const icon = useMemo(() => ENTITY_ICONS[entity.type], [entity.type]);

  const [editing, setEditing] = useState<EditSection>(null);
  const [draftName, setDraftName] = useState(entity.name);
  const [draftType, setDraftType] = useState<EntityType>(entity.type);
  const [draftTags, setDraftTags] = useState(entity.tags.join(', '));
  const [draftConnections, setDraftConnections] = useState(() => entity.connections.map((c) => ({ ...c })));
  const [connectionToAddId, setConnectionToAddId] = useState<string>('');
  const [fieldRows, setFieldRows] = useState<FieldRow[]>(() => recordToRows(entity.typeSpecificFields));

  useEffect(() => {
    setEditing(null);
    setDraftName(entity.name);
    setDraftType(entity.type);
    setDraftTags(entity.tags.join(', '));
    setDraftConnections(entity.connections.map((c) => ({ ...c })));
    setConnectionToAddId('');
    setFieldRows(recordToRows(entity.typeSpecificFields));

    if (!entity.blocks || entity.blocks.length === 0) {
      onUpdateEntity(entity.id, { blocks: [{ id: genBlockId(), type: 'text', content: '' }] });
    }
  }, [entity.id]);

  const cancelEdit = () => {
    setEditing(null);
    setDraftName(entity.name);
    setDraftType(entity.type);
    setDraftTags(entity.tags.join(', '));
    setDraftConnections(entity.connections.map((c) => ({ ...c })));
    setConnectionToAddId('');
    setFieldRows(recordToRows(entity.typeSpecificFields));
  };

  const handleInlineEscape = (e: React.KeyboardEvent) => {
    if (e.key !== 'Escape') return;
    e.preventDefault();
    e.stopPropagation();
    cancelEdit();
  };

  const connectionCandidates = useMemo(() => {
    const connected = new Set(draftConnections.map((c) => c.id));
    return allEntities
      .filter((e) => e.id !== entity.id && !connected.has(e.id))
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [allEntities, entity.id, draftConnections]);

  const canSaveBasics = draftName.trim().length > 0;

  const isDirtyFor = (section: Exclude<EditSection, null>): boolean => {
    if (section === 'basics') {
      return draftName.trim() !== entity.name || draftType !== entity.type;
    }
    if (section === 'tags') {
      const next = parseTags(draftTags);
      if (next.length !== entity.tags.length) return true;
      for (let i = 0; i < next.length; i++) {
        if (next[i] !== entity.tags[i]) return true;
      }
      return false;
    }
    if (section === 'connections') {
      if (draftConnections.length !== entity.connections.length) return true;
      for (let i = 0; i < draftConnections.length; i++) {
        if (draftConnections[i]?.id !== entity.connections[i]?.id) return true;
      }
      return false;
    }
    if (section === 'fields') {
      const next = rowsToRecord(fieldRows);
      const cur = entity.typeSpecificFields;
      if (!next && !cur) return false;
      if (!next || !cur) return true;
      const nextKeys = Object.keys(next);
      const curKeys = Object.keys(cur);
      if (nextKeys.length !== curKeys.length) return true;
      for (const k of nextKeys) {
        if (cur[k] !== next[k]) return true;
      }
      return false;
    }
    return false;
  };

  const requestEdit = (section: Exclude<EditSection, null>) => {
    if (editing && editing !== section && isDirtyFor(editing)) {
      if (!window.confirm('Discard changes?')) return;
    }
    if (section === 'basics') {
      setDraftName(entity.name);
      setDraftType(entity.type);
    } else if (section === 'tags') {
      setDraftTags(entity.tags.join(', '));
    } else if (section === 'connections') {
      setDraftConnections(entity.connections.map((c) => ({ ...c })));
      setConnectionToAddId('');
    } else if (section === 'fields') {
      setFieldRows(recordToRows(entity.typeSpecificFields));
    }
    setEditing(section);
  };

  const saveEditing = () => {
    if (!editing) return;
    if (editing === 'basics') {
      if (!canSaveBasics) return;
      onUpdateEntity(entity.id, { name: draftName.trim(), type: draftType });
      setEditing(null);
      return;
    }
    if (editing === 'connections') {
      onUpdateEntity(entity.id, { connections: draftConnections.map((c) => ({ ...c })) });
      setEditing(null);
      return;
    }
    if (editing === 'tags') {
      onUpdateEntity(entity.id, { tags: parseTags(draftTags) });
      setEditing(null);
      return;
    }
    if (editing === 'fields') {
      onUpdateEntity(entity.id, { typeSpecificFields: rowsToRecord(fieldRows) });
      setEditing(null);
    }
  };

  const sectionTransition = (idx: number) =>
    reducedMotion
      ? { duration: 0 }
      : { duration: toSeconds(TIMING.gentle), ease: EASING.memory, delay: idx * 0.04 };

  return (
    <div
      className={styles.entityDetailPage}
      role="region"
      aria-label="Entity details"
      style={{ '--_entity-color': TYPE_COLORS[entity.type] } as React.CSSProperties}
    >
      <div className={styles.entityDetailHeader}>
        <button
          ref={backButtonRef}
          type="button"
          className={styles.entityDetailBackBtn}
          onClick={onBack}
          aria-label="Back to entities"
        >
          <Icon icon={ChevronLeft} size={16} color="inherit" />
          <Text variant="body-sm" weight="medium" color="inherit">Back</Text>
        </button>

        <div className={styles.entityDetailTitleRow}>
          <span className={styles.entityDetailIcon} aria-hidden="true">
            <Icon icon={icon} size={20} color="inherit" />
          </span>

          {editing === 'basics' ? (
            <input
              type="text"
              className={styles.entityDetailNameInput}
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              onKeyDown={handleInlineEscape}
              aria-label="Entity name"
              autoFocus
            />
          ) : (
            <Text variant="title" weight="semibold" className={styles.entityDetailTitle}>
              {entity.name}
            </Text>
          )}

          {editing === 'basics' ? (
            <select
              className={styles.filterSelect}
              value={draftType}
              onChange={(e) => setDraftType(e.target.value as EntityType)}
              onKeyDown={handleInlineEscape}
              aria-label="Entity type"
            >
              {ENTITY_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          ) : (
            <Badge variant={entity.type} size="sm">{entity.type}</Badge>
          )}
        </div>

        <motion.div
          className={styles.entityDetailActions}
          layout
          transition={reducedMotion ? { duration: 0 } : { layout: { duration: toSeconds(TIMING.fast), ease: EASING.standard } }}
        >
          <AnimatePresence initial={false} mode="popLayout">
            {editing === 'basics' ? (
              <motion.div
                key="basics-controls"
                layout
                initial={reducedMotion ? false : { opacity: 0, scale: 0.99 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.99 }}
                transition={reducedMotion ? { duration: 0 } : { duration: toSeconds(TIMING.fast), ease: EASING.outQuart }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)' }}
              >
                <Button variant="ghost" size="sm" onClick={cancelEdit}>Cancel</Button>
                <Button variant="primary" size="sm" onClick={saveEditing} disabled={!canSaveBasics}>Save</Button>
              </motion.div>
            ) : (
              <motion.div
                key="basics-edit"
                layout
                initial={reducedMotion ? false : { opacity: 0, scale: 0.99 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.99 }}
                transition={reducedMotion ? { duration: 0 } : { duration: toSeconds(TIMING.fast), ease: EASING.outQuart }}
              >
                <Button variant="ghost" size="sm" onClick={() => requestEdit('basics')}>
                  <Icon icon={Pencil} size={16} color="inherit" />
                  Edit
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
          <motion.div layout>
            <Button variant="ghost" size="sm" iconOnly onClick={onDelete} aria-label="Delete entity">
              <Icon icon={Trash2} size={16} color="inherit" />
            </Button>
          </motion.div>
        </motion.div>
      </div>

      <div className={styles.entityDetailBody}>
        <div className={styles.entityDetailGrid}>
          <div className={styles.entityDetailDossier}>
            <motion.section
              className={styles.entityDetailSection}
              initial={reducedMotion ? false : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={sectionTransition(0)}
            >
              <div className={styles.entityDetailSectionTitle}>
                <Icon icon={Info} size={16} color="muted" />
                <Text variant="body-sm" weight="semibold" color="secondary">Dossier</Text>
              </div>

              <EntityBlockEditor
                blocks={entity.blocks}
                onUpdateBlocks={(next) => onUpdateEntity(entity.id, { blocks: next })}
              />
            </motion.section>
          </div>

          <aside className={styles.entityDetailRail} aria-label="Entity reference">
            <Text
              variant="caption"
              color="tertiary"
              className={styles.entityDetailRailLabel}
              style={{ letterSpacing: '0.08em' }}
            >
              REFERENCE
            </Text>

            {/* Connections */}
            <motion.section
              className={`${styles.entityDetailSection} ${styles.entityDetailRailSection}`}
              initial={reducedMotion ? false : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={sectionTransition(1)}
              onClick={() => (editing === 'connections' ? undefined : requestEdit('connections'))}
            >
              <div className={styles.entityDetailSectionHeader}>
                <div className={styles.entityDetailSectionTitle}>
                  <Icon icon={Link2} size={16} color="muted" />
                  <Text variant="body-sm" weight="semibold" color="secondary">Connections</Text>
                </div>
                <AnimatePresence initial={false} mode="popLayout">
                  {editing === 'connections' && (
                    <motion.div
                      key="connections-controls"
                      className={styles.entityDetailSectionControls}
                      initial={reducedMotion ? false : { opacity: 0, scale: 0.99 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.99 }}
                      transition={reducedMotion ? { duration: 0 } : { duration: toSeconds(TIMING.fast), ease: EASING.outQuart }}
                    >
                      <Button variant="ghost" size="sm" onClick={cancelEdit}>Cancel</Button>
                      <Button variant="primary" size="sm" onClick={saveEditing}>Save</Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className={styles.entityRailSectionBody}>
                <div className={styles.entityPills}>
                  {editing === 'connections' ? (
                    draftConnections.length === 0 ? (
                      <Text variant="body-sm" color="tertiary">No connections yet.</Text>
                    ) : (
                      draftConnections.map((c) => (
                        <span key={c.id} className={styles.entityConnectionChip}>
                          <span className={styles.entityPill} data-entity-type={c.type}>{c.name}</span>
                          <span className={styles.entityConnectionRemoveWrap}>
                            <AnimatePresence initial={false}>
                              <motion.button
                                key="remove"
                                type="button"
                                className={styles.entityConnectionRemove}
                                initial={reducedMotion ? false : { opacity: 0, scale: 0.96 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
                                transition={reducedMotion ? { duration: 0 } : { duration: toSeconds(TIMING.fast), ease: EASING.outQuart }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDraftConnections((prev) => prev.filter((x) => x.id !== c.id));
                                }}
                                aria-label={`Remove ${c.name}`}
                              >
                                <Icon icon={X} size={16} color="inherit" />
                              </motion.button>
                            </AnimatePresence>
                          </span>
                        </span>
                      ))
                    )
                  ) : entity.connections.length === 0 ? (
                    <Text variant="body-sm" color="tertiary">No connections yet.</Text>
                  ) : (
                    entity.connections.map((c) => (
                      <span key={c.id} className={styles.entityConnectionChip}>
                        <button
                          type="button"
                          className={styles.entityPill}
                          data-entity-type={c.type}
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenEntity?.(c.id);
                          }}
                          aria-label={`Open ${c.name}`}
                        >
                          {c.name}
                        </button>
                      </span>
                    ))
                  )}
                </div>

                <AnimatePresence initial={false}>
                  {editing === 'connections' && (
                    <motion.div
                      key="connections-add"
                      initial={reducedMotion ? false : { height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={reducedMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
                      transition={reducedMotion ? { duration: 0 } : { duration: toSeconds(TIMING.fast), ease: EASING.out }}
                      style={{ overflow: 'hidden' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div style={{ paddingTop: 'var(--space-3)' }}>
                        <div className={styles.entityConnectionAddRow}>
                          <select
                            className={styles.filterSelect}
                            value={connectionToAddId}
                            onChange={(e) => setConnectionToAddId(e.target.value)}
                            onKeyDown={handleInlineEscape}
                            aria-label="Add connection"
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                          >
                            <option value="">+ Link entity</option>
                            {connectionCandidates.map((e) => (
                              <option key={e.id} value={e.id}>{e.name}</option>
                            ))}
                          </select>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!connectionToAddId) return;
                              const target = allEntities.find((e) => e.id === connectionToAddId);
                              if (!target) return;
                              setDraftConnections((prev) => {
                                if (prev.some((c) => c.id === target.id)) return prev;
                                return [...prev, { id: target.id, name: target.name, type: target.type }];
                              });
                              setConnectionToAddId('');
                            }}
                            disabled={!connectionToAddId}
                          >
                            <Icon icon={Plus} size={16} color="inherit" />
                            Add
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.section>

            {/* Tags */}
            <motion.section
              className={`${styles.entityDetailSection} ${styles.entityDetailRailSection}`}
              initial={reducedMotion ? false : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={sectionTransition(2)}
              onClick={() => (editing === 'tags' ? undefined : requestEdit('tags'))}
            >
              <div className={styles.entityDetailSectionHeader}>
                <div className={styles.entityDetailSectionTitle}>
                  <Icon icon={Tag} size={16} color="muted" />
                  <Text variant="body-sm" weight="semibold" color="secondary">Tags</Text>
                </div>
                <AnimatePresence initial={false} mode="popLayout">
                  {editing === 'tags' && (
                    <motion.div
                      key="tags-controls"
                      className={styles.entityDetailSectionControls}
                      initial={reducedMotion ? false : { opacity: 0, scale: 0.99 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.99 }}
                      transition={reducedMotion ? { duration: 0 } : { duration: toSeconds(TIMING.fast), ease: EASING.outQuart }}
                    >
                      <Button variant="ghost" size="sm" onClick={cancelEdit}>Cancel</Button>
                      <Button variant="primary" size="sm" onClick={saveEditing}>Save</Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className={styles.entityRailSectionBody}>
                {editing === 'tags' ? (
                  <input
                    type="text"
                    className={styles.createInput}
                    value={draftTags}
                    onChange={(e) => setDraftTags(e.target.value)}
                    onKeyDown={handleInlineEscape}
                    placeholder="npc, brindlemark"
                    aria-label="Tags (comma-separated)"
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <div className={styles.entityTags}>
                    {entity.tags.length === 0 ? (
                      <Text variant="body-sm" color="tertiary">No tags.</Text>
                    ) : (
                      entity.tags.map((t) => (
                        <span key={t} className={styles.entityTag}>{t}</span>
                      ))
                    )}
                  </div>
                )}
              </div>
            </motion.section>

            {/* Type-specific fields */}
            <motion.section
              className={`${styles.entityDetailSection} ${styles.entityDetailRailSection}`}
              initial={reducedMotion ? false : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={sectionTransition(3)}
              onClick={() => (editing === 'fields' ? undefined : requestEdit('fields'))}
            >
              <div className={styles.entityDetailSectionHeader}>
                <div className={styles.entityDetailSectionTitle}>
                  <Icon icon={Info} size={16} color="muted" />
                  <Text variant="body-sm" weight="semibold" color="secondary" className={styles.entityDetailSectionTitleText}>
                    Type-specific fields
                  </Text>
                </div>
                <AnimatePresence initial={false} mode="popLayout">
                  {editing === 'fields' && (
                    <motion.div
                      key="fields-controls"
                      className={styles.entityDetailSectionControls}
                      initial={reducedMotion ? false : { opacity: 0, scale: 0.99 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.99 }}
                      transition={reducedMotion ? { duration: 0 } : { duration: toSeconds(TIMING.fast), ease: EASING.outQuart }}
                    >
                      <Button variant="ghost" size="sm" onClick={cancelEdit}>Cancel</Button>
                      <Button variant="primary" size="sm" onClick={saveEditing}>Save</Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className={styles.entityRailSectionBody}>
                {editing === 'fields' ? (
                  <div className={styles.entityFieldsGrid} onClick={(e) => e.stopPropagation()}>
                    {fieldRows.length === 0 ? (
                      <Text variant="body-sm" color="tertiary">None yet.</Text>
                    ) : (
                      fieldRows.map((row, idx) => (
                        <div key={idx} className={styles.entityFieldRow}>
                          <input
                            type="text"
                            className={styles.createInput}
                            value={row.key}
                            onChange={(e) =>
                              setFieldRows((prev) => prev.map((r, i) => (i === idx ? { ...r, key: e.target.value } : r)))
                            }
                            onKeyDown={handleInlineEscape}
                            placeholder="Key"
                            aria-label="Field key"
                            autoFocus={idx === 0}
                          />
                          <input
                            type="text"
                            className={styles.createInput}
                            value={row.value}
                            onChange={(e) =>
                              setFieldRows((prev) => prev.map((r, i) => (i === idx ? { ...r, value: e.target.value } : r)))
                            }
                            onKeyDown={handleInlineEscape}
                            placeholder="Value"
                            aria-label="Field value"
                          />
                          <button
                            type="button"
                            className={styles.entityFieldRemoveBtn}
                            onClick={() => setFieldRows((prev) => prev.filter((_, i) => i !== idx))}
                            aria-label="Remove field"
                          >
                            <Icon icon={Trash2} size={16} color="inherit" />
                          </button>
                        </div>
                      ))
                    )}
                    <Button variant="ghost" size="sm" onClick={() => setFieldRows((prev) => [...prev, { key: '', value: '' }])}>
                      <Icon icon={Plus} size={16} color="inherit" />
                      Add field
                    </Button>
                  </div>
                ) : entity.typeSpecificFields && Object.keys(entity.typeSpecificFields).length > 0 ? (
                  <div className={styles.entityFieldsTable}>
                    {Object.entries(entity.typeSpecificFields).map(([k, v]) => (
                      <div key={k} className={styles.entityFieldsRow}>
                        <Text variant="mono" className={styles.entityFieldKeyText}>{k}</Text>
                        <Text variant="body-sm" color="secondary" className={styles.entityFieldValueText}>{v}</Text>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Text variant="body-sm" color="tertiary">None yet.</Text>
                )}
              </div>
            </motion.section>

            {/* Meta */}
            <motion.section
              className={`${styles.entityDetailSection} ${styles.entityDetailRailSection}`}
              initial={reducedMotion ? false : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={sectionTransition(4)}
            >
              <div className={styles.entityDetailSectionHeader}>
                <div className={styles.entityDetailSectionTitle}>
                  <Icon icon={CalendarClock} size={16} color="muted" />
                  <Text variant="body-sm" weight="semibold" color="secondary">Meta</Text>
                </div>
              </div>
              <div className={styles.entityMetaFooter}>
                <div className={styles.entityMetaLine}>
                  <Text variant="mono" color="tertiary">created</Text>
                  <Text variant="mono" color="secondary">{formatMeta(entity.createdAt)}</Text>
                </div>
                <div className={styles.entityMetaLine}>
                  <Text variant="mono" color="tertiary">modified</Text>
                  <Text variant="mono" color="secondary">{formatMeta(entity.modifiedAt)}</Text>
                </div>
              </div>
            </motion.section>
          </aside>
        </div>
      </div>
    </div>
  );
}
