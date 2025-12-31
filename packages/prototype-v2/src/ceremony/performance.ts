/**
   * Performance utilities for ceremony animations.
   *
   * Key principles:
   * 1. Only animate transform and opacity (GPU-accelerated)
   * 2. Apply will-change sparingly and remove after animation
   * 3. Clean up all RAF handles and timers on unmount
   * 4. Batch DOM reads before DOM writes
   * 5. Use passive event listeners where possible
   */

import { useEffect, useRef, useCallback } from 'react';

// ===============================
//          GPU PROPERTIES
// ===============================

/**
 * CSS properties that are GPU-accelerated and safe to animate.
 * Animating anything else (width, height, top, left, etc.) causes reflows.
 */
export const GPU_SAFE_PROPERTIES = [
    'transform',
    'opacity',
    'filter', // GPU-accelerated in modern browsers
] as const;

/**
 * Style object that promotes an element to its own composite layer.
 * Use sparingly—too many layers also hurts performance.
 */
export const GPU_LAYER_STYLES: React.CSSProperties = {
    willChange: 'transform, opacity',
    transform: 'translateZ(0)', // Force GPU layer
    backfaceVisibility: 'hidden', // Optimization hint
};

/**
 * Style object for elements that should NOT have will-change
 * (static elements, or elements that have finished animating).
 */
export const GPU_LAYER_CLEANUP: React.CSSProperties = {
    willChange: 'auto',
    transform: 'none',
};

// ===============================
//     RAF MANAGEMENT HOOK
// ===============================

/**
 * Manages a requestAnimationFrame loop with automatic cleanup.
 * Prevents memory leaks from orphaned animation frames.
 *
 * @example
 * const { start, stop } = useAnimationFrame((elapsed) => {
 *     // Animation logic here
 *     if (elapsed > 1000) stop();
 * });
 */
export function useAnimationFrame(
    callback: (elapsed: number, delta: number) => void,
    deps: React.DependencyList = []
) {
    const rafRef = useRef<number | null>(null);
    const startTimeRef = useRef<number | null>(null);
    const previousTimeRef = useRef<number>(0);
    const isRunningRef = useRef(false);

    const stop = useCallback(() => {
        if (rafRef.current !== null) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        }
        isRunningRef.current = false;
        startTimeRef.current = null;
        previousTimeRef.current = 0;
    }, []);

    const tick = useCallback((currentTime: number) => {
        if (!isRunningRef.current) return;

        if (startTimeRef.current === null) {
            startTimeRef.current = currentTime;
        }

        const elapsed = currentTime - startTimeRef.current;
        const delta = currentTime - previousTimeRef.current;
        previousTimeRef.current = currentTime;

        callback(elapsed, delta);

        if (isRunningRef.current) {
            rafRef.current = requestAnimationFrame(tick);
        }
    }, [callback]);

    const start = useCallback(() => {
        if (isRunningRef.current) return;

        isRunningRef.current = true;
        startTimeRef.current = null;
        previousTimeRef.current = performance.now();
        rafRef.current = requestAnimationFrame(tick);
    }, [tick]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stop();
        };
    }, [stop]);

    // Restart if deps change while running
    useEffect(() => {
        if (isRunningRef.current) {
            stop();
            start();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);

    return { start, stop, isRunning: isRunningRef.current };
}

// ===============================
//     TIMER MANAGEMENT HOOK
// ===============================

/**
 * Manages setTimeout/setInterval with automatic cleanup.
 * Prevents memory leaks from orphaned timers.
 */
export function useManagedTimers() {
    const timeoutsRef = useRef<Set<number>>(new Set());
    const intervalsRef = useRef<Set<number>>(new Set());

    const setTimeout_ = useCallback((fn: () => void, delay: number): number => {
        const id = window.setTimeout(() => {
            timeoutsRef.current.delete(id);
            fn();
        }, delay);
        timeoutsRef.current.add(id);
        return id;
    }, []);

    const setInterval_ = useCallback((fn: () => void, delay: number): number => {
        const id = window.setInterval(fn, delay);
        intervalsRef.current.add(id);
        return id;
    }, []);

    const clearTimeout_ = useCallback((id: number) => {
        window.clearTimeout(id);
        timeoutsRef.current.delete(id);
    }, []);

    const clearInterval_ = useCallback((id: number) => {
        window.clearInterval(id);
        intervalsRef.current.delete(id);
    }, []);

    const clearAll = useCallback(() => {
        timeoutsRef.current.forEach((id) => window.clearTimeout(id));
        intervalsRef.current.forEach((id) => window.clearInterval(id));
        timeoutsRef.current.clear();
        intervalsRef.current.clear();
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            clearAll();
        };
    }, [clearAll]);

    return {
        setTimeout: setTimeout_,
        setInterval: setInterval_,
        clearTimeout: clearTimeout_,
        clearInterval: clearInterval_,
        clearAll,
    };
}

