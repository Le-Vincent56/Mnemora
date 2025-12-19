export const TIMING = {
    fast: 150,          // Micro-interactions: buttons, toggles, small feedback
    normal: 200,        // Standard transitions: page changes, modals, cards
    gentle: 300,        // Gentle reveals: primers, subtle animations, fades
    stagger: 50,        // Per-item delay in staggered list animations
    flash: 100,         // Brief flash/pulse for successful save feedback
    primerDelay: 4000,   // Hesitation delay before showing primer hints
} as const;

export const EASING = {
    standard: [0.4, 0, 0.2, 1] as const,    // Material Design standard curve (natural feel for most animations)
    enter: [0, 0, 0.2, 1] as const,         // Decelerate curve (elements entering the screen)
    exit: [0.4, 0, 1, 1] as const,          // Accelerate curve (elements leaving the screen)
    sharp: [0.4, 0, 0.6, 1] as const,        // Sharp curve (for elements that need to feel snappy)
} as const;

export const ANIMATION_PRESETS = {
    pageTransition: {
        duration: TIMING.normal,
        easing: EASING.standard,
    },
    modal: {
        duration: TIMING.fast,
        easing: EASING.standard,
    },
    searchResults: {
        duration: TIMING.fast,
        staggerDelay: TIMING.stagger,
        easing: EASING.enter,
    },
    cardExpand: {
        duation: TIMING.normal,
        easing: EASING.standard,
    },
    primer: {
        duration: TIMING.gentle,
        easing: EASING.enter,
    },
    shake: {
        duration: TIMING.normal,
        easing: EASING.sharp,
    },
    saveSuccess: {
        duration: TIMING.flash,
        easing: EASING.standard,
    },
    tooltip: {
        duration: TIMING.fast,
        easing: EASING.enter,
    },
    dropdown: {
        duration: TIMING.fast,
        easing: EASING.standard,
    },
} as const;

export type TimingKey = keyof typeof TIMING;
export type EasingKey = keyof typeof EASING;
export type AnimationPresetKey = keyof typeof ANIMATION_PRESETS;