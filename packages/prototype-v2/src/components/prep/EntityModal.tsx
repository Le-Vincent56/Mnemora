import { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Text, Button, Icon } from '@/primitives';
import { Modal, FormField } from '@/components/composed';
import { ENTITY_ICONS, type Entity, type EntityType } from '@/data/mockEntities';
import styles from './prep.module.css';

type Mode = 'create' | 'edit';

export type EntityModalValue = Pick<
  Entity,
  'type' | 'name' | 'description' | 'tags' | 'secrets' | 'typeSpecificFields'
>;

const ENTITY_TYPE_OPTIONS: Array<{ value: EntityType; label: string; color: string }> = [
  { value: 'character', label: 'Character', color: 'var(--entity-character)' },
  { value: 'location', label: 'Location', color: 'var(--entity-location)' },
  { value: 'faction', label: 'Faction', color: 'var(--entity-faction)' },
  { value: 'note', label: 'Note', color: 'var(--entity-note)' },
];

function parseTags(input: string): string[] {
  const parts = input
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
  // Preserve order but avoid duplicates
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

export interface EntityModalProps {
  open: boolean;
  mode: Mode;
  initial: EntityModalValue;
  onClose: () => void;
  onSave: (value: EntityModalValue) => void;
  onDelete?: () => void;
}

export function EntityModal({ open, mode, initial, onClose, onSave, onDelete }: EntityModalProps) {
  const [selectedType, setSelectedType] = useState<EntityType>(initial.type);
  const [name, setName] = useState(initial.name);
  const [description, setDescription] = useState(initial.description);
  const [tagInput, setTagInput] = useState(initial.tags.join(', '));
  const [secrets, setSecrets] = useState(initial.secrets ?? '');
  const [fieldRows, setFieldRows] = useState<FieldRow[]>(() => recordToRows(initial.typeSpecificFields));
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!open) return;
    setSelectedType(initial.type);
    setName(initial.name);
    setDescription(initial.description);
    setTagInput(initial.tags.join(', '));
    setSecrets(initial.secrets ?? '');
    setFieldRows(recordToRows(initial.typeSpecificFields));
    setError('');
  }, [open, initial]);

  const title = mode === 'create' ? 'Create Entity' : 'Edit Entity';

  const typeLabel = useMemo(
    () => ENTITY_TYPE_OPTIONS.find((o) => o.value === selectedType)?.label ?? 'Entity',
    [selectedType],
  );

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Name is required');
      return;
    }
    onSave({
      type: selectedType,
      name: trimmed,
      description: description.trim(),
      tags: parseTags(tagInput),
      secrets: secrets.trim() ? secrets.trim() : undefined,
      typeSpecificFields: rowsToRecord(fieldRows),
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-label={title}
      maxWidth={560}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
        <Text variant="title">{title}</Text>

        {/* Entity type selection */}
        <div>
          <Text
            variant="body-sm"
            weight="medium"
            color="secondary"
            style={{ marginBottom: 'var(--space-2)' }}
          >
            Type
          </Text>
          <div className={styles.createTypeGrid}>
            {ENTITY_TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={styles.createTypeOption}
                data-selected={selectedType === opt.value || undefined}
                style={{ '--_type-color': opt.color } as React.CSSProperties}
                onClick={() => setSelectedType(opt.value)}
                aria-pressed={selectedType === opt.value}
              >
                <Icon icon={ENTITY_ICONS[opt.value]} size={20} color="inherit" />
                <Text variant="body-sm" color="inherit">
                  {opt.label}
                </Text>
              </button>
            ))}
          </div>
        </div>

        {/* Name */}
        <FormField label="Name" required error={error}>
          {(id) => (
            <input
              id={id}
              type="text"
              className={styles.createInput}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              placeholder={`Enter ${typeLabel.toLowerCase()} name...`}
              autoFocus
            />
          )}
        </FormField>

        {/* Description */}
        <FormField label="Description">
          {(id) => (
            <textarea
              id={id}
              className={styles.createTextarea}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What should you remember..."
              rows={3}
            />
          )}
        </FormField>

        {/* Tags */}
        <FormField label="Tags" helper="Comma-separated (e.g. npc, brindlemark, ally)">
          {(id) => (
            <input
              id={id}
              type="text"
              className={styles.createInput}
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="npc, brindlemark"
            />
          )}
        </FormField>

        {/* Secrets (GM-only) */}
        <div className={styles.entitySecretsBlock}>
          <Text variant="caption" className={styles.entitySecretsLabel}>
            SECRET (GM-only)
          </Text>
          <FormField label="Secrets" helper="Visible to the GM only.">
            {(id) => (
              <textarea
                id={id}
                className={styles.createTextarea}
                value={secrets}
                onChange={(e) => setSecrets(e.target.value)}
                placeholder="Hidden truth, leverage, or omen..."
                rows={3}
              />
            )}
          </FormField>
        </div>

        {/* Type-specific fields */}
        <div>
          <Text
            variant="body-sm"
            weight="medium"
            color="secondary"
            style={{ marginBottom: 'var(--space-2)' }}
          >
            Type-specific fields
          </Text>
          <div className={styles.entityFieldsGrid}>
            {fieldRows.length === 0 ? (
              <Text variant="body-sm" color="tertiary">
                None yet.
              </Text>
            ) : (
              fieldRows.map((row, idx) => (
                <div key={idx} className={styles.entityFieldRow}>
                  <input
                    type="text"
                    className={styles.createInput}
                    value={row.key}
                    onChange={(e) =>
                      setFieldRows((prev) =>
                        prev.map((r, i) => (i === idx ? { ...r, key: e.target.value } : r)),
                      )
                    }
                    placeholder="Key"
                    aria-label="Field key"
                  />
                  <input
                    type="text"
                    className={styles.createInput}
                    value={row.value}
                    onChange={(e) =>
                      setFieldRows((prev) =>
                        prev.map((r, i) => (i === idx ? { ...r, value: e.target.value } : r)),
                      )
                    }
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
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFieldRows((prev) => [...prev, { key: '', value: '' }])}
            >
              <Icon icon={Plus} size={16} color="inherit" />
              Add field
            </Button>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-2)' }}>
          {mode === 'edit' && onDelete ? (
            <Button variant="ghost" size="sm" onClick={onDelete}>
              <Icon icon={Trash2} size={16} color="inherit" />
              Delete
            </Button>
          ) : (
            <span />
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
            <Button variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSave}>
              {mode === 'create' ? 'Create' : 'Save changes'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