// ===============================
//     WILL-CHANGE MANAGER
// ===============================

/**
 * Applies will-change before animation starts and removes it after.
 * Prevents permanent GPU memory allocation.
 */
export function useWillChange(
    ref: React.RefObject<HTMLElement>,
    properties: string = 'transform, opacity'
) {
    const apply = useCallback(() => {
        if (ref.current) {
            ref.current.style.willChange = properties;
        }
    }, [ref, properties]);

    const remove = useCallback(() => {
        if (ref.current) {
            ref.current.style.willChange = 'auto';
        }
    }, [ref]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            remove();
        };
    }, [remove]);

    return { apply, remove };
}

// ===============================
//     PERFORMANCE MONITORING
// ===============================

/**
 * Development-only performance monitoring.
 * Logs warnings if frame budget is exceeded.
 */
export function useFrameMonitor(enabled: boolean = import.meta.env.DEV) {
    const frameTimesRef = useRef<number[]>([]);
    const lastFrameRef = useRef<number>(performance.now());

    const recordFrame = useCallback(() => {
        if (!enabled) return;

        const now = performance.now();
        const frameTime = now - lastFrameRef.current;
        lastFrameRef.current = now;

        frameTimesRef.current.push(frameTime);

        // Keep last 60 frames
        if (frameTimesRef.current.length > 60) {
            frameTimesRef.current.shift();
        }

        // Warn if frame took too long (> 16.67ms for 60fps)
        if (frameTime > 20) {
            console.warn(`[Ceremony] Slow frame: ${frameTime.toFixed(2)}ms`);
        }
    }, [enabled]);

    const getStats = useCallback(() => {
        const times = frameTimesRef.current;
        if (times.length === 0) return null;

        const avg = times.reduce((a, b) => a + b, 0) / times.length;
        const max = Math.max(...times);
        const min = Math.min(...times);
        const fps = 1000 / avg;

        return { avg, max, min, fps, frames: times.length };
    }, []);

    const reset = useCallback(() => {
        frameTimesRef.current = [];
        lastFrameRef.current = performance.now();
    }, []);

    return { recordFrame, getStats, reset };
}

// ===============================
//     BATCHED DOM OPERATIONS
// ===============================

/**
 * Batches multiple DOM reads together, then DOM writes.
 * Prevents layout thrashing (read-write-read-write pattern).
 *
 * @example
 * batchDOMOperations(
 *     () => {
 *         // All reads first
 *         const rect = element.getBoundingClientRect();
 *         return rect;
 *     },
 *     (rect) => {
 *         // Then writes
 *         element.style.transform = `translate(${rect.x}px, ${rect.y}px)`;
 *     }
 * );
 */
export function batchDOMOperations<T>(
    read: () => T,
    write: (data: T) => void
): void {
    // Force layout read
    const data = read();

    // Schedule write for next frame to batch with other writes
    requestAnimationFrame(() => {
        write(data);
    });
}

// ===============================
//     COMPONENT OPTIMIZATION
// ===============================

/**
 * Style object for ceremony container.
 * Isolates ceremony from main document reflows.
 */
export const CEREMONY_CONTAINER_STYLES: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    pointerEvents: 'none',
    zIndex: 9999,
    // Contain layout and paint to prevent affecting rest of page
    contain: 'layout paint',
    // Isolate stacking context
    isolation: 'isolate',
};

/**
 * Default animated element styles.
 * Apply to any element that will be animated.
 */
export const ANIMATED_ELEMENT_STYLES: React.CSSProperties = {
    willChange: 'transform, opacity',
    transform: 'translateZ(0)',
    // Prevent subpixel rendering issues
    WebkitFontSmoothing: 'antialiased',
};