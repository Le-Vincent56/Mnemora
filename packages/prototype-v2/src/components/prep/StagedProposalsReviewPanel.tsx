import { useEffect, useMemo, useState } from 'react';
import { Check, Clock, GitMerge, Pencil, Tag, Trash2 } from 'lucide-react';
import { Badge, Button, Icon, Stack, Surface, Text } from '@/primitives';
import { useSessionMode } from '@/adapters/session-mode';
import type {
    StagedProposalAuditEventDTO,
    StagedProposalDTO,
    ReviewStagedProposalRequest,
} from '@mnemora/core/src/application/dtos/StagedProposalsDTOs';

const KIND_OPTIONS = [
    { value: 'other', label: 'Other' },
    { value: 'npc', label: 'NPC' },
    { value: 'location', label: 'Location' },
    { value: 'clue', label: 'Clue' },
    { value: 'item', label: 'Item' },
    { value: 'secret', label: 'Secret' },
    { value: 'ruling', label: 'Ruling' },
    { value: 'task', label: 'Task' },
] as const;

function formatWhen(iso: string): string {
    const d = new Date(iso);

    // Exit case - the number is NaN
    if (Number.isNaN(d.getTime())) return iso;
    
    return d.toLocaleString();
}

function compactTitle(p: StagedProposalDTO): string {
    const base = (p.title ?? '').trim();
    
    // Exit case - the base trimmed fine
    if (base) return base;

    const c = p.content.trim();
    return c.length > 60 ? `${c.slice(0, 60)}...` : c;
}

