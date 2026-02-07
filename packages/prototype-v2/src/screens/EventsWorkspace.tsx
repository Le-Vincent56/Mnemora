import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { CalendarClock, ChevronLeft, ChevronRight, X, Plus, Pencil, Trash2 } from 'lucide-react';
import { Text, Icon, EmptyState, Button } from '@/primitives';
import { SearchInput, Modal, FormField } from '@/components/composed';
import {
  getAllEvents,
  getEventCategories,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  type EventCategory,
  type TimelineEvent,
} from '@/data/mockEvents';
import styles from '@/components/prep/prep.module.css';

// ---------------------------------------------------------------------------
//  Helpers
// ---------------------------------------------------------------------------

function splitWords(text: string): string[] {
  return text.split(/\s+/).filter(Boolean);
}

function parseDateNum(date: string): number {
  const parts = date.split('-');
  const y = parseInt(parts[0] ?? '0', 10);
  const m = parseInt(parts[1] ?? '1', 10);
  const d = parseInt(parts[2] ?? '1', 10);
  return y + (m - 1) / 12 + (d - 1) / 365;
}

function parseYear(date: string): number {
  const y = parseInt(date.split('-')[0] ?? '0', 10);
  return isNaN(y) ? 0 : y;
}

function deriveYearMarkers(events: TimelineEvent[]): number[] {
  const years = new Set<number>();
  for (const evt of events) years.add(parseYear(evt.date));
  return Array.from(years).sort((a, b) => a - b);
}

// --- Layout engine with minimum-gap enforcement ---

const MIN_GAP_PX = 110;
const EDGE_PAD_PX = 60;
const BASE_WIDTH_PX = 800;
const ZOOM_SCALE = 3;

interface TimelineLayout {
  positions: Map<string, number>;
  yearPositions: Map<number, number>;
  widthPx: number;
}

function computeLayout(events: TimelineEvent[], years: number[]): TimelineLayout {
  const emptyYears = new Map<number, number>();
  for (const y of years) emptyYears.set(y, 50);

  if (events.length === 0)
    return { positions: new Map(), yearPositions: emptyYears, widthPx: BASE_WIDTH_PX };

  const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date));

  if (sorted.length === 1) {
    const positions = new Map<string, number>();
    positions.set(sorted[0]!.id, 50);
    return { positions, yearPositions: emptyYears, widthPx: BASE_WIDTH_PX };
  }

  const firstNum = parseDateNum(sorted[0]!.date);
  const lastNum = parseDateNum(sorted[sorted.length - 1]!.date);
  const range = lastNum - firstNum || 1;
  const baseContent = BASE_WIDTH_PX - 2 * EDGE_PAD_PX;

  const idealPx = sorted.map((evt) =>
    EDGE_PAD_PX + ((parseDateNum(evt.date) - firstNum) / range) * baseContent,
  );

  const adjustedPx: number[] = [idealPx[0]!];
  for (let i = 1; i < idealPx.length; i++) {
    adjustedPx.push(Math.max(idealPx[i]!, adjustedPx[i - 1]! + MIN_GAP_PX));
  }

  const widthPx = Math.max(BASE_WIDTH_PX, adjustedPx[adjustedPx.length - 1]! + EDGE_PAD_PX);

  const positions = new Map<string, number>();
  for (let i = 0; i < sorted.length; i++) {
    positions.set(sorted[i]!.id, (adjustedPx[i]! / widthPx) * 100);
  }

  const yearPositions = new Map<number, number>();
  for (const y of years) {
    const yPx = EDGE_PAD_PX + ((y - firstNum) / range) * baseContent;
    yearPositions.set(y, (yPx / widthPx) * 100);
  }

  return { positions, yearPositions, widthPx };
}

// ---------------------------------------------------------------------------
//  Category option config (reused in modal)
// ---------------------------------------------------------------------------

const ALL_CATEGORIES: EventCategory[] = ['battle', 'political', 'discovery', 'social', 'travel', 'magical'];

interface EventFormData {
  title: string;
  date: string;
  era: string;
  category: EventCategory;
  description: string;
}

const EMPTY_FORM: EventFormData = {
  title: '',
  date: '',
  era: '',
  category: 'social',
  description: '',
};

