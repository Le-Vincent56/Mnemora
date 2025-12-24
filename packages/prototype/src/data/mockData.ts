export type EntityType = 'character' | 'location' | 'faction' | 'session' | 'note';

export interface Entity {
    id: string;
    type: EntityType;
    name: string;
    description: string;
    secrets?: string;
    tags: string[];
    connections: Array<{
        id: string;
        name: string;
        type: EntityType;
    }>;
    createdAt: string;
    modifiedAt: string;
    typeSpecificFields?: Record<string, string>;
}

// "The Sundered Realm" demo world (from ui-prototype.md)
export const mockEntities: Entity[] = [
    {
        id: 'char-1',
        type: 'character',
        name: 'Grimnak',
        description: 'A gruff but kind-hearted dwarven bartender who runs The Rusty Anchor tavern in the port district of Aenium. Former adventurer, now retired. Has a soft spot for young heroes.',
        secrets: 'Keeps a magic sword (Oathbreaker) hidden beneath the bar. Was once a member of the Ashen Circle before faking his death.',
        tags: ['ally', 'tavern', 'dwarf', 'retired-adventurer'],
        connections: [
            { id: 'loc-1', name: 'The Rusty Anchor', type: 'location' },
            { id: 'fac-2', name: 'The Ashen Circle', type: 'faction' },
            { id: 'char-2', name: 'Elara Moonwhisper', type: 'character' },
        ],
        createdAt: '2025-12-15T10:00:00Z',
        modifiedAt: '2025-12-19T14:30:00Z',
        typeSpecificFields: {
            appearance: 'Stocky dwarven build, braided gray beard, missing right eye',
            personality: 'Gruff exterior hiding a warm heart. Protective of young adventurers.',
            motivation: 'Seeking redemption for past sins. Wants to prevent others from making his mistakes.',
            voiceMannerisms: 'Deep gravelly voice. Says "lad" and "lass" frequently. Tugs at beard when thinking.',
        },
    },
    {
        id: 'char-2',
        type: 'character',
        name: 'Elara Moonwhisper',
        description: 'An elven sage and keeper of the Grove of Whispers. Ancient by human standards, she speaks in riddles but offers true guidance to those who listen.',
        secrets: 'She is the last surviving member of the original Circle of Mages. She knows the location of the Sundering Stone.',
        tags: ['ally', 'magic', 'elf', 'sage'],
        connections: [
            { id: 'loc-2', name: 'Grove of Whispers', type: 'location' },
            { id: 'char-1', name: 'Grimnak', type: 'character' },
        ],
        createdAt: '2025-12-14T09:00:00Z',
        modifiedAt: '2025-12-18T11:00:00Z',
    },
    {
        id: 'char-3',
        type: 'character',
        name: 'Lord Varen Blackwood',
        description: 'The ambitious and cunning lord of the Blackwood estates. Publicly a patron of the arts, privately he seeks forbidden power.',
        secrets: 'He has made a pact with an entity from beyond the veil. His left eye sees into the spirit realm.',
        tags: ['villain', 'noble', 'human', 'patron'],
        connections: [
            { id: 'fac-1', name: 'The Merchant Guild', type: 'faction' },
            { id: 'loc-3', name: 'Blackwood Manor', type: 'location' },
        ],
        createdAt: '2025-12-10T08:00:00Z',
        modifiedAt: '2025-12-17T16:00:00Z',
    },
    {
        id: 'loc-1',
        type: 'location',
        name: 'The Rusty Anchor',
        description: 'A weathered tavern on the docks of Aenium, known for strong ale and stronger stories. The walls are covered with maritime trophies and the bar is carved from a single shipwreck beam.',
        secrets: 'The cellar connects to the old smuggling tunnels beneath the city.',
        tags: ['tavern', 'port', 'social'],
        connections: [
            { id: 'char-1', name: 'Grimnak', type: 'character' },
            { id: 'loc-4', name: 'Aenium City', type: 'location' },
        ],
        createdAt: '2025-12-12T10:00:00Z',
        modifiedAt: '2025-12-19T09:00:00Z',
    },
    {
        id: 'loc-2',
        type: 'location',
        name: 'Grove of Whispers',
        description: 'An ancient forest clearing where the trees seem to speak in the wind. Sacred to the old elven ways, it is tended by Elara Moonwhisper.',
        tags: ['forest', 'sacred', 'magic'],
        connections: [
            { id: 'char-2', name: 'Elara Moonwhisper', type: 'character' },
        ],
        createdAt: '2025-12-11T12:00:00Z',
        modifiedAt: '2025-12-16T14:00:00Z',
    },
    {
        id: 'loc-3',
        type: 'location',
        name: 'Blackwood Manor',
        description: 'A grand estate on the outskirts of the city, surrounded by ancient oak trees. The manor has stood for three centuries and holds many secrets.',
        secrets: 'A hidden ritual chamber exists beneath the west wing, accessible through the library.',
        tags: ['noble', 'estate', 'secrets'],
        connections: [
            { id: 'char-3', name: 'Lord Varen Blackwood', type: 'character' },
        ],
        createdAt: '2025-12-09T11:00:00Z',
        modifiedAt: '2025-12-15T10:00:00Z',
    },
    {
        id: 'loc-4',
        type: 'location',
        name: 'Aenium City',
        description: 'The greatest port city of the Sundered Coast. A melting pot of cultures, commerce, and intrigue. The city is ruled by a council of merchant lords.',
        tags: ['city', 'port', 'hub'],
        connections: [
            { id: 'loc-1', name: 'The Rusty Anchor', type: 'location' },
            { id: 'fac-1', name: 'The Merchant Guild', type: 'faction' },
        ],
        createdAt: '2025-12-08T10:00:00Z',
        modifiedAt: '2025-12-14T12:00:00Z',
    },
    {
        id: 'fac-1',
        type: 'faction',
        name: 'The Merchant Guild',
        description: 'The most powerful economic force in the Sundered Realm. They control trade routes and have influence in every major city.',
        secrets: 'The Guild Master answers to a council of three who have never been seen in public.',
        tags: ['trade', 'politics', 'wealthy'],
        connections: [
            { id: 'char-3', name: 'Lord Varen Blackwood', type: 'character' },
            { id: 'loc-4', name: 'Aenium City', type: 'location' },
        ],
        createdAt: '2025-12-07T09:00:00Z',
        modifiedAt: '2025-12-13T11:00:00Z',
    },
    {
        id: 'fac-2',
        type: 'faction',
        name: 'The Ashen Circle',
        description: 'A secretive order of former adventurers who have sworn to protect the realm from threats beyond mortal understanding.',
        secrets: 'They possess fragments of the Sundering Stone and guard them separately.',
        tags: ['secret', 'protectors', 'magic'],
        connections: [
            { id: 'char-1', name: 'Grimnak', type: 'character' },
        ],
        createdAt: '2025-12-06T08:00:00Z',
        modifiedAt: '2025-12-12T10:00:00Z',
    },
    {
        id: 'sess-1',
        type: 'session',
        name: 'Session 8: The Betrayal',
        description: "The party discovered Lord Varen's true intentions when they found the ritual chamber beneath Blackwood Manor.",
        tags: ['session', 'climax'],
        connections: [
            { id: 'char-3', name: 'Lord Varen Blackwood', type: 'character' },
            { id: 'loc-3', name: 'Blackwood Manor', type: 'location' },
        ],
        createdAt: '2025-12-18T19:00:00Z',
        modifiedAt: '2025-12-18T23:00:00Z',
    },
];

