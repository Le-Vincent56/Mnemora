// Creative prompts for different entity types and fields
export const primers: Record<string, string[]> = {
    'character.description': [
        'What memory do they try to forget?',
        'What do they see when they close their eyes?',
        'What promise have they never broken?',
        'What truth do they refuse to accept?',
        'What small joy keeps them going?',
        'Whose voice do they hear in their dreams?',
    ],
    'character.secrets': [
        'What do they hide from those closest to them?',
        'What would destroy them if it came to light?',
        'What forbidden knowledge do they possess?',
        'Who knows their darkest truth?',
    ],
    'location.description': [
        'What sound echoes through this place at night?',
        'What memory lingers in the walls?',
        'What do visitors notice first?',
        'What story does this place tell in silence?',
    ],
    'location.secrets': [
        'What lies hidden beneath the surface?',
        'What happened here that no one speaks of?',
        'What treasure awaits the observant eye?',
    ],
    'faction.description': [
        'What binds these people together?',
        'What do outsiders misunderstand about them?',
        'What ritual marks their gatherings?',
    ],
    'faction.secrets': [
        'What truth would tear them apart?',
        'What do the inner circle know?',
        'What price did they pay for power?',
    ],
    'default': [
        'What makes this unique in your world?',
        'What story wants to be told here?',
        'What detail brings this to life?',
    ],
};

export function getRandomPrimer(entityType: string, field: string): string {
    const key = `${entityType}.${field}`;
    const options = primers[key] || primers['default'];
    return options[Math.floor(Math.random() * options.length)];
}

export function getNextPrimer(entityType: string, field: string, currentPrimer: string): string {
    const key = `${entityType}.${field}`;
    const options = primers[key] || primers['default'];
    const currentIndex = options.indexOf(currentPrimer);
    const nextIndex = (currentIndex + 1) % options.length;
    return options[nextIndex];
}