// Provider and hooks
export { 
    CeremonyProvider,
    useCeremony,
    useCeremonyPhase,
    useCeremonyProgress,
    useIsCeremonyActive
} from './CeremonyProvider';

// Overlay
export { CeremonyOverlay } from './CeremonyOverlay';
export { ParticleField } from './BokehParticle';

// Particle utilities
export {
    BokehParticle,
    generateBokehParticles,
    useBokehParticles
} from './BokehParticle';

// Timeline utilities
export {
    getTimeline,
    getActivePhase,
    shouldSwitchMode,
    getPhaseProgress
} from './timelines';

// Constants
export {
    CeremonyType,
    BOKEH_COLORS,
    INITIAL_CEREMONY_STATE
} from './types';

// Types
export type {
    CeremonyState,
    CeremonyStatus,
    CeremonyPhase,
    CeremonyConfig,
    CeremonyTimeline,
    TimelinePhase,
    AnimationTarget,
    AnimationKeyframes,
    BokehConfig,
    BokehParticleData,
    BokehColor,
    CeremonyAction,
} from './types';