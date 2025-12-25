/**
 * Design token exports for JavaScript/TypeScript consumption.
 * 
 * CSS tokens live in globals.css and are consumed via var(--token-name).
 * These JS exports are for Framer Motion and other JS-based styling.
 */

export { TIMING, toSeconds, type TimingKey } from './timing';
export { 
    EASING, 
    SPRING, 
    type EasingTuple, 
    type EasingKey, 
    type SpringKey 
} from './easing';