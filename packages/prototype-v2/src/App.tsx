import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Surface, Stack, Text } from '@/primitives';
import { useReducedMotion } from '@/hooks';
import {
    CeremonyOverlay,
    useCeremony,
    CeremonyType
} from '@/ceremony';
import {
    AppShell,
    IconRail,
    PageHeader
} from '@/components/layout';
import { ComponentShowcase } from '@/components/composed';
import { PrepModeShell } from '@/components/prep/PrepModeShell';
import layoutStyles from '@/components/layout/layout.module.css';
import { EASING } from '@/tokens';

type Mode = 'prep' | 'session';
type PrepView = 'prep' | 'design-system';
type SessionView = 'quick-ref' | 'notes' | 'safety';

/**
 * Content transition variants for mode switches.
 * Uses the "memory surfacing" pattern — content rises from below.
 *
 * With AnimatePresence mode="popLayout", both old and new content
 * can coexist briefly. The exit runs while the enter starts,
 * creating a true crossfade instead of a sequential gap.
 */
const reducedContentVariants = {
    initial: {
        opacity: 0,
    },
    animate: {
        opacity: 1,
        transition: { duration: 0.01 },
    },
    exit: {
        opacity: 0,
        transition: { duration: 0.01 },
    },
};

const contentVariants = {
    initial: {
        opacity: 0,
        y: 24,
        scale: 0.98,
    },
    animate: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            duration: 0.4,
            ease: EASING.memory,
            delay: 0.15,
        },
    },
    exit: {
        opacity: 0,
        y: -10,
        scale: 0.98,
        transition: {
            duration: 0.2,
            ease: EASING.memory,
        },
    },
};

// ===============================
//          MAIN COMPONENT
// ===============================