export function StagedProposalsReviewPanel({
    sessionID: sessionID,
    sessionName,
}: {
    sessionID: string;
    sessionName?: string;
}) {
    const sessionMode = useSessionMode();
    const [includeResolved, setIncludeResolved] = useState(false);
    const [proposals, setProposals] = useState<StagedProposalDTO[]>([]);
    const [selectedID, setSelectedID] = useState<string | null>(null);
    const [events, setEvents] = useState<StagedProposalAuditEventDTO[]>([]);
    const [loading, setLoading] = useState(false);
    const [eventsLoading, setEventsLoading] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [editTitle, setEditTitle] = useState('');
    const [editContent, setEditContent] = useState('');
    const [mergeTargetType, setMergeTargetType] = useState<'proposal' | 'canon'>('proposal');
    const [mergeTargetId, setMergeTargetId] = useState('');
    const [reclassifyKind, setReclassifyKind] = useState<string>('other');
    const selected = useMemo(
        () => proposals.find((p) => p.id === selectedID) ?? null,
        [proposals, selectedID],
    );

    const loadProposals = async () => {
        setLoading(true);
        const r = await sessionMode.listStagedProposals(sessionID, includeResolved);
        if (r.isSuccess) {
            setProposals([...r.value]);
        }
        setLoading(false);
    };

    const loadEvents = async (proposalId: string) => {
        setEventsLoading(true);
        const r = await sessionMode.listStagedProposalAuditEvents(proposalId);
        if (r.isSuccess) {
            setEvents([...r.value]);
        }
        setEventsLoading(false);
    };

    useEffect(() => {
        setSelectedID(null);
        setEvents([]);
        setEditMode(false);
        setMergeTargetType('proposal');
        setMergeTargetId('');
        setReclassifyKind('other');
        void loadProposals();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sessionID, includeResolved]);
    
    useEffect(() => {
        // Exit case - no selected ID
        if (!selectedID) return;

        void loadEvents(selectedID);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedID]);
    
    const applyReview = async (request: ReviewStagedProposalRequest) => {
        const r = await sessionMode.reviewStagedProposal(request);

        // Exit case - failed to review the proposal
        if (r.isFailure) return;

        await loadProposals();
        if (selectedID) await loadEvents(selectedID);
    };

    const header = sessionName ? `Review Queue — ${sessionName}` : 'Review Queue';
    return (
        <Surface elevation="flat" radius="lg" padding="md" bordered>
            <Stack gap={3}>
                <Stack direction="horizontal" justify="between" align="center" wrap>
                    <Stack gap={1}>
                        <Text variant="heading">{header}</Text>
                        <Text variant="body-sm" color="tertiary">
                            {loading ? 'Loading...' : `${proposals.length} item(s)`}
                        </Text>
                    </Stack>
                    <Stack direction="horizontal" gap={2} wrap>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIncludeResolved((p) => !p)}
                            disabled={loading}
                        >
                            {includeResolved ? 'Show Queue Only' : 'Show All'}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => void loadProposals()} disabled={loading}>
                            Refresh
                        </Button>
                    </Stack>
                </Stack>
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'minmax(220px, 0.9fr) minmax(320px, 1.1fr)',
                        gap: 'var(--space-3)',
                        alignItems: 'start',
                    }}
                >
                    <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
                        {proposals.length === 0 ? (
                            <div style={{ padding: 'var(--space-3)' }}>
                                <Text variant="body-sm" color="tertiary">
                                    No staged proposals for this session.
                                </Text>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                {proposals.map((p) => {
                                    const active = p.id === selectedID;
                                    return (
                                        <button
                                            key={p.id}
                                            type="button"
                                            onClick={() => {
                                                setSelectedID(p.id);
                                                setEditMode(false);
                                                setEditTitle(p.title ?? '');
                                                setEditContent(p.content);
                                                setReclassifyKind(p.kind);
                                            }}
                                            style={{
                                                textAlign: 'left',
                                                padding: 'var(--space-3)',
                                                border: 'none',
                                                borderBottom: '1px solid var(--border-subtle)',
                                                background: active ? 'var(--surface-hover)' : 'transparent',
                                                cursor: 'pointer',
                                            }}
                                        >
                                            <Stack gap={2}>
                                                <Text variant="body" weight="medium">{compactTitle(p)}</Text>
                                                <Stack direction="horizontal" gap={2} wrap>
                                                    <Badge variant="session" size="sm">{p.kind}</Badge>
                                                    <Badge variant="default" size="sm">{p.status}</Badge>
                                                </Stack>
                                            </Stack>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                    <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
                        {!selected ? (
                            <div style={{ padding: 'var(--space-3)' }}>
                                <Text variant="body-sm" color="tertiary">
                                    Select an item to review.
                                </Text>
                            </div>
                        ) : (
                            <div style={{ padding: 'var(--space-3)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                                <Stack gap={1}>
                                    <Text variant="heading">{selected.title ?? 'Untitled'}</Text>
                                    <Text variant="caption" color="tertiary">
                                        Kind: {selected.kind} • Status: {selected.status} • Created: {formatWhen(selected.createdAt)}
                                    </Text>
                                </Stack>
                                {!editMode ? (
                                    <Surface elevation="flat" radius="md" padding="md" bordered>
                                        <Text variant="body">{selected.content}</Text>
                                    </Surface>
                                ) : (
                                    <Stack gap={2}>
                                        <input
                                            value={editTitle}
                                            onChange={(e) => setEditTitle(e.target.value)}
                                            placeholder="Title (optional)"
                                            style={{
                                                width: '100%',
                                                height: 36,
                                                padding: '0 var(--space-3)',
                                                borderRadius: 'var(--radius-md)',
                                                border: '1px solid var(--border-default)',
                                                background: 'var(--canvas)',
                                                color: 'var(--ink-primary)',
                                                fontFamily: 'var(--font-body)',
                                                fontSize: 'var(--text-sm)',
                                            }}
                                        />
                                        <textarea
                                            value={editContent}
                                            onChange={(e) => setEditContent(e.target.value)}
                                            rows={4}
                                            style={{
                                                width: '100%',
                                                padding: 'var(--space-3)',
                                                borderRadius: 'var(--radius-md)',
                                                border: '1px solid var(--border-default)',
                                                background: 'var(--canvas)',
                                                color: 'var(--ink-primary)',
                                                fontFamily: 'var(--font-body)',
                                                fontSize: 'var(--text-sm)',
                                                resize: 'vertical',
                                            }}
                                        />
                                        <Stack direction="horizontal" gap={2} justify="end" wrap>
                                            <Button variant="ghost" size="sm" onClick={() => setEditMode(false)}>
                                                Cancel
                                            </Button>
                                            <Button
                                                variant="primary"
                                                size="sm"
                                                onClick={() => void applyReview({
                                                    proposalID: selected.id,
                                                    action: 'edit_then_accept',
                                                    edits: {
                                                        title: editTitle.trim().length === 0 ? null : editTitle.trim(),
                                                        content: editContent,
                                                    },
                                                })}
                                            >
                                                <Icon icon={Check} size={16} color="inherit" />
                                                Edit + Accept
                                            </Button>
                                        </Stack>
                                    </Stack>
                                )}
                                <Stack direction="horizontal" gap={2} wrap>
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        disabled={sessionMode.status.proposalsSaving}
                                        onClick={() => void applyReview({ proposalID: selected.id, action: 'accept' })}
                                    >
                                        <Icon icon={Check} size={16} color="inherit" />
                                        Accept
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        disabled={sessionMode.status.proposalsSaving}
                                        onClick={() => setEditMode(true)}
                                    >
                                        <Icon icon={Pencil} size={16} />
                                        Edit Then Accept
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        disabled={sessionMode.status.proposalsSaving}
                                        onClick={() => void applyReview({ proposalID: selected.id, action: 'defer' })}
                                    >
                                        <Icon icon={Clock} size={16} />
                                        Defer
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        disabled={sessionMode.status.proposalsSaving}
                                        onClick={() => void applyReview({ proposalID: selected.id, action: 'discard' })}
                                    >
                                        <Icon icon={Trash2} size={16} />
                                        Discard
                                    </Button>
                                </Stack>
                                <Surface elevation="flat" radius="md" padding="md" bordered>
                                    <Stack gap={2}>
                                        <Text variant="caption" color="tertiary">MERGE</Text>
                                        <Stack direction="horizontal" gap={2} wrap>
                                            <select
                                                value={mergeTargetType}
                                                onChange={(e) => setMergeTargetType(e.target.value === 'canon' ? 'canon' : 'proposal')}
                                                style={{
                                                    height: 36,
                                                    padding: '0 var(--space-3)',
                                                    borderRadius: 'var(--radius-md)',
                                                    border: '1px solid var(--border-default)',
                                                    background: 'var(--canvas)',
                                                    color: 'var(--ink-primary)',
                                                }}
                                            >
                                                <option value="proposal">Into proposal</option>
                                                <option value="canon">Into canon</option>
                                            </select>
                                            <input
                                                value={mergeTargetId}
                                                onChange={(e) => setMergeTargetId(e.target.value)}
                                                placeholder="Target ID"
                                                style={{
                                                    flex: 1,
                                                    minWidth: 160,
                                                    height: 36,
                                                    padding: '0 var(--space-3)',
                                                    borderRadius: 'var(--radius-md)',
                                                    border: '1px solid var(--border-default)',
                                                    background: 'var(--canvas)',
                                                    color: 'var(--ink-primary)',
                                                }}
                                            />
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                disabled={sessionMode.status.proposalsSaving || mergeTargetId.trim().length === 0}
                                                onClick={() => void applyReview({
                                                    proposalID: selected.id,
                                                    action: 'merge',
                                                    mergeTarget: { type: mergeTargetType, targetID: mergeTargetId.trim() },
                                                })}
                                            >
                                                <Icon icon={GitMerge} size={16} />
                                                Merge
                                            </Button>
                                        </Stack>
                                    </Stack>
                                </Surface>
                                <Surface elevation="flat" radius="md" padding="md" bordered>
                                    <Stack gap={2}>
                                        <Text variant="caption" color="tertiary">RECLASSIFY</Text>
                                        <Stack direction="horizontal" gap={2} wrap>
                                            <select
                                                value={reclassifyKind}
                                                onChange={(e) => setReclassifyKind(e.target.value)}
                                                style={{
                                                    height: 36,
                                                    padding: '0 var(--space-3)',
                                                    borderRadius: 'var(--radius-md)',
                                                    border: '1px solid var(--border-default)',
                                                    background: 'var(--canvas)',
                                                    color: 'var(--ink-primary)',
                                                }}
                                            >
                                                {KIND_OPTIONS.map((k) => (
                                                    <option key={k.value} value={k.value}>{k.label}</option>
                                                ))}
                                            </select>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                disabled={sessionMode.status.proposalsSaving || reclassifyKind === selected.kind}
                                                onClick={() => void applyReview({
                                                    proposalID: selected.id,
                                                    action: 'reclassify',
                                                    reclassifyToKind: reclassifyKind as any,
                                                })}
                                            >
                                                <Icon icon={Tag} size={16} />
                                                Apply
                                            </Button>
                                        </Stack>
                                    </Stack>
                                </Surface>
                                <Surface elevation="flat" radius="md" padding="md" bordered>
                                    <Stack gap={2}>
                                        <Stack direction="horizontal" justify="between" align="center" wrap>
                                            <Text variant="caption" color="tertiary">AUDIT TRAIL</Text>
                                            <Text variant="caption" color="tertiary">
                                                {eventsLoading ? 'Loading...' : `${events.length} event(s)`}
                                            </Text>
                                        </Stack>
                                        {events.length === 0 ? (
                                            <Text variant="body-sm" color="tertiary">
                                                No audit events yet.
                                            </Text>
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                                                {events.map((e) => (
                                                    <div key={e.id} style={{ padding: 'var(--space-2)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
                                                        <Text variant="body-sm" weight="medium">{e.action}</Text>
                                                        <Text variant="caption" color="tertiary">{formatWhen(e.occurredAt)}</Text>
                                                        {Object.keys(e.metadata ?? {}).length > 0 && (
                                                            <Text variant="caption" color="tertiary">
                                                                {JSON.stringify(e.metadata)}
                                                            </Text>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </Stack>
                                </Surface>
                            </div>
                        )}
                    </div>
                </div>
                
                {sessionMode.error && (
                    <Text variant="body-sm" color="secondary">
                        {sessionMode.error.message}
                    </Text>
                )}
            </Stack>
        </Surface>
    );
}