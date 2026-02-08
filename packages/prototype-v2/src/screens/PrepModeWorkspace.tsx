import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Plus, LayoutGrid, List } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button, Icon } from '@/primitives';
import { SearchInput, ViewToggle } from '@/components/composed';
import type { ViewToggleOption } from '@/components/composed';
import { EntityBrowser } from '@/components/prep/EntityBrowser';
import { TypeSidebar } from '@/components/prep/TypeSidebar';
import type { BrowserView } from '@/components/prep/EntityBrowser';
import { EntityModal } from '@/components/prep/EntityModal';
import { EntityDetailCanvas } from '@/components/prep/EntityDetailCanvas';
import { useReducedMotion } from '@/hooks';
import { EASING, TIMING, toSeconds } from '@/tokens';
import { getAllEntities, type Entity, type EntityType } from '@/data/mockEntities';
import styles from '@/components/prep/prep.module.css';

type EntityPatch = Partial<Pick<
  Entity,
  'type' | 'name' | 'description' | 'secrets' | 'tags' | 'connections' | 'typeSpecificFields' | 'blocks'
>>;

function deriveDescriptionFromBlocks(blocks: Entity['blocks']): string {
  const parts: string[] = [];
  for (const b of blocks) {
    if (b.type === 'secret' || b.type === 'divider') continue;
    const c = b.content.trim();
    if (c) parts.push(c);
  }
  return parts.join('\n').trim();
}

function deriveSecretsFromBlocks(blocks: Entity['blocks']): string | undefined {
  const parts: string[] = [];
  for (const b of blocks) {
    if (b.type !== 'secret') continue;
    const c = b.content.trim();
    if (c) parts.push(c);
  }
  const merged = parts.join('\n').trim();
  return merged ? merged : undefined;
}

const VIEW_OPTIONS: ViewToggleOption[] = [
  { value: 'grid', icon: LayoutGrid, label: 'Card view' },
  { value: 'list', icon: List, label: 'List view' },
];

