import {
  LayoutDashboard,
  CalendarClock,
  Clapperboard,
  Search,
  FolderOpen,
  Eye,
  CheckCircle2,
  AlertCircle,
  CircleDashed,
} from 'lucide-react';
import { Stack, Text, Surface, Icon } from '@/primitives';

interface PageStubProps {
  title: string;
  description: string;
  icon: typeof LayoutDashboard;
  status: 'real' | 'mocked' | 'partial';
  statusLabel: string;
  features: string[];
}

function PageStub({ title, description, icon, status, statusLabel, features }: PageStubProps) {
  const statusIcon = status === 'real' ? CheckCircle2 : status === 'partial' ? AlertCircle : CircleDashed;
  const statusColor = status === 'real' ? 'var(--success)' : status === 'partial' ? 'var(--warning)' : 'var(--ink-tertiary)';

  return (
    <div style={{ padding: 'var(--space-6)', maxWidth: 640, margin: '0 auto' }}>
      <Stack gap={6}>
        {/* Page header */}
        <Stack gap={2}>
          <Stack direction="horizontal" gap={3} align="center">
            <Icon icon={icon} size={24} color="secondary" />
            <Text variant="title">{title}</Text>
          </Stack>
          <Text variant="body" color="secondary">{description}</Text>
        </Stack>

        {/* Status card */}
        <Surface elevation="flat" radius="md" padding="md" bordered>
          <Stack gap={3}>
            <Stack direction="horizontal" gap={2} align="center">
              <div style={{ color: statusColor }}>
                <Icon icon={statusIcon} size={16} color="inherit" />
              </div>
              <Text variant="body-sm" weight="medium" style={{ color: statusColor }}>
                {statusLabel}
              </Text>
            </Stack>
            <Stack gap={1}>
              {features.map((f) => (
                <Text key={f} variant="body-sm" color="tertiary">
                  {f}
                </Text>
              ))}
            </Stack>
          </Stack>
        </Surface>
      </Stack>
    </div>
  );
}

export function DashboardPage() {
  return (
    <PageStub
      title="Dashboard"
      description="Campaign overview — what's next and what needs attention."
      icon={LayoutDashboard}
      status="mocked"
      statusLabel="Mocked — no backend wiring"
      features={[
        'Upcoming sessions (Session entity exists in backend)',
        'Beats backlog (Beat entity not yet in backend)',
        'Safety tools status (backend tables exist)',
        'Open conflicts / drift flags (drift table exists)',
        'Recent changes feed (no backend endpoint yet)',
      ]}
    />
  );
}

export function EventsTimelinePage() {
  return (
    <PageStub
      title="Events / Timeline"
      description="Canon events and chronological story exploration."
      icon={CalendarClock}
      status="partial"
      statusLabel="Partial — Event entity type exists, timeline view does not"
      features={[
        'Event CRUD (Event entity type in backend)',
        'Timeline visualization (not implemented)',
        'Mixed timeline items: Events + Session markers + Beats (Beats not in backend)',
        'Continuity filtering (Continuity table exists)',
      ]}
    />
  );
}

export function SessionsPage() {
  return (
    <PageStub
      title="Sessions"
      description="Plan upcoming sessions, write recaps, review session history."
      icon={Clapperboard}
      status="real"
      statusLabel="Real data — Session entity + feedback + quick notes in backend"
      features={[
        'Session list and creation (Session entity in backend)',
        'Session planning / prep notes (type_specific_fields.prepNotes)',
        'Post-session recap (summary field)',
        'Stars & Wishes collection (session_feedback table)',
        'Quick notes review (quick_notes table)',
      ]}
    />
  );
}

export function SearchPage() {
  return (
    <PageStub
      title="Search"
      description="Global search across your world with campaign selection."
      icon={Search}
      status="mocked"
      statusLabel="Mocked — FTS table exists but no prototype wiring"
      features={[
        'Full-text search (entities_fts virtual table in backend)',
        'Type filter, tag filter, campaign filter',
        'Recency sort / boost',
        'Visibility filter (GM vs player)',
        'Search results with entity type indicators',
      ]}
    />
  );
}

export function AssetsPage() {
  return (
    <PageStub
      title="Assets / Files"
      description="Asset library for images and PDFs, linkable to content."
      icon={FolderOpen}
      status="mocked"
      statusLabel="Mocked — no backend schema for assets"
      features={[
        'Image and PDF library (no schema yet)',
        'Asset linking to entities and sessions',
        'Inbound reference tracking',
        'GM-only vs player-visible toggle',
      ]}
    />
  );
}

export function PlayerViewPage() {
  return (
    <PageStub
      title="Player View"
      description="Preview your world as players see it — secrets and GM-only content hidden."
      icon={Eye}
      status="mocked"
      statusLabel="Mocked — no role/visibility system in backend"
      features={[
        'Entity browser with secrets stripped (visibility field not in backend)',
        'Session notes (player-safe summary only)',
        'Map/asset viewer without GM annotations',
        'Read-only mode — no editing allowed',
        'Per-player visibility overrides (future)',
      ]}
    />
  );
}
