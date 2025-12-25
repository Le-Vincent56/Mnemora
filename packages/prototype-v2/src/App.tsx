import { useState, useEffect } from 'react';
import { Surface, Stack, Text, Button } from '@/primitives';
import { useReducedMotion } from '@/hooks';

type Mode = 'prep' | 'session';

export function App() {
    const [mode, setMode] = useState<Mode>('prep');
    const reducedMotion = useReducedMotion();

    // Sync data-mode attribute on <html>
    useEffect(() => {
        document.documentElement.setAttribute('data-mode', mode);
    }, [mode]);

    const toggleMode = () => {
        setMode((current) => (current === 'prep' ? 'session' : 'prep'));
    };

    return (
        <div style={{
            minHeight: '100vh',
            padding: 'var(--space-8)',
            backgroundColor: 'var(--canvas)',
        }}>
            <Stack gap={8}>
                {/* Header */}
                <Stack gap={2}>
                    <Text variant="display">Mnemora</Text>
                    <Text variant="body" color="secondary">
                        Where worlds remember themselves
                    </Text>
                </Stack>

                {/* Mode Toggle */}
                <Surface elevation="raised" radius="lg" padding="md" bordered>
                    <Stack gap={4}>
                        <Stack direction="horizontal" justify="between" align="center">
                            <Stack gap={1}>
                                <Text variant="heading">Mode Toggle Test</Text>
                                <Text variant="body-sm" color="tertiary">
                                    Current mode: <Text as="span" variant="mono">{mode}</Text>
                                </Text>
                            </Stack>
                            <Button variant="primary" onClick={toggleMode}>
                                Switch to {mode === 'prep' ? 'Session' : 'Prep'}
                            </Button>
                        </Stack>
                        <Text variant="body-sm" color="secondary">
                            {reducedMotion ? 'Reduced motion enabled - animations will be minimal' : 'Full animations enabled'}
                        </Text>
                    </Stack>
                </Surface>

                {/* Primitives demo */}
                <Stack gap={6}>
                    <Text variant="title">Primitives Demo</Text>

                    {/* Typography */}
                    <Surface elevation="flat" radius="md" padding="md" bordered>
                        <Stack gap={4}>
                            <Text variant="caption" color="tertiary">Typography</Text>
                            
                            <Stack gap={2}>
                                <Text variant="display">Display Text</Text>
                                <Text variant="title">Title Text</Text>
                                <Text variant="heading">Heading Text</Text>
                                <Text variant="body">Body text - the default for paragraphs and content.</Text>
                                <Text variant="body-sm" color="secondary">Body small - secondary information.</Text>
                                <Text variant="caption" color="tertiary">CAPTION TEXT</Text>
                                <Text variant="mono">monospace: code snippets</Text>
                            </Stack>
                        </Stack>
                    </Surface>

                    {/* Buttons */}
                    <Surface elevation="flat" radius="md" padding="md" bordered>
                        <Stack gap={4}>
                            <Text variant="caption" color="tertiary">Buttons</Text>

                            <Stack direction="horizontal" gap={3} wrap>
                                <Button variant="primary">Primary</Button>
                                <Button variant="secondary">Secondary</Button>
                                <Button variant="ghost">Ghost</Button>
                                <Button variant="danger">Danger</Button>
                            </Stack>
                            <Stack direction="horizontal" gap={3} wrap>
                                <Button variant="primary" size="sm">Small</Button>
                                <Button variant="primary" size="md">Medium</Button>
                                <Button variant="primary" size="lg">Large</Button>
                            </Stack>
                            <Stack direction="horizontal" gap={3}>
                                <Button variant="secondary" disabled>Disabled</Button>
                            </Stack>
                        </Stack>
                    </Surface>

                    {/* Surfaces */}
                    <Surface elevation="flat" radius="md" padding="md" bordered>
                        <Stack gap={4}>
                            <Text variant="caption" color="tertiary">Surfaces</Text>

                            <Stack direction="horizontal" gap={4} wrap>
                                <Surface elevation="flat" radius="md" padding="md" bordered>
                                    <Text variant="body-sm">Flat + Bordered</Text>
                                </Surface>
                                <Surface elevation="raised" radius="md" padding="md">
                                    <Text variant="body-sm">Raised</Text>
                                </Surface>
                                <Surface elevation="overlay" radius="md" padding="md">
                                    <Text variant="body-sm">Overlay</Text>
                                </Surface>
                                <Surface elevation="raised" radius="lg" padding="md" hoverable>
                                    <Text variant="body-sm">Hoverable</Text>
                                </Surface>
                            </Stack>
                        </Stack>
                    </Surface>

                    {/* Entity Colors */}
                    <Surface elevation="flat" radius="md" padding="md" bordered>
                        <Stack gap={4}>
                            <Text variant="caption" color="tertiary">Entity Type Colors (Invariant)</Text>
                            <Stack direction="horizontal" gap={3} wrap>
                                {
                                    [
                                        { name: 'Character', color: 'var(--entity-character)'},
                                        { name: 'Location', color: 'var(--entity-location)' },
                                        { name: 'Faction', color: 'var(--entity-faction)' },
                                        { name: 'Session', color: 'var(--entity-session)' },
                                        { name: 'Note', color: 'var(--entity-note)' },
                                    ].map(({ name, color }) => (
                                        <Stack key={name} gap={2} align="center">
                                            <div
                                                style={{
                                                    width: 48,
                                                    height: 48,
                                                    borderRadius: 'var(--radius-md)',
                                                    backgroundColor: color,
                                                }}
                                            />
                                            <Text variant="caption" color="secondary">{name}</Text>
                                        </Stack>
                                    ))     
                                }
                            </Stack>
                        </Stack>
                    </Surface>

                    {/* Ceremony Colors */}
                    <Surface elevation="flat" radius="md" padding="md" bordered>
                        <Stack gap={4}>
                            <Text variant="caption" color="tertiary">Ceremony Bokeh Colors</Text>

                            <Stack direction="horizontal" gap={3} wrap>
                                {
                                    [1, 2, 3, 4].map((n) => (
                                        <div
                                            key={n}
                                            style={{
                                                width: 64,
                                                height: 64,
                                                borderRadius: '50%',
                                                backgroundColor: `var(--ceremony-bokeh-${n})`,
                                                filter: 'blur(8px)',
                                            }}
                                        />
                                    ))
                                }
                            </Stack>
                        </Stack>
                    </Surface>
                </Stack>

                {/* Footer */}
                <Text variant="body-sm" color="tertiary">
                    Phase 0 Foundation - Toggle mode to verify token switching
                </Text>
            </Stack>
        </div>
    );
}