export function App() {
    const [mode, setMode] = useState<Mode>('prep');
    const [prepView, setPrepView] = useState<PrepView>('prep');
    const [sessionView, setSessionView] = useState<SessionView>('quick-ref');
    const [sessionTime, setSessionTime] = useState('0:00');
    const reducedMotion = useReducedMotion();
    const { state, controls, isBlocking } = useCeremony();

    // -----------------------------------------
    //      MODE & DOCUMENT SYNC (DEFERRED)
    // -----------------------------------------

    // Sync data-mode attribute on <html>.
    // During a ceremony, the onModeSwitch callback sets data-mode
    // synchronously (scrim is opaque at that point, hiding token flash).
    // Outside of a ceremony, sync immediately on mode change.
    useEffect(() => {
        if (state.status !== 'running') {
            document.documentElement.setAttribute('data-mode', mode);
        }
    }, [mode, state.status]);

    // Mock session timer
    useEffect(() => {
        if (mode !== 'session') {
            setSessionTime('0:00');
            return;
        }

        const start = Date.now();
        const interval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - start) / 1000);
            const mins = Math.floor(elapsed / 60);
            const secs = elapsed % 60;
            setSessionTime(`${mins}:${secs.toString().padStart(2, '0')}`);
        }, 1000);

        return () => clearInterval(interval);
    }, [mode]);


    // -----------------------------------------
    //      NAVIGATION HANDLERS
    // -----------------------------------------

    const handleNavigate = useCallback((itemID: string) => {
        if (mode === 'prep') {
            setPrepView(itemID as PrepView);
        } else {
            setSessionView(itemID as SessionView);
        }
    }, [mode]);

    // -----------------------------------------
    //   MODE SWITCH WITH CEREMONY
    // -----------------------------------------

    const handleModeSwitch = useCallback(() => {
        const newMode = mode === 'prep' ? 'session' : 'prep';
        const ceremonyType = mode === 'prep'
            ? CeremonyType.PREP_TO_SESSION
            : CeremonyType.SESSION_TO_PREP;

        controls.triggerCeremony(ceremonyType, {
            onModeSwitch: () => {
                // Set data-mode synchronously — ceremony scrim is opaque
                document.documentElement.setAttribute('data-mode', newMode);
                setMode(newMode);
            },
            onComplete: () => {
                console.log(`Ceremony complete: now in ${newMode} mode`);
            },
        });
    }, [mode, controls]);

    // -----------------------------------------
    //          ACTIVE VIEW
    // -----------------------------------------

    const activeItem = mode === 'prep' ? prepView : sessionView;

    // -----------------------------------------
    //          RENDER
    // -----------------------------------------

    return (
        <>
            {/* Ceremony particle overlay (portals to body) */}
            <CeremonyOverlay />

            <AppShell
                rail={
                    <IconRail
                        mode={mode}
                        activeItem={activeItem}
                        onNavigate={handleNavigate}
                        onModeSwitch={handleModeSwitch}
                        sessionTime={sessionTime}
                    />
                }
                animateContent={false}
                contentClassName={mode === 'prep' && prepView === 'prep' ? layoutStyles.contentNoPad : undefined}
            >
                {/*
                 * mode="popLayout" keeps both contents mounted briefly,
                 * enabling a true crossfade. The exiting content gets
                 * position:absolute via popLayout so it doesn't push layout.
                 */}
                <AnimatePresence mode="popLayout">
                    {mode === 'prep' ? (
                        prepView === 'prep' ? (
                            <motion.div
                                key="prep-shell"
                                variants={reducedMotion ? reducedContentVariants : contentVariants}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                style={{ height: '100%' }}
                            >
                                <PrepModeShell />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="prep-content"
                                variants={reducedMotion ? reducedContentVariants : contentVariants}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                            >
                                <PrepModeContent
                                    activeView={prepView}
                                    ceremonyState={state}
                                    isBlocking={isBlocking}
                                    reducedMotion={reducedMotion}
                                />
                            </motion.div>
                        )
                    ) : (
                        <motion.div
                            key="session-content"
                            variants={reducedMotion ? reducedContentVariants : contentVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                        >
                            <SessionModeContent
                                activeView={sessionView}
                                sessionTime={sessionTime}
                                ceremonyState={state}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </AppShell>
        </>
    );
}

// ===============================
//        PREP MODE CONTENT
// ===============================

interface PrepModeContentProps {
    activeView: PrepView;
    ceremonyState: ReturnType<typeof useCeremony>['state'];
    isBlocking: boolean;
    reducedMotion: boolean;
}

function PrepModeContent({
    activeView,
    ceremonyState,
    isBlocking,
    reducedMotion,
}: PrepModeContentProps) {
    const viewTitles: Record<PrepView, { title: string; subtitle: string }> = {
        prep: {
            title: 'Prep Mode',
            subtitle: 'Your campaign workspace'
        },
        'design-system': {
            title: 'Design System',
            subtitle: 'Modern Grimoire v2.0 token preview'
        },
    };

    const { title, subtitle } = viewTitles[activeView];

    return (
        <Stack gap={6}>
            <PageHeader title={title} subtitle={subtitle} />

            {/* Ceremony Status Panel */}
            <Surface elevation="raised" radius="lg" padding="md" bordered>
                <Stack gap={4}>
                    <Stack gap={1}>
                        <Text variant="heading">Phase 2: Layout Shell</Text>

                        <Text variant="body-sm" color="tertiary">
                            Ceremony integration verification
                        </Text>
                    </Stack>

                    <Stack direction="horizontal" gap={6} wrap>
                        <Stack gap={1}>
                            <Text variant="caption" color="tertiary">MODE</Text>
                            <Text variant="mono">prep</Text>
                        </Stack>
                        <Stack gap={1}>
                            <Text variant="caption" color="tertiary">VIEW</Text>
                            <Text variant="mono">{activeView}</Text>
                        </Stack>
                        <Stack gap={1}>
                            <Text variant="caption" color="tertiary">CEREMONY</Text>
                            <Text variant="mono">
                                {ceremonyState.status === 'idle'
                                    ? 'idle'
                                    : `${ceremonyState.phase} (${Math.round(ceremonyState.progress * 100)}%)`
                                }
                            </Text>
                        </Stack>
                        <Stack gap={1}>
                            <Text variant="caption" color="tertiary">BLOCKING</Text>
                            <Text variant="mono">{isBlocking ? 'yes' : 'no'}</Text>
                        </Stack>
                    </Stack>

                    <Text variant="body-sm" color="secondary">
                        {reducedMotion
                            ? 'Reduced motion: 250ms crossfade'
                            : 'Full ceremony: 1000ms with Memory Surfacing effect'
                        }
                    </Text>
                </Stack>
            </Surface>

            {/* Placeholder content for active view */}
            <Surface elevation="flat" radius="md" padding="lg" bordered>
                <Stack gap={4} align="center" style={{ padding: 'var(--space-8) 0' }}>
                    <Text variant="title" color="tertiary">
                        {title} View
                    </Text>
                    <Text variant="body" color="tertiary" style={{ textAlign: 'center', maxWidth: 400 }}>
                        This is where the {title.toLowerCase()} content will appear.
                        Click the <Text as="span" variant="mono" color="secondary">Play</Text> button
                        in the rail to start a session.
                    </Text>
                </Stack>
            </Surface>

            {/* Entity colors preview */}
            <Surface elevation="flat" radius="md" padding="md" bordered>
                <Stack gap={4}>
                    <Text variant="caption" color="tertiary">Entity Type Colors</Text>
                    <Stack direction="horizontal" gap={3} wrap>
                        {[
                            { name: 'Character', color: 'var(--entity-character)' },
                            { name: 'Location', color: 'var(--entity-location)' },
                            { name: 'Faction', color: 'var(--entity-faction)' },
                            { name: 'Session', color: 'var(--entity-session)' },
                            { name: 'Note', color: 'var(--entity-note)' },
                        ].map(({ name, color }) => (
                            <Stack key={name} gap={2} align="center">
                                <div
                                    style={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: 'var(--radius-md)',
                                        backgroundColor: color,
                                    }}
                                />
                                <Text variant="caption" color="secondary">{name}</Text>
                            </Stack>
                        ))}
                    </Stack>
                </Stack>
            </Surface>

            {/* Design System Preview (shown when design-system view is active) */}
            {activeView === 'design-system' && <DesignSystemPreview />}
            {activeView === 'design-system' && <ComponentShowcase />}
        </Stack>
    )
}

// ===============================
//      SESSION MODE CONTENT
// ===============================

interface SessionModeContentProps {
    activeView: SessionView;
    sessionTime: string;
    ceremonyState: ReturnType<typeof useCeremony>['state'];
}

function SessionModeContent({
    activeView,
    sessionTime,
    ceremonyState,
}: SessionModeContentProps) {
    const viewTitles: Record<SessionView, { title: string; subtitle: string }> = {
        'quick-ref': {
            title: 'Quick Reference',
            subtitle: 'Fast access to key entities'
        },
        notes: {
            title: 'Session Notes',
            subtitle: 'Capture moments as they happen'
        },
        safety: {
            title: 'Safety Tools',
            subtitle: 'X-Card, Lines & Veils, and more'
        },
    };

    const { title, subtitle } = viewTitles[activeView];

    // Session timer badge as a separate element for clarity
    const timerBadge = (
        <div
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                padding: 'var(--space-1) var(--space-3)',
                backgroundColor: 'var(--primary-subtle)',
                borderRadius: 'var(--radius-full)',
            }}
        >
            <div
                style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: 'var(--success)',
                }}
            />
            <Text variant="mono" style={{ fontSize: 'var(--text-sm)' }}>
                {sessionTime}
            </Text>
        </div>
    );

    return (
        <Stack gap={6}>
            <PageHeader
                title={title}
                subtitle={subtitle}
                actions={timerBadge}
            />

            {/* Session Status Panel */}
            <Surface
                elevation="raised"
                radius="lg"
                padding="md"
                bordered
                style={{ borderColor: 'var(--primary)', borderWidth: 2 }}
            >
                <Stack gap={4}>
                    <Stack gap={1}>
                        <Text variant="heading">Session Active</Text>
                        <Text variant="body-sm" color="tertiary">
                            Night mode engaged • Deep void canvas
                        </Text>
                    </Stack>

                    <Stack direction="horizontal" gap={6} wrap>
                        <Stack gap={1}>
                            <Text variant="caption" color="tertiary">MODE</Text>
                            <Text variant="mono">session</Text>
                        </Stack>
                        <Stack gap={1}>
                            <Text variant="caption" color="tertiary">VIEW</Text>
                            <Text variant="mono">{activeView}</Text>
                        </Stack>
                        <Stack gap={1}>
                            <Text variant="caption" color="tertiary">ELAPSED</Text>
                            <Text variant="mono">{sessionTime}</Text>
                        </Stack>
                        <Stack gap={1}>
                            <Text variant="caption" color="tertiary">CEREMONY</Text>
                            <Text variant="mono">
                                {ceremonyState.status === 'idle'
                                    ? 'idle'
                                    : `${ceremonyState.phase} (${Math.round(ceremonyState.progress * 100)}%)`
                                }
                            </Text>
                        </Stack>
                    </Stack>

                    <Text variant="body-sm" color="secondary">
                        Click the <Text as="span" variant="mono">Stop</Text> button in the rail
                        to end the session (350ms quick release).
                    </Text>
                </Stack>
            </Surface>

            {/* Placeholder content for active view */}
            <Surface elevation="flat" radius="md" padding="lg" bordered>
                <Stack gap={4} align="center" style={{ padding: 'var(--space-8) 0' }}>
                    <Text variant="title" color="tertiary">
                        {title}
                    </Text>
                    <Text variant="body" color="tertiary" style={{ textAlign: 'center', maxWidth: 400 }}>
                        Session mode {activeView} content will appear here.
                        The interface shifts to night mode for focused gameplay.
                    </Text>
                </Stack>
            </Surface>
        </Stack>
    );
}

