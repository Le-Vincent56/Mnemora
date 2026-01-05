import {
    useState,
    useRef,
    useEffect,
    useCallback,
    cloneElement,
    type ReactNode,
    type ReactElement,
} from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/utils';
import styles from './primitives.module.css';

export interface TooltipProps {
    /** Content to display in the tooltip */
    content: ReactNode;
    /** Trigger element (must accept ref and event handlers) */
    children: ReactElement;
    /** Preferred position relative to trigger */
    side?: 'top' | 'bottom' | 'left' | 'right';
    /** Delay before showing tooltip in milliseconds */
    delayDuration?: number;
}

type ResolvedSide = 'top' | 'bottom' | 'left' | 'right';

interface Position {
    top: number;
    left: number;
    side: ResolvedSide;
}

const OFFSET = 8; // Gap between trigger and tooltip
const VIEWPORT_PADDING = 8;

/**
 * Contextual information displayed on hover and focus.
 * Pure React implementation with keyboard accessibility.
 *
 * Features:
 * - Delayed appearance to prevent flicker
 * - Viewport-aware positioning with automatic flipping
 * - "Memory surfacing" entrance animation
 * - Reduced motion support
 *
 * @example
 * <Tooltip content="Create new character" side="bottom">
 *   <Button iconOnly><Icon icon={Plus} /></Button>
 * </Tooltip>
 */
export function Tooltip({
    content,
    children,
    side = 'top',
    delayDuration = 300,
}: TooltipProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [position, setPosition] = useState<Position | null>(null);
    const [isExiting, setIsExiting] = useState(false);

    const triggerRef = useRef<HTMLElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const showTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
    const hideTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

    const calculatePosition = useCallback((): Position | null => {
        if (!triggerRef.current || !tooltipRef.current) return null;

        const triggerRect = triggerRef.current.getBoundingClientRect();
        const tooltipRect = tooltipRef.current.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        // Calculate position for each side
        const positions: Record<ResolvedSide, { top: number; left: number }> = {
            top: {
                top: triggerRect.top - tooltipRect.height - OFFSET,
                left: triggerRect.left + (triggerRect.width - tooltipRect.width) / 2,
            },
            bottom: {
                top: triggerRect.bottom + OFFSET,
                left: triggerRect.left + (triggerRect.width - tooltipRect.width) / 2,
            },
            left: {
                top: triggerRect.top + (triggerRect.height - tooltipRect.height) / 2,
                left: triggerRect.left - tooltipRect.width - OFFSET,
            },
            right: {
                top: triggerRect.top + (triggerRect.height - tooltipRect.height) / 2,
                left: triggerRect.right + OFFSET,
            },
        };

        // Check if preferred side fits in viewport
        const fitsInViewport = (s: ResolvedSide): boolean => {
            const pos = positions[s];
            return (
                pos.top >= VIEWPORT_PADDING &&
                pos.left >= VIEWPORT_PADDING &&
                pos.top + tooltipRect.height <= viewportHeight - VIEWPORT_PADDING &&
                pos.left + tooltipRect.width <= viewportWidth - VIEWPORT_PADDING
            );
        };

        // Determine the opposite side for flipping
        const oppositeSide: Record<ResolvedSide, ResolvedSide> = {
            top: 'bottom',
            bottom: 'top',
            left: 'right',
            right: 'left',
        };

        // Try preferred side, then opposite, then others
        let resolvedSide: ResolvedSide = side;
        if (!fitsInViewport(side)) {
            if (fitsInViewport(oppositeSide[side])) {
                resolvedSide = oppositeSide[side];
            } else {
                // Try all sides
                const allSides: ResolvedSide[] = ['top', 'bottom', 'left', 'right'];
                for (const s of allSides) {
                    if (fitsInViewport(s)) {
                        resolvedSide = s;
                        break;
                    }
                }
            }
        }

        let { top, left } = positions[resolvedSide];

        // Clamp to viewport bounds
        left = Math.max(
            VIEWPORT_PADDING,
            Math.min(left, viewportWidth - tooltipRect.width - VIEWPORT_PADDING)
        );
        top = Math.max(
            VIEWPORT_PADDING,
            Math.min(top, viewportHeight - tooltipRect.height - VIEWPORT_PADDING)
        );

        return { top: top + window.scrollY, left: left + window.scrollX, side: resolvedSide };
    }, [side]);

    const show = useCallback(() => {
        clearTimeout(hideTimeoutRef.current);
        setIsExiting(false);

        showTimeoutRef.current = setTimeout(() => {
            setIsVisible(true);
        }, delayDuration);
    }, [delayDuration]);

    const hide = useCallback(() => {
        clearTimeout(showTimeoutRef.current);

        // Brief exit animation delay
        setIsExiting(true);
        hideTimeoutRef.current = setTimeout(() => {
            setIsVisible(false);
            setIsExiting(false);
            setPosition(null);
        }, 100);
    }, []);

    // Update position when tooltip becomes visible
    useEffect(() => {
        if (isVisible && tooltipRef.current) {
            // Use requestAnimationFrame to ensure tooltip is rendered before measuring
            const rafId = requestAnimationFrame(() => {
                const pos = calculatePosition();
                setPosition(pos);
            });
            return () => cancelAnimationFrame(rafId);
        }
    }, [isVisible, calculatePosition]);

    // Cleanup timeouts on unmount
    useEffect(() => {
        return () => {
            clearTimeout(showTimeoutRef.current);
            clearTimeout(hideTimeoutRef.current);
        };
    }, []);

    // Clone child with event handlers and ref
    const trigger = cloneElement(children, {
        ref: triggerRef,
        onMouseEnter: (e: MouseEvent) => {
            show();
            children.props.onMouseEnter?.(e);
        },
        onMouseLeave: (e: MouseEvent) => {
            hide();
            children.props.onMouseLeave?.(e);
        },
        onFocus: (e: FocusEvent) => {
            show();
            children.props.onFocus?.(e);
        },
        onBlur: (e: FocusEvent) => {
            hide();
            children.props.onBlur?.(e);
        },
    });

    const tooltip = isVisible
        ? createPortal(
              <div
                  ref={tooltipRef}
                  role="tooltip"
                  className={cn(
                      styles.tooltip,
                      position && styles[`tooltip-${position.side}`],
                      isExiting && styles.tooltipExiting
                  )}
                  style={
                      position
                          ? {
                                top: position.top,
                                left: position.left,
                            }
                          : {
                                // Initially render off-screen to measure
                                visibility: 'hidden',
                                position: 'fixed',
                                top: 0,
                                left: 0,
                            }
                  }
              >
                  <span className={styles.tooltipContent}>{content}</span>
                  <span className={styles.tooltipArrow} />
              </div>,
              document.body
          )
        : null;

    return (
        <>
            {trigger}
            {tooltip}
        </>
    );
}