export function PrepModeWorkspace() {
  const [entities, setEntities] = useState<Entity[]>(() => getAllEntities());
  const [view, setView] = useState<BrowserView>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeType, setActiveType] = useState<EntityType | 'all'>('all');

  const [activeEntityId, setActiveEntityId] = useState<string | null>(null);
  const [lastBrowseEntityId, setLastBrowseEntityId] = useState<string | null>(null);
  const backBtnRef = useRef<HTMLButtonElement | null>(null);
  const createBtnRef = useRef<HTMLButtonElement | null>(null);
  const reducedMotion = useReducedMotion();

  const [modalOpen, setModalOpen] = useState(false);

  const typeCounts = useMemo(() => {
    const counts: Record<EntityType | 'all', number> = {
      all: entities.length,
      character: 0,
      location: 0,
      faction: 0,
      note: 0,
    };
    for (const e of entities) {
      counts[e.type]++;
    }
    return counts;
  }, [entities]);

  const handleOpenCreate = useCallback(() => {
    setModalOpen(true);
  }, []);

  const handleOpenDetail = useCallback((id: string) => {
    setLastBrowseEntityId(id);
    setActiveEntityId(id);
  }, []);

  const handleBackToBrowse = useCallback(() => {
    setActiveEntityId(null);
    requestAnimationFrame(() => {
      if (!lastBrowseEntityId) {
        createBtnRef.current?.focus();
        return;
      }
      const el = document.querySelector<HTMLElement>(`[data-entity-id="${lastBrowseEntityId}"]`);
      el?.focus();
      if (!el) createBtnRef.current?.focus();
    });
  }, [lastBrowseEntityId]);

  const deleteEntity = useCallback((id: string) => {
    setEntities((prev) => {
      const next = prev
        .filter((e) => e.id !== id)
        .map((e) => ({
          ...e,
          connections: e.connections.filter((c) => c.id !== id),
        }));
      return next;
    });
  }, []);

  const updateEntity = useCallback((id: string, patch: EntityPatch) => {
    const now = new Date().toISOString();
    setEntities((prev) => {
      const current = prev.find((e) => e.id === id);
      if (!current) return prev;

      const nextPatch: EntityPatch = { ...patch };
      if (patch.blocks) {
        nextPatch.description = deriveDescriptionFromBlocks(patch.blocks);
        nextPatch.secrets = deriveSecretsFromBlocks(patch.blocks);
      }
      const nextEntity: Entity = {
        ...current,
        ...nextPatch,
        modifiedAt: now,
      };
      const next = prev.map((e) => (e.id === id ? nextEntity : e));

      const nameChanged = nextPatch.name !== undefined && nextPatch.name !== current.name;
      const typeChanged = nextPatch.type !== undefined && nextPatch.type !== current.type;
      if (!nameChanged && !typeChanged) return next;

      return next.map((e) =>
        e.id === id
          ? e
          : {
              ...e,
              connections: e.connections.map((c) =>
                c.id === id ? { ...c, name: nextEntity.name, type: nextEntity.type } : c
              ),
            }
      );
    });
  }, []);

  const activeEntity = useMemo(
    () => (activeEntityId ? entities.find((e) => e.id === activeEntityId) : undefined),
    [activeEntityId, entities],
  );

  useEffect(() => {
    if (!activeEntityId) return;
    if (!activeEntity) setActiveEntityId(null);
  }, [activeEntityId, activeEntity]);

  useEffect(() => {
    if (!activeEntityId) return;
    requestAnimationFrame(() => backBtnRef.current?.focus());
  }, [activeEntityId]);

  useEffect(() => {
    if (!activeEntityId) return;
    if (modalOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      handleBackToBrowse();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [activeEntityId, modalOpen, handleBackToBrowse]);

  const modalInitial = useMemo(
    () => ({
      type: 'character' as EntityType,
      name: '',
      description: '',
      tags: [],
      secrets: undefined,
      typeSpecificFields: undefined,
    }),
    [],
  );

  const handleSaveEntity = useCallback(
    (value: {
      type: EntityType;
      name: string;
      description: string;
      tags: string[];
      secrets?: string;
      typeSpecificFields?: Record<string, string>;
    }) => {
      const now = new Date().toISOString();
      const ts = Date.now();
      const newId = `ent-${ts}`;
      const blocks: Entity['blocks'] = [
        { id: `blk-${ts}-1`, type: 'text', content: value.description },
      ];
      if (value.secrets?.trim()) {
        blocks.push({ id: `blk-${ts}-2`, type: 'secret', content: value.secrets });
      }
      const newEntity: Entity = {
        id: newId,
        type: value.type,
        name: value.name,
        description: value.description,
        tags: value.tags,
        secrets: value.secrets,
        connections: [],
        blocks,
        createdAt: now,
        modifiedAt: now,
        typeSpecificFields: value.typeSpecificFields,
      };
      setEntities((prev) => [...prev, newEntity]);
      setLastBrowseEntityId(newId);
      setActiveEntityId(newId);
      setModalOpen(false);
    },
    [],
  );

  const handleDeleteFromDetail = useCallback(() => {
    if (!activeEntity) return;
    if (!window.confirm(`Delete "${activeEntity.name}"?`)) return;
    deleteEntity(activeEntity.id);
    setActiveEntityId(null);
  }, [activeEntity, deleteEntity]);

  const handleDeleteFromBrowse = useCallback((id: string) => {
    const e = entities.find((x) => x.id === id);
    if (!e) return;
    if (!window.confirm(`Delete "${e.name}"?`)) return;
    deleteEntity(id);
  }, [entities, deleteEntity]);

  return (
    <div className={styles.workspace}>
      <div className={styles.cabinetLayout}>
        <TypeSidebar
          activeType={activeType}
          onTypeChange={setActiveType}
          typeCounts={typeCounts}
        />
        <div className={styles.workspaceScroll}>
          <AnimatePresence mode="wait" initial={false}>
            {activeEntity ? (
              <motion.div
                key="entity-detail"
                className={styles.browserContent}
                initial={reducedMotion ? false : { opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -12 }}
                transition={reducedMotion ? { duration: 0 } : { duration: toSeconds(TIMING.gentle), ease: EASING.memory }}
              >
                <EntityDetailCanvas
                  entity={activeEntity}
                  allEntities={entities}
                  onBack={handleBackToBrowse}
                  onDelete={handleDeleteFromDetail}
                  onUpdateEntity={updateEntity}
                  onOpenEntity={(id) => {
                    setLastBrowseEntityId(id);
                    setActiveEntityId(id);
                  }}
                  backButtonRef={backBtnRef}
                />
              </motion.div>
            ) : (
              <motion.div
                key="entity-browse"
                className={styles.browserContent}
                initial={reducedMotion ? false : { opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -12 }}
                transition={reducedMotion ? { duration: 0 } : { duration: toSeconds(TIMING.gentle), ease: EASING.memory }}
              >
                {/* Integrated toolbar */}
                <div className={styles.toolbar}>
                  <SearchInput
                    size="sm"
                    placeholder="Summon..."
                    shortcut="/"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <ViewToggle
                    options={VIEW_OPTIONS}
                    value={view}
                    onChange={(v) => setView(v as BrowserView)}
                  />
                  <Button ref={createBtnRef} variant="primary" size="sm" onClick={handleOpenCreate}>
                    <Icon icon={Plus} size={16} color="inherit" />
                    Create
                  </Button>
                </div>
                <EntityBrowser
                  entities={entities}
                  view={view}
                  searchQuery={searchQuery}
                  activeType={activeType}
                  onSelectEntity={handleOpenDetail}
                  onEditEntity={handleOpenDetail}
                  onDeleteEntity={handleDeleteFromBrowse}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <EntityModal
        open={modalOpen}
        mode="create"
        initial={modalInitial}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveEntity}
      />
    </div>
  );
}
