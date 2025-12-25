import { useState, useEffect } from "react";

/**
 * Hook to detect user's reduced motion preference.
 * 
 * Returns `true` if the user has requested reduced motion via:
 * - System settings (macOS: Accessibility -> Display -> Reduce motion)
 * - Browser settings
 * 
 * @example
 * const reducedMotion = useReducedMotion();
 * 
 * // Skip animation entirely
 * if(reducedMotion) {
 *    return <div>{children}</div>
 * }
 * 
 * // Or use simpler animation
 * const duration = reducedMotion ? 0 : TIMING.gentle;
 */
export function useReducedMotion(): boolean {
    const[reducedMotion, setReducedMotion] = useState(() => {
        // SSR safety: check if window exists
        if(typeof window === 'undefined') return false;

        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    });

    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

        // Update state when preference changes
        const handleChange = (event: MediaQueryListEvent) => {
            setReducedMotion(event.matches);
        }

        // Modern browsers
        mediaQuery.addEventListener('change', handleChange);

        return () => {
            mediaQuery.removeEventListener('change', handleChange);
        };
    }, []);

    return reducedMotion;
}