export const PROTOTYPE_WORLD = {
    id: 'world-brindlemark',
    name: 'Brindlemark',
} as const;

export const PROTOTYPE_CAMPAIGN = {
    id: 'campaign-shattered-oath',
    name: 'The Shattered Oath',
    worldID: PROTOTYPE_WORLD.id,
} as const

export const SESSION_RUN_STORAGE_KEY = "mnemora:prototype-v2:session-run:v1" as const;

export const SESSION_NOTES_STORAGE_KEY = "mnemora:prototype-v2:session-notes:v1" as const;
