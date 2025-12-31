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
import { EASING } from '@/tokens';

type Mode = 'prep' | 'session';
type PrepView = 'world' | 'entities' | 'search' | 'history';
type SessionView = 'quick-ref' | 'notes' | 'safety';

/**
 * Content transition variants for mode switches.
 * Uses the "memory surfacing" pattern - content rises from below
 */
const contentVariants = {
    initial: {
        opacity: 0,
        y: 20,
        scale: 0.98,
    },
    animate: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            duration: 0.35,
            ease: EASING.memory,
        },
    },
    exit: {
        opacity: 0,
        y: -10,
        transition: {
            duration: 0.2,
            ease: EASING.out,
        },
    },
};

// ===============================
//          MAIN COMPONENT
// ===============================

export function App() {
    const [mode, setMode] = useState<Mode>('prep');
    const [prepView, setPrepView] = useState<PrepView>('entities');
    const [sessionView, setSessionView] = useState<SessionView>('quick-ref');
    const [sessionTime, setSessionTime] = useState('0:00');
    const reducedMotion = useReducedMotion();
    const { state, controls, isBlocking } = useCeremony();

    // -----------------------------------------
    //      MODE & DOCUMENT SYNC
    // -----------------------------------------

    // Sync data-mode attribute on <html>
    useEffect(() => {
        document.documentElement.setAttribute('data-mode', mode);
    }, [mode]);

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
        const ceremonyType = mode === 'prep'
            ? CeremonyType.PREP_TO_SESSION
            : CeremonyType.SESSION_TO_PREP;

        controls.triggerCeremony(ceremonyType, {
            onModeSwitch: () => {
                setMode(mode === 'prep' ? 'session' : 'prep');
            },
            onComplete: () => {
                console.log(`Ceremony complete: now in ${mode === 'prep' ? 'session' : 'prep'} mode`);
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
            >
                <AnimatePresence mode="wait">
                    {mode === 'prep' ? (
                        <motion.div
                            key="prep-content"
                            variants={contentVariants}
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
                    ) : (
                        <motion.div
                            key="session-content"
                            variants={contentVariants}
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
        world: {
            title: 'World',
            subtitle: 'Campaign and world settings'
        },
        entities: {
            title: 'Entities',
            subtitle: 'Characters, locations, factions, and more'
        },
        search: {
            title: 'Search',
            subtitle: 'Find anything in your world'
        },
        history: {
            title: 'Session History',
            subtitle: 'Past sessions and notes'
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
                            Cool tones engaged • Gameplay focus
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
                        The interface shifts to cool tones for focused gameplay.
                    </Text>
                </Stack>
            </Surface>
        </Stack>
    );
}