// ---------------------------------------------------------------------------
//  Event Modal (Create / Edit)
// ---------------------------------------------------------------------------

function EventModal({
  open,
  onClose,
  onSave,
  initial,
  mode,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: EventFormData) => void;
  initial: EventFormData;
  mode: 'create' | 'edit';
}) {
  const [form, setForm] = useState<EventFormData>(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof EventFormData, string>>>({});

  // Reset form when modal opens with new initial data
  useEffect(() => {
    if (open) {
      setForm(initial);
      setErrors({});
    }
  }, [open, initial]);

  const update = (field: keyof EventFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSave = () => {
    const newErrors: Partial<Record<keyof EventFormData, string>> = {};
    if (!form.title.trim()) newErrors.title = 'Title is required';
    if (!form.date.trim()) newErrors.date = 'Date is required';
    else if (!/^\d{4}-\d{2}-\d{2}$/.test(form.date.trim())) newErrors.date = 'Use YYYY-MM-DD format';
    if (!form.era.trim()) newErrors.era = 'Era is required';
    if (!form.description.trim()) newErrors.description = 'Description is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave({
      title: form.title.trim(),
      date: form.date.trim(),
      era: form.era.trim(),
      category: form.category,
      description: form.description.trim(),
    });
  };

  return (
    <Modal open={open} onClose={onClose} maxWidth={480} aria-label={mode === 'create' ? 'Create event' : 'Edit event'}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
        <Text variant="title">{mode === 'create' ? 'New Event' : 'Edit Event'}</Text>

        {/* Category selection */}
        <div>
          <Text variant="body-sm" weight="medium" color="secondary" style={{ marginBottom: 'var(--space-2)' }}>
            Category
          </Text>
          <div className={styles.createTypeGrid}>
            {ALL_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                className={styles.createTypeOption}
                data-selected={form.category === cat || undefined}
                style={{ '--_type-color': CATEGORY_COLORS[cat] } as React.CSSProperties}
                onClick={() => update('category', cat)}
                aria-pressed={form.category === cat}
              >
                <Text variant="body-sm" color="inherit">{CATEGORY_LABELS[cat]}</Text>
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <FormField label="Title" required error={errors.title}>
          {(id) => (
            <input
              id={id}
              type="text"
              className={styles.createInput}
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
              placeholder="Event title..."
              autoFocus
            />
          )}
        </FormField>

        {/* Date + Era row */}
        <div className={styles.eventFormRow}>
          <FormField label="Date" required error={errors.date}>
            {(id) => (
              <input
                id={id}
                type="text"
                className={styles.createInput}
                value={form.date}
                onChange={(e) => update('date', e.target.value)}
                placeholder="YYYY-MM-DD"
              />
            )}
          </FormField>
          <FormField label="Era" required error={errors.era}>
            {(id) => (
              <input
                id={id}
                type="text"
                className={styles.createInput}
                value={form.era}
                onChange={(e) => update('era', e.target.value)}
                placeholder="e.g. Third Age"
              />
            )}
          </FormField>
        </div>

        {/* Description */}
        <FormField label="Description" required error={errors.description}>
          {(id) => (
            <textarea
              id={id}
              className={styles.createTextarea}
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              placeholder="What happened..."
              rows={3}
            />
          )}
        </FormField>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSave}>
            {mode === 'create' ? 'Create Event' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
//  Component
// ---------------------------------------------------------------------------

export function EventsWorkspace() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<EventCategory | 'all'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [zoomTransform, setZoomTransform] = useState('');
  const [overflowLocked, setOverflowLocked] = useState(false);

  // --- Mutable event state (seeded from mock data) ---
  const [events, setEvents] = useState<TimelineEvent[]>(
    () => getAllEvents().sort((a, b) => a.date.localeCompare(b.date)),
  );

  // --- Modal state ---
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingEvent, setEditingEvent] = useState<EventFormData>(EMPTY_FORM);

  const categories = useMemo(() => getEventCategories(), []);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  // --- Derived layout (recomputes when events change) ---
  const allEvents = useMemo(
    () => [...events].sort((a, b) => a.date.localeCompare(b.date)),
    [events],
  );
  const yearMarkers = useMemo(() => deriveYearMarkers(allEvents), [allEvents]);
  const layout = useMemo(() => computeLayout(allEvents, yearMarkers), [allEvents, yearMarkers]);

  // --- Filter-in-place: matching event IDs ---
  const matchIds = useMemo(() => {
    let filtered = allEvents;
    if (activeCategory !== 'all') filtered = filtered.filter((e) => e.category === activeCategory);
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          e.linkedEntities.some((le) => le.name.toLowerCase().includes(q)),
      );
    }
    return new Set(filtered.map((e) => e.id));
  }, [allEvents, search, activeCategory]);

  const matchList = useMemo(
    () => allEvents.filter((e) => matchIds.has(e.id)),
    [allEvents, matchIds],
  );

  const selectedMatchIndex = useMemo(
    () => (selectedId ? matchList.findIndex((e) => e.id === selectedId) : -1),
    [selectedId, matchList],
  );

  const isZoomed = selectedId !== null;
  const hasFilter = search !== '' || activeCategory !== 'all';
  const noMatches = hasFilter && matchIds.size === 0;
  const selectedEvent = useMemo(
    () => (selectedId ? allEvents.find((e) => e.id === selectedId) : undefined),
    [selectedId, allEvents],
  );

  // --- Deselect if selected event becomes non-matching ---
  useEffect(() => {
    if (selectedId && !matchIds.has(selectedId)) setSelectedId(null);
  }, [selectedId, matchIds]);

  // --- Overflow lock: hidden during zoom, delayed restore on zoom-out ---
  useEffect(() => {
    if (isZoomed) {
      setOverflowLocked(true);
    } else {
      const t = setTimeout(() => setOverflowLocked(false), 500);
      return () => clearTimeout(t);
    }
  }, [isZoomed]);

  // --- Compute zoom transform ---
  useEffect(() => {
    if (!selectedId) {
      setZoomTransform('');
      return;
    }

    const wrapper = scrollRef.current;
    const timeline = timelineRef.current;
    if (!wrapper || !timeline) return;

    const ww = wrapper.clientWidth;
    const wh = wrapper.clientHeight;
    const th = timeline.offsetHeight;
    const sl = wrapper.scrollLeft;

    const pct = layout.positions.get(selectedId) ?? 50;
    const dotX = (pct / 100) * layout.widthPx;
    const spineY = th / 2;

    // Offset camera toward the node content (above nodes extend upward, below downward)
    const idx = allEvents.findIndex((e) => e.id === selectedId);
    const isAbove = idx >= 0 && idx % 2 === 0;
    const nodeOffset = isAbove ? -55 : 55;
    // Shift dot to opposite side of detail text (above→detail right, dot left; below→detail left, dot right)
    const screenHOffset = isAbove ? -130 : 130;

    const S = ZOOM_SCALE;
    const tx = (ww / 2 + screenHOffset + sl) / S - dotX;
    const ty = wh / (2 * S) - (spineY + nodeOffset);

    setZoomTransform(`scale(${S}) translate(${tx}px, ${ty}px)`);
  }, [selectedId, layout, allEvents]);

  // --- Selection handlers ---
  const handleSelect = useCallback((id: string, button?: HTMLButtonElement | null) => {
    if (button) triggerRef.current = button;
    setSelectedId((prev) => (prev === id ? null : id));
  }, []);

  const handleClose = useCallback(() => {
    setSelectedId(null);
    requestAnimationFrame(() => triggerRef.current?.focus());
  }, []);

  const handlePrev = useCallback(() => {
    if (selectedMatchIndex > 0) {
      const prev = matchList[selectedMatchIndex - 1];
      if (prev) setSelectedId(prev.id);
    }
  }, [selectedMatchIndex, matchList]);

  const handleNext = useCallback(() => {
    if (selectedMatchIndex < matchList.length - 1) {
      const next = matchList[selectedMatchIndex + 1];
      if (next) setSelectedId(next.id);
    }
  }, [selectedMatchIndex, matchList]);

  // --- CRUD handlers ---
  const handleCreate = useCallback(() => {
    setEditingEvent(EMPTY_FORM);
    setModalMode('create');
    setModalOpen(true);
  }, []);

  const handleEdit = useCallback(() => {
    if (!selectedEvent) return;
    setEditingEvent({
      title: selectedEvent.title,
      date: selectedEvent.date,
      era: selectedEvent.era,
      category: selectedEvent.category,
      description: selectedEvent.description,
    });
    setModalMode('edit');
    setModalOpen(true);
  }, [selectedEvent]);

  const handleDelete = useCallback(() => {
    if (!selectedId || !selectedEvent) return;
    if (!window.confirm(`Delete "${selectedEvent.title}"? This cannot be undone.`)) return;
    setEvents((prev) => prev.filter((e) => e.id !== selectedId));
    setSelectedId(null);
  }, [selectedId, selectedEvent]);

  const handleSave = useCallback(
    (data: EventFormData) => {
      if (modalMode === 'create') {
        const newEvent: TimelineEvent = {
          id: `evt-${Date.now()}`,
          ...data,
          linkedEntities: [],
        };
        setEvents((prev) => [...prev, newEvent]);
      } else if (selectedId) {
        setEvents((prev) =>
          prev.map((e) => (e.id === selectedId ? { ...e, ...data } : e)),
        );
      }
      setModalOpen(false);
    },
    [modalMode, selectedId],
  );

  // Keyboard nav
  useEffect(() => {
    if (!selectedId) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
      if (e.key === 'ArrowLeft') { e.preventDefault(); handlePrev(); }
      if (e.key === 'ArrowRight') { e.preventDefault(); handleNext(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedId, handleClose, handlePrev, handleNext]);

  return (
    <div className={styles.eventsWorkspace}>
      {/* Toolbar */}
      <div className={styles.eventsToolbar}>
        <div className={styles.searchTypePills}>
          <button
            type="button"
            className={`${styles.searchTypePill} ${activeCategory === 'all' ? styles.searchTypePillActive : ''}`}
            onClick={() => setActiveCategory('all')}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`${styles.searchTypePill} ${activeCategory === cat ? styles.searchTypePillActive : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>

        <div className={styles.eventsToolbarRight}>
          {isZoomed && (
            <div className={styles.eventsNavBar}>
              <button
                type="button"
                className={styles.branchDetailArrow}
                onClick={handleEdit}
                aria-label="Edit event"
              >
                <Icon icon={Pencil} size={16} color="inherit" />
              </button>
              <button
                type="button"
                className={styles.branchDetailArrow}
                onClick={handleDelete}
                aria-label="Delete event"
              >
                <Icon icon={Trash2} size={16} color="inherit" />
              </button>
              <span style={{ width: 1, height: 16, background: 'var(--border-default)', flexShrink: 0 }} />
              <button
                type="button"
                className={styles.branchDetailArrow}
                onClick={handlePrev}
                disabled={selectedMatchIndex <= 0}
                aria-label="Previous event"
              >
                <Icon icon={ChevronLeft} size={16} color="inherit" />
              </button>
              <Text variant="caption" color="tertiary">
                {selectedMatchIndex + 1}/{matchList.length}
              </Text>
              <button
                type="button"
                className={styles.branchDetailArrow}
                onClick={handleNext}
                disabled={selectedMatchIndex >= matchList.length - 1}
                aria-label="Next event"
              >
                <Icon icon={ChevronRight} size={16} color="inherit" />
              </button>
              <button
                type="button"
                className={styles.branchDetailArrow}
                onClick={handleClose}
                aria-label="Close detail"
              >
                <Icon icon={X} size={16} color="inherit" />
              </button>
            </div>
          )}
          <Button variant="ghost" size="sm" onClick={handleCreate}>
            <Icon icon={Plus} size={16} color="inherit" />
            New Event
          </Button>
          <SearchInput
            size="sm"
            placeholder="Search events..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Filter-no-match hint */}
      {noMatches && (
        <Text variant="caption" color="tertiary" style={{ textAlign: 'center' }}>
          No events match the current filter
        </Text>
      )}

      {allEvents.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title="No events yet"
          description="Create your first timeline event to get started."
          action={
            <Button variant="primary" size="sm" onClick={handleCreate}>
              <Icon icon={Plus} size={16} color="inherit" />
              New Event
            </Button>
          }
        />
      ) : (
        <div
          ref={scrollRef}
          className={styles.branchTimelineScroll}
          data-zoomed={overflowLocked ? '' : undefined}
        >
          <div
            ref={timelineRef}
            className={styles.branchTimeline}
            style={{
              width: `${layout.widthPx}px`,
              transform: zoomTransform || undefined,
              transformOrigin: '0 0',
            }}
            role="region"
            aria-label="Event timeline"
            data-has-selection={isZoomed ? '' : undefined}
          >
            <div className={styles.branchSpine} />

            {yearMarkers.map((year) => (
              <span
                key={year}
                className={styles.branchYearMarker}
                style={{ '--_year-pct': `${layout.yearPositions.get(year) ?? 50}%` } as React.CSSProperties}
                aria-hidden="true"
              >
                {year}
              </span>
            ))}

            {allEvents.map((event, i) => {
              const pct = layout.positions.get(event.id) ?? 50;
              const branch = i % 2 === 0 ? 'above' : 'below';
              const isSelected = event.id === selectedId;
              const isMatch = matchIds.has(event.id);
              const isFiltered = !isMatch && !isZoomed;
              const isDimmed = isZoomed && !isSelected;

              // Word-level reveal: split meta & description into individual spans
              const metaText = `${event.era} · ${CATEGORY_LABELS[event.category]}`;
              const metaWords = splitWords(metaText);
              const descWords = splitWords(event.description);
              const wordsBeforePills = metaWords.length + descWords.length;

              return (
                <div
                  key={event.id}
                  className={styles.branchNode}
                  data-branch={branch}
                  data-filtered={isFiltered ? '' : undefined}
                  data-dimmed={isDimmed ? '' : undefined}
                  data-selected={isSelected ? '' : undefined}
                  style={{
                    '--_event-color': CATEGORY_COLORS[event.category],
                    '--_node-pct': `${pct}%`,
                  } as React.CSSProperties}
                >
                  <span className={styles.branchConnector} aria-hidden="true" />
                  <button
                    type="button"
                    className={styles.branchDot}
                    data-event-id={event.id}
                    aria-pressed={isSelected}
                    aria-label={`${event.title} — ${event.date}`}
                    onClick={(e) => handleSelect(event.id, e.currentTarget)}
                  >
                    <span className={styles.branchDotInner} />
                  </button>
                  <span className={styles.branchLabel}>
                    <span className={styles.branchLabelTitle}>{event.title}</span>
                    <span className={styles.branchLabelDate}>{event.date}</span>
                  </span>

                  {/* Inline detail — word-by-word magical reveal at 3x zoom */}
                  <div
                    className={styles.branchDetailInline}
                    data-visible={isSelected ? '' : undefined}
                    aria-hidden={!isSelected}
                  >
                    <span className={styles.branchDetailMeta}>
                      {metaWords.map((w, wi) => (
                        <span
                          key={wi}
                          className={styles.revealWord}
                          style={{ '--_word-idx': wi } as React.CSSProperties}
                        >
                          {w}{wi < metaWords.length - 1 ? ' ' : ''}
                        </span>
                      ))}
                    </span>
                    <p className={styles.branchDetailDesc}>
                      {descWords.map((w, wi) => (
                        <span
                          key={wi}
                          className={styles.revealWord}
                          style={{ '--_word-idx': metaWords.length + wi } as React.CSSProperties}
                        >
                          {w}{wi < descWords.length - 1 ? ' ' : ''}
                        </span>
                      ))}
                    </p>
                    {event.linkedEntities.length > 0 && (
                      <div className={styles.branchDetailPills}>
                        {event.linkedEntities.map((le, pi) => (
                          <span
                            key={le.id}
                            className={`${styles.branchDetailPill} ${styles.revealWord}`}
                            style={{ '--_word-idx': wordsBeforePills + pi } as React.CSSProperties}
                          >
                            {le.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      <EventModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        initial={editingEvent}
        mode={modalMode}
      />
    </div>
  );
}