// Helper to search entities
export function searchEntities(query: string): Entity[] {
    const lowerQuery = query.toLowerCase();
    return mockEntities.filter(e =>
        e.name.toLowerCase().includes(lowerQuery) ||
        e.description.toLowerCase().includes(lowerQuery) ||
        e.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
}

// --- Mutation Helpers (for prototype only) ---

// Make entities mutable for the prototype
let entities = [...mockEntities];

// Get all entities (use this instead of mockEntities directly)
export function getAllEntities(): Entity[] {
    return entities;
}

// Get all unique tags across all entities
export function getAllTags(): string[] {
    const tagSet = new Set<string>();
    entities.forEach(entity => {
        entity.tags.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
}

// Update an entity
export function updateEntity(id: string, updates: Partial<Entity>): Entity | null {
    const index = entities.findIndex(e => e.id === id);
    if (index === -1) return null;

    entities[index] = {
        ...entities[index],
        ...updates,
        modifiedAt: new Date().toISOString(),
    };

    return entities[index];
}

// Create a new entity
export function createEntity(type: EntityType, name: string = 'Untitled'): Entity {
    const newEntity: Entity = {
        id: `${type}-${Date.now()}`,
        type,
        name,
        description: '',
        secrets: undefined,
        tags: [],
        connections: [],
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
    };

    entities = [newEntity, ...entities];
    return newEntity;
}

// Delete an entity
export function deleteEntity(id: string): boolean {
    const index = entities.findIndex(e => e.id === id);
    if (index === -1) return false;

    // Also remove this entity from all connections
    entities.forEach(entity => {
        entity.connections = entity.connections.filter(conn => conn.id !== id);
    });

    entities.splice(index, 1);
    return true;
}

// Update getEntityByID to use mutable entities
export function getEntityByID(id: string): Entity | undefined {
    return entities.find(e => e.id === id);
}