// ===============================
//    DESIGN SYSTEM PREVIEW
// ===============================

function DesignSystemPreview() {
    const sectionStyle: React.CSSProperties = {
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-4)',
    };

    const swatchRow: React.CSSProperties = {
        display: 'flex',
        gap: 'var(--space-3)',
        flexWrap: 'wrap',
    };

    const swatch = (bg: string, label: string, border?: string): React.ReactNode => (
        <Stack key={label} gap={1} align="center">
            <div style={{
                width: 64,
                height: 48,
                borderRadius: 'var(--radius-md)',
                backgroundColor: bg,
                border: border || '1px solid var(--border-default)',
            }} />
            <Text variant="caption" color="tertiary">{label}</Text>
        </Stack>
    );

    return (
        <Stack gap={8}>
            {/* ---- Surfaces ---- */}
            <Surface elevation="flat" radius="lg" padding="lg" bordered>
                <div style={sectionStyle}>
                    <Text variant="heading">Surfaces</Text>
                    <Text variant="body-sm" color="secondary">
                        Flat / Raised / Overlay elevations in current mode
                    </Text>
                    <div style={swatchRow}>
                        {swatch('var(--canvas)', 'Canvas')}
                        {swatch('var(--surface)', 'Surface')}
                        {swatch('var(--surface-hover)', 'Hover')}
                        {swatch('var(--surface-active)', 'Active')}
                    </div>

                    <Stack direction="horizontal" gap={4} wrap>
                        <Surface elevation="flat" radius="md" padding="md" bordered>
                            <Text variant="caption" color="tertiary">Flat</Text>
                        </Surface>
                        <Surface elevation="raised" radius="md" padding="md" bordered>
                            <Text variant="caption" color="tertiary">Raised</Text>
                        </Surface>
                        <Surface elevation="overlay" radius="md" padding="md" bordered>
                            <Text variant="caption" color="tertiary">Overlay</Text>
                        </Surface>
                    </Stack>
                </div>
            </Surface>

            {/* ---- Typography ---- */}
            <Surface elevation="flat" radius="lg" padding="lg" bordered>
                <div style={sectionStyle}>
                    <Text variant="heading">Text Hierarchy</Text>
                    <Text variant="display">Display (Fraunces)</Text>
                    <Text variant="title">Title (Fraunces)</Text>
                    <Text variant="heading">Heading (Jakarta Sans)</Text>
                    <Text variant="body">Body text — the default reading size.</Text>
                    <Text variant="body-sm" color="secondary">Body Small — secondary information.</Text>
                    <Text variant="caption" color="tertiary">CAPTION — labels and metadata</Text>
                    <Text variant="mono">mono: const x = 42;</Text>

                    <Stack gap={2} style={{ marginTop: 'var(--space-4)' }}>
                        <Text variant="caption" color="tertiary">INK HIERARCHY</Text>
                        <Text variant="body" style={{ color: 'var(--ink-primary)' }}>
                            ink-primary — highest contrast
                        </Text>
                        <Text variant="body" style={{ color: 'var(--ink-secondary)' }}>
                            ink-secondary — supporting text
                        </Text>
                        <Text variant="body" style={{ color: 'var(--ink-tertiary)' }}>
                            ink-tertiary — muted / placeholder
                        </Text>
                    </Stack>
                </div>
            </Surface>

            {/* ---- Primary Button States ---- */}
            <Surface elevation="flat" radius="lg" padding="lg" bordered>
                <div style={sectionStyle}>
                    <Text variant="heading">Primary States</Text>
                    <Stack direction="horizontal" gap={3} wrap>
                        <button style={{
                            height: 40, padding: '0 16px', borderRadius: 'var(--radius-md)',
                            border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)',
                            fontWeight: 500, fontSize: 'var(--text-sm)',
                            background: 'var(--primary)', color: 'var(--text-inverse)',
                        }}>Default</button>
                        <button style={{
                            height: 40, padding: '0 16px', borderRadius: 'var(--radius-md)',
                            border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)',
                            fontWeight: 500, fontSize: 'var(--text-sm)',
                            background: 'var(--primary-hover)', color: 'var(--text-inverse)',
                        }}>Hover</button>
                        <button style={{
                            height: 40, padding: '0 16px', borderRadius: 'var(--radius-md)',
                            border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)',
                            fontWeight: 500, fontSize: 'var(--text-sm)',
                            background: 'var(--primary-active)', color: 'var(--text-inverse)',
                        }}>Active</button>
                        <button style={{
                            height: 40, padding: '0 16px', borderRadius: 'var(--radius-md)',
                            border: 'none', fontFamily: 'var(--font-body)',
                            fontWeight: 500, fontSize: 'var(--text-sm)',
                            background: 'var(--primary)', color: 'var(--text-inverse)',
                            opacity: 0.5, cursor: 'not-allowed',
                        }}>Disabled</button>
                    </Stack>

                    <Text variant="caption" color="tertiary" style={{ marginTop: 'var(--space-2)' }}>
                        BORDER WEIGHTS
                    </Text>
                    <Stack direction="horizontal" gap={3} wrap>
                        <div style={{
                            width: 80, height: 48, borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-subtle)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}><Text variant="caption" color="tertiary">Subtle</Text></div>
                        <div style={{
                            width: 80, height: 48, borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-default)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}><Text variant="caption" color="tertiary">Default</Text></div>
                        <div style={{
                            width: 80, height: 48, borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-emphasis)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}><Text variant="caption" color="tertiary">Emphasis</Text></div>
                        <div style={{
                            width: 80, height: 48, borderRadius: 'var(--radius-md)',
                            border: '2px solid var(--border-strong)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}><Text variant="caption" color="secondary">Strong</Text></div>
                    </Stack>
                </div>
            </Surface>

            {/* ---- Entity Type Colors ---- */}
            <Surface elevation="flat" radius="lg" padding="lg" bordered>
                <div style={sectionStyle}>
                    <Text variant="heading">Entity Type Colors</Text>
                    <div style={swatchRow}>
                        {swatch('var(--entity-character)', 'Character', 'none')}
                        {swatch('var(--entity-location)', 'Location', 'none')}
                        {swatch('var(--entity-faction)', 'Faction', 'none')}
                        {swatch('var(--entity-session)', 'Session', 'none')}
                        {swatch('var(--entity-note)', 'Note', 'none')}
                    </div>
                </div>
            </Surface>

            {/* ---- Secrets (Gold) ---- */}
            <Surface elevation="flat" radius="lg" padding="lg" bordered>
                <div style={sectionStyle}>
                    <Text variant="heading">Secrets (Gold — GM-only / AI)</Text>
                    <Text variant="body-sm" color="secondary">
                        Gold is reserved exclusively for Secret and Magic elements.
                        It must never appear as a general UI accent.
                    </Text>
                    <div style={{
                        padding: 'var(--space-4)',
                        borderRadius: 'var(--radius-lg)',
                        backgroundColor: 'var(--gold-dim)',
                        border: '1px solid var(--gold)',
                        boxShadow: 'var(--gold-glow)',
                    }}>
                        <Stack gap={2}>
                            <Text variant="caption" style={{ color: 'var(--gold)', letterSpacing: '0.1em' }}>
                                SECRET
                            </Text>
                            <Text variant="body" style={{ color: 'var(--gold)' }}>
                                The ancient artifact hums with forgotten power.
                                Only the GM can see this note.
                            </Text>
                        </Stack>
                    </div>
                    <div style={swatchRow}>
                        {swatch('var(--gold)', 'Gold', 'none')}
                        {swatch('var(--gold-dim)', 'Gold Dim', '1px solid var(--gold)')}
                    </div>
                </div>
            </Surface>

            {/* ---- Reduced Motion Note ---- */}
            <Surface elevation="flat" radius="lg" padding="lg" bordered>
                <div style={sectionStyle}>
                    <Text variant="heading">Reduced Motion</Text>
                    <Text variant="body-sm" color="secondary">
                        When <Text as="span" variant="mono">prefers-reduced-motion: reduce</Text> is
                        active, all animations collapse to near-instant (&lt;1ms) durations.
                        Ceremony bokeh particles are hidden entirely. The spinner shows a
                        static partial-ring instead of rotating. Tooltip enter animations
                        are disabled.
                    </Text>
                </div>
            </Surface>
        </Stack>
    );
}