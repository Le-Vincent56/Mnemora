import { EntityType } from '../entities/EntityType';

/**
 * Primer prompts for each entity type and field.
 * Multiple prompts per field provide variety and different angles to inspire the GM.
 * These are shown when the GM hesitates on an empty field.
 */
export const PRIMER_PROMPTS: Record<EntityType, Record<string, readonly string[]>> = {
    [EntityType.CHARACTER]: {
        description: [
            "Who is this character in your world?",
            "What's their story in a nutshell?",
            "How would an NPC describe them to a stranger?",
            "What role do they play in your campaign?",
            "Sum them up in a few sentences.",
        ],
        appearance: [
            "How would you describe their look?",
            "What do players notice first about them?",
            "Paint a picture of how they present themselves.",
            "What details make them visually memorable?",
            "Describe them as if setting a scene.",
        ],
        personality: [
            "What are their key traits and mannerisms?",
            "How do they act under pressure?",
            "What's their general vibe or demeanor?",
            "What would their friends say about them?",
            "Three words that capture their personality?",
            "What makes them likable or unlikable?",
        ],
        motivation: [
            "What drives them? What do they want?",
            "What would they sacrifice everything for?",
            "What keeps them up at night?",
            "What's their deepest desire or fear?",
            "What goal shapes their decisions?",
            "What are they running toward or away from?",
        ],
        voiceMannerisms: [
            "How do you roleplay them at the table?",
            "What accent, tone, or speech patterns do they have?",
            "What gestures or habits define them?",
            "What catchphrases or verbal tics do they use?",
            "How would you voice them in a scene?",
            "What makes them distinct when speaking?",
        ],
    },
    [EntityType.LOCATION]: {
        description: [
            "What is this place? Why does it matter?",
            "What's the story of this location?",
            "Why would adventurers come here?",
            "What role does this place play in your world?",
            "Summarize this location's importance.",
        ],
        appearance: [
            "What do visitors first notice? Sights, sounds, smells?",
            "Describe the scene as players approach.",
            "What sensory details bring this place to life?",
            "Paint a picture of arriving here.",
            "What makes this place visually distinct?",
            "Close your eyes and describe what you see.",
        ],
        atmosphere: [
            "What's the mood here? How does it feel?",
            "What emotions does this place evoke?",
            "Is it welcoming, threatening, mysterious?",
            "How do people behave in this space?",
            "What's the energy like here?",
            "What feeling should players have when they arrive?",
        ],
        notableFeatures: [
            "What stands out? Key points of interest?",
            "What would players want to investigate?",
            "What landmarks or features define this place?",
            "What secrets might this location hold?",
            "What's interactive or explorable here?",
            "What details would reward a curious player?",
        ],
    },
    [EntityType.FACTION]: {
        description: [
            "Who are they? What role do they play in your world?",
            "Summarize this group in a sentence or two.",
            "What would a common person know about them?",
            "How would they introduce themselves?",
            "What's their reputation in the world?",
        ],
        ideology: [
            "What do they believe? What principles guide them?",
            "What's their motto or creed?",
            "What values unite their members?",
            "What do they consider right and wrong?",
            "What philosophy drives their actions?",
            "What would they die defending?",
        ],
        goals: [
            "What are they working toward? Short and long term?",
            "What does success look like for them?",
            "What plans are they actively pursuing?",
            "What would they do with unlimited power?",
            "What obstacles stand in their way?",
            "What's their ultimate ambition?",
        ],
        resources: [
            "What do they have? People, money, territory, influence?",
            "What assets can they bring to bear?",
            "What makes them powerful or weak?",
            "Who are their key members or allies?",
            "What's their economic or military strength?",
            "What resources are they known for?",
        ],
        structure: [
            "How are they organized? Who leads them?",
            "What's the chain of command?",
            "How do members rise through ranks?",
            "Is it hierarchical, democratic, or chaotic?",
            "Who are the key figures?",
            "How do they make decisions?",
        ],
    },
    [EntityType.NOTE]: {
        content: [
            "What do you need to remember?",
            "Capture the thought before it escapes.",
            "What's the key idea here?",
            "What should future-you know about this?",
            "Jot down the essentials.",
        ],
    },
    [EntityType.SESSION]: {
        prepNotes: [
            "What do you need to prepare for this session?",
            "What scenes or encounters are you planning?",
            "What threads might the players pull on?",
            "What NPCs might appear?",
            "What's your plan if things go sideways?",
            "What do you want to accomplish this session?",
        ],
    },
    [EntityType.EVENT]: {
        description: [
            "What happened in this event?",
            "Summarize what took place.",
            "What's the key moment here?",
            "Describe the event from a narrator's perspective.",
            "What made this event significant?",
        ],
        secrets: [
            "What's hidden beneath the surface of this event?",
            "What do the players not know yet?",
            "What behind-the-scenes forces shaped this?",
            "What secrets does this event conceal?",
        ],
    },
} as const;

/**
 * Gets a random primer prompt for a specific entity type and field.
 * Returns an empty string if the field doesn't have prompts defined.
 */
export function getRandomPrimerPrompt(entityType: string, field: string): string {
    const typePrompts = PRIMER_PROMPTS[entityType as EntityType];
    if (!typePrompts) {
        return '';
    }
    const fieldPrompts = typePrompts[field];
    if (!fieldPrompts || fieldPrompts.length === 0) {
        return '';
    }
    const randomIndex = Math.floor(Math.random() * fieldPrompts.length);
    return fieldPrompts[randomIndex] ?? '';
}

/**
 * Gets the first (default) primer prompt for a specific entity type and field.
 * Returns an empty string if the field doesn't have prompts defined.
 */
export function getPrimerPrompt(entityType: string, field: string): string {
    const typePrompts = PRIMER_PROMPTS[entityType as EntityType];
    if (!typePrompts) {
        return '';
    }
    const fieldPrompts = typePrompts[field];
    if (!fieldPrompts || fieldPrompts.length === 0) {
        return '';
    }
    return fieldPrompts[0] ?? '';
}

/**
 * Gets all primer prompts for a specific entity type and field.
 * Returns an empty array if the field doesn't have prompts defined.
 */
export function getAllPrimerPrompts(entityType: string, field: string): readonly string[] {
    const typePrompts = PRIMER_PROMPTS[entityType as EntityType];
    if (!typePrompts) {
        return [];
    }
    return typePrompts[field] ?? [];
}

/**
 * Gets all primer prompts for a specific entity type.
 * Returns an empty object if the entity type is not recognized.
 */
export function getPrimerPromptsForType(entityType: string): Record<string, readonly string[]> {
    return PRIMER_PROMPTS[entityType as EntityType] ?? {};
}

/**
 * Gets the count of available prompts for a specific field.
 */
export function getPrimerPromptCount(entityType: string, field: string): number {
    const prompts = getAllPrimerPrompts(entityType, field);
    return prompts.length;
}
