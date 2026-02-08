import type { LucideIcon } from 'lucide-react';
import { User, MapPin, Shield, StickyNote } from 'lucide-react';

// -----------------------------------------------
//  Types
// -----------------------------------------------

export type EntityType = 'character' | 'location' | 'faction' | 'note';

export type EntityBlockType = 'text' | 'heading' | 'checklist' | 'divider' | 'secret';

export interface EntityBlock {
  id: string;
  type: EntityBlockType;
  content: string;
  checked?: boolean;
}

export interface Entity {
  id: string;
  type: EntityType;
  name: string;
  description: string;
  secrets?: string;
  tags: string[];
  connections: Array<{ id: string; name: string; type: EntityType }>;
  blocks: EntityBlock[];
  createdAt: string;
  modifiedAt: string;
  typeSpecificFields?: Record<string, string>;
}

export type SortOption = 'recent' | 'name' | 'created' | 'type';

/** Map entity types to their Lucide icon */
export const ENTITY_ICONS: Record<EntityType, LucideIcon> = {
  character: User,
  location: MapPin,
  faction: Shield,
  note: StickyNote,
};

// -----------------------------------------------
//  Mock Data
// -----------------------------------------------

const MOCK_ENTITIES: Entity[] = [
  {
    id: 'char-1',
    type: 'character',
    name: 'Theron Ashvale',
    description: 'A retired soldier turned innkeeper who still hears the war drums in his sleep. Runs The Gilded Hearth in Brindlemark.',
    secrets: 'Secretly reports troop movements to the Northern Compact.',
    tags: ['npc', 'brindlemark', 'innkeeper', 'veteran'],
    connections: [
      { id: 'loc-1', name: 'The Gilded Hearth', type: 'location' },
      { id: 'fac-1', name: 'Northern Compact', type: 'faction' },
    ],
    blocks: [
      {
        id: 'blk-char-1-1',
        type: 'text',
        content: 'A retired soldier turned innkeeper who still hears the war drums in his sleep. Runs The Gilded Hearth in Brindlemark.',
      },
      {
        id: 'blk-char-1-2',
        type: 'secret',
        content: 'Secretly reports troop movements to the Northern Compact.',
      },
    ],
    createdAt: '2025-11-15T10:30:00Z',
    modifiedAt: '2025-12-28T14:22:00Z',
    typeSpecificFields: { race: 'Human', role: 'Innkeeper / Spy' },
  },
  {
    id: 'char-2',
    type: 'character',
    name: 'Seraphine Duskhollow',
    description: 'An elven cartographer mapping ley lines across the Thornwild. Her maps are coveted by every faction in the region.',
    tags: ['npc', 'elf', 'cartographer', 'thornwild'],
    connections: [
      { id: 'loc-2', name: 'The Thornwild', type: 'location' },
    ],
    blocks: [
      {
        id: 'blk-char-2-1',
        type: 'text',
        content: 'An elven cartographer mapping ley lines across the Thornwild. Her maps are coveted by every faction in the region.',
      },
    ],
    createdAt: '2025-11-20T08:00:00Z',
    modifiedAt: '2026-01-05T09:45:00Z',
    typeSpecificFields: { race: 'Elf', role: 'Cartographer' },
  },
  {
    id: 'loc-1',
    type: 'location',
    name: 'The Gilded Hearth',
    description: 'A warm and noisy tavern at the crossroads of Brindlemark. Smells of roast pheasant and pipe smoke year-round.',
    tags: ['tavern', 'brindlemark', 'social-hub'],
    connections: [
      { id: 'char-1', name: 'Theron Ashvale', type: 'character' },
    ],
    blocks: [
      {
        id: 'blk-loc-1-1',
        type: 'text',
        content: 'A warm and noisy tavern at the crossroads of Brindlemark. Smells of roast pheasant and pipe smoke year-round.',
      },
    ],
    createdAt: '2025-11-10T12:00:00Z',
    modifiedAt: '2025-12-20T16:30:00Z',
  },
  {
    id: 'loc-2',
    type: 'location',
    name: 'The Thornwild',
    description: 'A vast, ancient forest where the canopy blocks out the sun. Strange lights dance among the roots at midnight.',
    secrets: 'A sealed portal to the Feywild lies beneath the Grandmother Oak.',
    tags: ['forest', 'dangerous', 'fey', 'exploration'],
    connections: [
      { id: 'char-2', name: 'Seraphine Duskhollow', type: 'character' },
      { id: 'fac-1', name: 'Northern Compact', type: 'faction' },
    ],
    blocks: [
      {
        id: 'blk-loc-2-1',
        type: 'text',
        content: 'A vast, ancient forest where the canopy blocks out the sun. Strange lights dance among the roots at midnight.',
      },
      {
        id: 'blk-loc-2-2',
        type: 'secret',
        content: 'A sealed portal to the Feywild lies beneath the Grandmother Oak.',
      },
    ],
    createdAt: '2025-11-12T09:15:00Z',
    modifiedAt: '2026-01-10T11:00:00Z',
  },
  {
    id: 'fac-1',
    type: 'faction',
    name: 'Northern Compact',
    description: 'A loose alliance of border lords and merchants dedicated to keeping the Thornwild trade routes open despite growing dangers.',
    tags: ['political', 'trade', 'military', 'brindlemark'],
    connections: [
      { id: 'char-1', name: 'Theron Ashvale', type: 'character' },
      { id: 'loc-2', name: 'The Thornwild', type: 'location' },
    ],
    blocks: [
      {
        id: 'blk-fac-1-1',
        type: 'text',
        content: 'A loose alliance of border lords and merchants dedicated to keeping the Thornwild trade routes open despite growing dangers.',
      },
    ],
    createdAt: '2025-11-18T14:00:00Z',
    modifiedAt: '2025-12-15T10:10:00Z',
    typeSpecificFields: { alignment: 'Lawful Neutral', influence: 'Regional' },
  },
  {
    id: 'note-1',
    type: 'note',
    name: 'Ley Line Theory',
    description: 'Working notes on the ley line network. Seraphine believes three lines converge under the Grandmother Oak, forming a natural planar anchor.',
    tags: ['lore', 'ley-lines', 'fey', 'theory'],
    connections: [
      { id: 'char-2', name: 'Seraphine Duskhollow', type: 'character' },
      { id: 'loc-2', name: 'The Thornwild', type: 'location' },
    ],
    blocks: [
      {
        id: 'blk-note-1-1',
        type: 'heading',
        content: 'Notes',
      },
      {
        id: 'blk-note-1-2',
        type: 'text',
        content: 'Working notes on the ley line network. Seraphine believes three lines converge under the Grandmother Oak, forming a natural planar anchor.',
      },
      {
        id: 'blk-note-1-3',
        type: 'divider',
        content: '',
      },
      {
        id: 'blk-note-1-4',
        type: 'checklist',
        content: 'Verify the third convergence marker',
        checked: false,
      },
    ],
    createdAt: '2025-12-01T11:00:00Z',
    modifiedAt: '2026-01-08T15:20:00Z',
  },
];

// -----------------------------------------------
//  Helpers
// -----------------------------------------------

export function getAllEntities(): Entity[] {
  return MOCK_ENTITIES.map((e) => ({
    ...e,
    tags: [...e.tags],
    connections: e.connections.map((c) => ({ ...c })),
    blocks: e.blocks.map((b) => ({ ...b })),
    typeSpecificFields: e.typeSpecificFields ? { ...e.typeSpecificFields } : undefined,
  }));
}

export function getAllTags(): string[] {
  const tagSet = new Set<string>();
  for (const entity of MOCK_ENTITIES) {
    for (const tag of entity.tags) {
      tagSet.add(tag);
    }
  }
  return Array.from(tagSet).sort();
}

export function getEntityById(id: string): Entity | undefined {
  return MOCK_ENTITIES.find((e) => e.id === id);
}
