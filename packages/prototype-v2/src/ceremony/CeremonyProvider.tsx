import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ReactNode,
} from 'react';
import { useReducedMotion } from '@/hooks';
import {
    CeremonyState,
    CeremonyType,
    CeremonyPhase,
    CeremonyTimeline,
    INITIAL_CEREMONY_STATE,
} from './types';
import {
    getTimeline,
    getActivePhase,
    shouldSwitchMode,
} from './timelines';

// ===============================
//          CONTEXT TYPES
// ===============================

interface CeremonyControls {
    /**
     * Trigger a ceremony transition.
     * @param type - Which ceremony to run
     * @param options - Optional callbacks
     */
    triggerCeremony: (
        type: CeremonyType,
        options?: {
            onModeSwitch?: () => void;
            onComplete?: () => void;
        }
    ) => void;

    /**
     * Force-cancel a running ceremony (for edge cases).
     * Immediately resets to idle state.
     */
}

interface CeremonyContextValue {
    /** Current ceremony state */
    state: CeremonyState;
    /** Current timeline being executed (null if idle) */
    timeline: CeremonyTimeline | null;
    /** Whether interactions should be blocked during ceremony */
    isBlocking: boolean;
    /** Whether reduced motion is active */
    reducedMotion: boolean;
    /** Controls for triggering ceremonies */
    controls: CeremonyControls;
}

// ===============================
//              CONTEXT
// ===============================

const CeremonyContext = createContext<CeremonyContextValue | null>(null);

// ===============================
//              PROVIDER
// ===============================

interface CeremonyProviderProps {
    children: ReactNode;
}

export function CeremonyProvider({ children }: CeremonyProviderProps) {
    const reducedMotion = useReducedMotion();

    // Core ceremony state
    const [state, setState] = useState<CeremonyState>(INITIAL_CEREMONY_STATE);
    const [timeline, setTimeline] = useState<CeremonyTimeline | null>(null);

    // Refs for animation loop (avoid stale closures)
    const frameRef = useRef<number | null>(null);
    const previousElapsedRef = useRef<number>(0);
    const callbacksRef = useRef<{
        onModeSwitch?: () => void;
        onComplete?: () => void;
    }>({});

    // -------------------------------
    //          ANIMATION LOOP
    // -------------------------------
    
    const runAnimationLoop = useCallback(
        (startTime: number, activeTimeline: CeremonyTimeline) => {
            const tick = (currentTime: number) => {
                const elapsed = currentTime - startTime;
                const previousElapsed = previousElapsedRef.current;

                // Check if ceremony is complete
                if(elapsed >= activeTimeline.totalDuration) {
                    // Final state update
                    setState((prev) => ({
                        ...prev,
                        status: 'complete',
                        phase: 'idle',
                        progress: 1,
                    }));

                    // Call completion callback
                    callbacksRef.current.onComplete?.();

                    // Reset to idle on next frame
                    requestAnimationFrame(() => {
                        setState(INITIAL_CEREMONY_STATE);
                        setTimeline(null);
                        callbacksRef.current = {};
                    });

                    frameRef.current = null;
                    return;
                }

                // Check if mode should switch at this moment
                if(shouldSwitchMode(activeTimeline, previousElapsed, elapsed)) {
                    callbacksRef.current.onModeSwitch?.();
                }

                // Get current active phase
                const activePhase = getActivePhase(activeTimeline, elapsed);
                const progress = elapsed / activeTimeline.totalDuration;

                // Update state
                setState((prev) => ({
                    ...prev,
                    status: 'running',
                    phase: activePhase?.id ?? prev.phase,
                    progress,
                }));

                // Store for next tick comparison
                previousElapsedRef.current = elapsed;

                // Continue the loop
                frameRef.current = requestAnimationFrame(tick);
            };

            // Start the loop
            frameRef.current = requestAnimationFrame(tick);
        },
        []
    );
    
    // -------------------------------
    //          CONTROLS
    // -------------------------------

    const triggerCeremony = useCallback(
        (
            type: CeremonyType,
            options?: {
                onModeSwitch?: () => void;
                onComplete?: () => void;
            }
        ) => {
            // Ignore if already running a ceremony
            if(state.status === 'running') {
                return;
            }

            // Get timeline (reduced motion substitutes automatically)
            const activeTimeline = getTimeline(type, reducedMotion);

            // STore callbacks
            callbacksRef.current = {
                onModeSwitch: options?.onModeSwitch,
                onComplete: options?.onComplete,
            };

            // Initialize state
            const startTime = performance.now();
            previousElapsedRef.current = 0;

            setState({
                type,
                status: 'running',
                phase: activeTimeline.phases[0]?.id ?? 'idle',
                progress: 0,
                startedAt: startTime,
            });

            setTimeline(activeTimeline);

            // Start animation loop
            runAnimationLoop(startTime, activeTimeline);
        },
        [state.status, reducedMotion, runAnimationLoop]
    );

    const cancelCeremony = useCallback(() => {
        // Cancel any running animation frame
        if(frameRef.current !== null) {
            cancelAnimationFrame(frameRef.current);
            frameRef.current = null;
        }

        // Reset all state
        setState(INITIAL_CEREMONY_STATE);
        setTimeline(null);
        callbacksRef.current = {};
        previousElapsedRef.current = 0;
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (frameRef.current !== null) {
                cancelAnimationFrame(frameRef.current);
            }
        }
    }, []);

    // -------------------------------
    //          CONTEXT VALUE
    // -------------------------------

    const controls = useMemo<CeremonyControls>(
        () => ({ triggerCeremony, cancelCeremony }),
        [triggerCeremony, cancelCeremony]
    );

    // Ceremonies block interactions (except entity creation which is non-blocking)
    const isBlocking = state.status === 'running' && state.type !== CeremonyType.ENTITY_CREATION;

    const value = useMemo<CeremonyContextValue>(
        () => ({
            state,
            timeline,
            isBlocking,
            reducedMotion,
            controls,
        }),
        [state, timeline, isBlocking, reducedMotion, controls]
    );

    return (
        <CeremonyContext.Provider value={value}>
            {children}
        </CeremonyContext.Provider>
    );
}

// ===============================
//              HOOK
// ===============================

/**
 * Access ceremony state and controls.
 * 
 * @example
 * const { state, controls, isBlocking } = useCeremony();
 * 
 * // Trigger prep-to-session ceremony
 * controls.triggerCeremony(CeremonyType.PREP_TO_SESSION, {
 *    onModeSwitch: () => setMode('session'),
 *    onComplete: () => console.log('Done!'),
 * });
 * 
 * // Check if UI should be disabled
 * <Button disabled={isBlocking}>Switch Mode</Button>
 */
export function useCeremony(): CeremonyContextValue {
    const context = useContext(CeremonyContext);

    if(context === null) {
        throw new Error('useCeremony must be used within a Ceremony Provider');
    }

    return context;
}

// ===============================
//         CONVENIENCE HOOKS
// ===============================

/**
 * Get just the ceremony phase (for components that only care about phase).
 */
export function useCeremonyPhase(): CeremonyPhase {
    const { state } = useCeremony();
    return state.phase;
}

/**
 * Get ceremony progress (0-1) for animation interpolation.
 */
export function useCeremonyProgress(): number {
    const { state } = useCeremony();
    return state.progress;
}

/**
 * Check if a ceremony is currently running.
 */
export function useIsCeremonyActive(): boolean {
    const { state } = useCeremony();
    return state.status === 'running';
}