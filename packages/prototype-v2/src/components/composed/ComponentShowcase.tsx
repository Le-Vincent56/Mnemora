import { useState } from 'react';
import {
    User, MapPin, Shield, FileText,
    LayoutGrid, List, Plus, Trash2, BookOpen,
} from 'lucide-react';
import { Surface, Stack, Text, Button, Divider } from '@/primitives';
import { SectionHeader } from './SectionHeader';
import { FormField } from './FormField';
import { Modal } from './Modal';
import { EntityCard } from './EntityCard';
import { SearchInput } from './SearchInput';
import { EntityListItem } from './EntityListItem';
import { ViewToggle } from './ViewToggle';
import { ConfirmDialog } from './ConfirmDialog';

/**
 * Interactive showcase for all composed components.
 * Rendered inside the "Design System" prep view.
 */
export function ComponentShowcase() {
    const [modalOpen, setModalOpen] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [view, setView] = useState('grid');
    const [selectedCard, setSelectedCard] = useState<string | null>(null);
    const [searchValue, setSearchValue] = useState('');
    const [fieldValue, setFieldValue] = useState('');
    const [fieldError, setFieldError] = useState('');

    return (
        <Stack gap={8}>
            <Text variant="title">Composed Components Showcase</Text>
            <Text variant="body" color="secondary">
                Live demos of the 8 higher-level components built from Phase 0 primitives.
            </Text>

            <Divider spacing="sm" />

            {/* 1. SectionHeader */}
            <Surface elevation="flat" radius="lg" padding="lg" bordered>
                <Stack gap={4}>
                    <Text variant="heading">1. SectionHeader</Text>
                    <Text variant="body-sm" color="secondary">
                        Labeled section divider with optional action slot.
                    </Text>
                    <Surface elevation="flat" radius="md" padding="md" bordered>
                        <SectionHeader title="CHARACTERS" action={
                            <Button variant="ghost" size="sm">
                                <Plus size={14} /> Add
                            </Button>
                        } />
                        <div style={{ padding: 'var(--space-4) 0' }}>
                            <Text variant="body-sm" color="tertiary">
                                Content below the section header...
                            </Text>
                        </div>
                        <SectionHeader title="Recent Activity" variant="heading" bordered={false} />
                        <div style={{ padding: 'var(--space-2) 0' }}>
                            <Text variant="body-sm" color="tertiary">
                                Heading variant, no border.
                            </Text>
                        </div>
                    </Surface>
                </Stack>
            </Surface>

            {/* 2. FormField */}
            <Surface elevation="flat" radius="lg" padding="lg" bordered>
                <Stack gap={4}>
                    <Text variant="heading">2. FormField</Text>
                    <Text variant="body-sm" color="secondary">
                        Accessible labeled input with error/helper text. Uses render prop for input slot.
                    </Text>
                    <Stack gap={4} style={{ maxWidth: 360 }}>
                        <FormField label="World Name" required error={fieldError}>
                            {(id) => (
                                <input
                                    id={id}
                                    value={fieldValue}
                                    onChange={(e) => {
                                        setFieldValue(e.target.value);
                                        setFieldError(e.target.value.length > 20 ? 'Max 20 characters' : '');
                                    }}
                                    placeholder="Enter a world name..."
                                    style={{
                                        width: '100%',
                                        height: 40,
                                        padding: '0 var(--space-3)',
                                        border: '1px solid var(--border-default)',
                                        borderRadius: 'var(--radius-md)',
                                        background: 'var(--canvas)',
                                        color: 'var(--text-primary)',
                                        fontFamily: 'var(--font-body)',
                                        fontSize: 'var(--text-sm)',
                                    }}
                                />
                            )}
                        </FormField>
                        <FormField label="Tagline" helper="A short description for your world.">
                            {(id) => (
                                <input
                                    id={id}
                                    placeholder="Where worlds remember themselves..."
                                    style={{
                                        width: '100%',
                                        height: 40,
                                        padding: '0 var(--space-3)',
                                        border: '1px solid var(--border-default)',
                                        borderRadius: 'var(--radius-md)',
                                        background: 'var(--canvas)',
                                        color: 'var(--text-primary)',
                                        fontFamily: 'var(--font-body)',
                                        fontSize: 'var(--text-sm)',
                                    }}
                                />
                            )}
                        </FormField>
                    </Stack>
                </Stack>
            </Surface>

            {/* 3. Modal */}
            <Surface elevation="flat" radius="lg" padding="lg" bordered>
                <Stack gap={4}>
                    <Text variant="heading">3. Modal</Text>
                    <Text variant="body-sm" color="secondary">
                        Backdrop + centered card with memory-surfacing animation and Escape to close.
                    </Text>
                    <Button variant="secondary" onClick={() => setModalOpen(true)}>
                        Open Modal
                    </Button>
                    <Modal open={modalOpen} onClose={() => setModalOpen(false)} aria-label="Demo modal">
                        <Stack gap={4}>
                            <Text variant="title">Create New World</Text>
                            <Text variant="body" color="secondary">
                                This is a demo modal using the composed Modal component with
                                memory-surfacing entry animation.
                            </Text>
                            <Stack direction="horizontal" gap={3} justify="end">
                                <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
                                <Button variant="primary" onClick={() => setModalOpen(false)}>Create</Button>
                            </Stack>
                        </Stack>
                    </Modal>
                </Stack>
            </Surface>

            {/* 4. EntityCard */}
            <Surface elevation="flat" radius="lg" padding="lg" bordered>
                <Stack gap={4}>
                    <Text variant="heading">4. EntityCard</Text>
                    <Text variant="body-sm" color="secondary">
                        Hoverable card for the entity browser grid. Click to select.
                    </Text>
                    <Stack direction="horizontal" gap={4} wrap>
                        <EntityCard
                            name="Theron Ashvale"
                            entityType="character"
                            icon={User}
                            excerpt="A retired soldier turned innkeeper with a dark secret."
                            selected={selectedCard === 'theron'}
                            onSelect={() => setSelectedCard(selectedCard === 'theron' ? null : 'theron')}
                            style={{ maxWidth: 280 }}
                        />
                        <EntityCard
                            name="The Whispering Depths"
                            entityType="location"
                            icon={MapPin}
                            excerpt="An ancient cavern system beneath the city where echoes carry memories."
                            selected={selectedCard === 'depths'}
                            onSelect={() => setSelectedCard(selectedCard === 'depths' ? null : 'depths')}
                            style={{ maxWidth: 280 }}
                        />
                        <EntityCard
                            name="The Iron Covenant"
                            entityType="faction"
                            icon={Shield}
                            excerpt="A secretive guild of artificers who guard forbidden knowledge."
                            selected={selectedCard === 'covenant'}
                            onSelect={() => setSelectedCard(selectedCard === 'covenant' ? null : 'covenant')}
                            style={{ maxWidth: 280 }}
                        />
                    </Stack>
                </Stack>
            </Surface>

            {/* 5. SearchInput */}
            <Surface elevation="flat" radius="lg" padding="lg" bordered>
                <Stack gap={4}>
                    <Text variant="heading">5. SearchInput</Text>
                    <Text variant="body-sm" color="secondary">
                        Styled search field with leading icon and optional shortcut badge.
                    </Text>
                    <Stack gap={3} style={{ maxWidth: 400 }}>
                        <SearchInput
                            placeholder="Summon..."
                            shortcut={'\u2318K'}
                            value={searchValue}
                            onChange={(e) => setSearchValue(e.target.value)}
                        />
                        <SearchInput placeholder="Quick search..." size="sm" />
                    </Stack>
                </Stack>
            </Surface>

            {/* 6. EntityListItem */}
            <Surface elevation="flat" radius="lg" padding="lg" bordered>
                <Stack gap={4}>
                    <Text variant="heading">6. EntityListItem</Text>
                    <Text variant="body-sm" color="secondary">
                        Compact row for list-view entity browsing.
                    </Text>
                    <Surface elevation="flat" radius="md" padding="sm" bordered style={{ maxWidth: 500 }}>
                        <Stack gap={0}>
                            <EntityListItem
                                name="Theron Ashvale"
                                entityType="character"
                                icon={User}
                                meta="2h ago"
                                selected={selectedCard === 'theron'}
                                onSelect={() => setSelectedCard(selectedCard === 'theron' ? null : 'theron')}
                            />
                            <EntityListItem
                                name="The Whispering Depths"
                                entityType="location"
                                icon={MapPin}
                                meta="1d ago"
                                onSelect={() => {}}
                            />
                            <EntityListItem
                                name="Plot threads to resolve"
                                entityType="note"
                                icon={FileText}
                                meta="3d ago"
                                onSelect={() => {}}
                            />
                            <EntityListItem
                                name="The Whispering Depths"
                                entityType="location"
                                icon={MapPin}
                                meta="1w ago"
                                onSelect={() => {}}
                            />
                        </Stack>
                    </Surface>
                </Stack>
            </Surface>

            {/* 7. ViewToggle */}
            <Surface elevation="flat" radius="lg" padding="lg" bordered>
                <Stack gap={4}>
                    <Text variant="heading">7. ViewToggle</Text>
                    <Text variant="body-sm" color="secondary">
                        Segmented radio toggle for switching views. Current: <Text as="span" variant="mono">{view}</Text>
                    </Text>
                    <ViewToggle
                        options={[
                            { value: 'grid', icon: LayoutGrid, label: 'Card view' },
                            { value: 'list', icon: List, label: 'List view' },
                            { value: 'book', icon: BookOpen, label: 'Book view' },
                        ]}
                        value={view}
                        onChange={setView}
                    />
                </Stack>
            </Surface>

            {/* 8. ConfirmDialog */}
            <Surface elevation="flat" radius="lg" padding="lg" bordered>
                <Stack gap={4}>
                    <Text variant="heading">8. ConfirmDialog</Text>
                    <Text variant="body-sm" color="secondary">
                        Pre-composed Modal with title, message, and cancel/confirm buttons.
                    </Text>
                    <Button variant="danger" onClick={() => setConfirmOpen(true)}>
                        <Trash2 size={16} /> Delete Character
                    </Button>
                    <ConfirmDialog
                        open={confirmOpen}
                        onClose={() => setConfirmOpen(false)}
                        onConfirm={() => setConfirmOpen(false)}
                        title="Delete Character"
                        message="This will permanently remove Theron Ashvale and all associated notes. This action cannot be undone."
                        confirmLabel="Delete"
                    />
                </Stack>
            </Surface>
        </Stack>
    );
}
