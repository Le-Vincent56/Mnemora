// -----------------------------------------------
//  Types
// -----------------------------------------------

export type EventCategory = 'battle' | 'political' | 'discovery' | 'social' | 'travel' | 'magical';

export interface TimelineEvent {
  id: string;
  title: string;
  date: string;
  era: string;
  category: EventCategory;
  description: string;
  linkedEntities: Array<{ id: string; name: string; type: string }>;
}

export const CATEGORY_LABELS: Record<EventCategory, string> = {
  battle: 'Battle',
  political: 'Political',
  discovery: 'Discovery',
  social: 'Social',
  travel: 'Travel',
  magical: 'Magical',
};

/** Map categories to existing entity-type tokens for colors */
export const CATEGORY_COLORS: Record<EventCategory, string> = {
  battle: 'var(--entity-faction)',
  political: 'var(--entity-session)',
  discovery: 'var(--entity-location)',
  social: 'var(--entity-character)',
  travel: 'var(--entity-note)',
  magical: 'var(--primary)',
};

// -----------------------------------------------
//  Mock Data
// -----------------------------------------------

const MOCK_EVENTS: TimelineEvent[] = [
  {
    id: 'evt-1',
    title: 'The Shattered Oath',
    date: '1042-03-15',
    era: 'Third Age',
    category: 'political',
    description: 'The border lords of the northern provinces broke their sworn alliance with the Crown, forming what would become the Northern Compact.',
    linkedEntities: [
      { id: 'fac-1', name: 'Northern Compact', type: 'faction' },
    ],
  },
  {
    id: 'evt-2',
    title: 'Founding of Brindlemark',
    date: '1044-07-01',
    era: 'Third Age',
    category: 'social',
    description: 'A trade post at the crossroads grew into a fortified town, becoming the Compact\'s de facto capital and commercial hub.',
    linkedEntities: [
      { id: 'loc-1', name: 'The Gilded Hearth', type: 'location' },
    ],
  },
  {
    id: 'evt-3',
    title: 'The Thornwild Awakening',
    date: '1048-10-31',
    era: 'Third Age',
    category: 'magical',
    description: 'Strange lights began appearing deep in the Thornwild. Locals reported hearing music from within the forest. Scholars linked the phenomenon to ley line activity.',
    linkedEntities: [
      { id: 'loc-2', name: 'The Thornwild', type: 'location' },
    ],
  },
  {
    id: 'evt-4',
    title: 'Seraphine\'s Expedition',
    date: '1050-04-12',
    era: 'Third Age',
    category: 'discovery',
    description: 'Elven cartographer Seraphine Duskhollow arrived in the region, beginning her systematic mapping of the ley line network beneath the Thornwild.',
    linkedEntities: [
      { id: 'char-2', name: 'Seraphine Duskhollow', type: 'character' },
      { id: 'loc-2', name: 'The Thornwild', type: 'location' },
    ],
  },
  {
    id: 'evt-5',
    title: 'Battle of Ashford Bridge',
    date: '1051-08-22',
    era: 'Third Age',
    category: 'battle',
    description: 'Crown loyalists attempted to retake the northern trade routes. The Compact repelled the assault at Ashford Bridge, cementing their independence.',
    linkedEntities: [
      { id: 'fac-1', name: 'Northern Compact', type: 'faction' },
    ],
  },
  {
    id: 'evt-6',
    title: 'The Fey Incursions Begin',
    date: '1052-01-07',
    era: 'Third Age',
    category: 'magical',
    description: 'Fey creatures began crossing into the mortal realm through weak points in the Thornwild. The Compact established border patrols.',
    linkedEntities: [
      { id: 'loc-2', name: 'The Thornwild', type: 'location' },
      { id: 'fac-1', name: 'Northern Compact', type: 'faction' },
    ],
  },
  {
    id: 'evt-7',
    title: 'Theron\'s Recruitment',
    date: '1052-06-14',
    era: 'Third Age',
    category: 'political',
    description: 'Retired soldier Theron Ashvale was recruited by the Compact to serve as an informant, using his tavern as a listening post.',
    linkedEntities: [
      { id: 'char-1', name: 'Theron Ashvale', type: 'character' },
      { id: 'loc-1', name: 'The Gilded Hearth', type: 'location' },
    ],
  },
  {
    id: 'evt-8',
    title: 'Discovery of the Grandmother Oak',
    date: '1052-09-03',
    era: 'Third Age',
    category: 'discovery',
    description: 'Seraphine\'s maps revealed that three ley lines converge beneath an ancient tree deep in the Thornwild — the Grandmother Oak, a natural planar anchor.',
    linkedEntities: [
      { id: 'char-2', name: 'Seraphine Duskhollow', type: 'character' },
      { id: 'loc-2', name: 'The Thornwild', type: 'location' },
    ],
  },
  {
    id: 'evt-9',
    title: 'The Map Fragment Theft',
    date: '1052-11-20',
    era: 'Third Age',
    category: 'social',
    description: 'Seraphine\'s ley line notes were stolen by a rival collector. The map fragment showing the path to the Grandmother Oak surfaced on the black market.',
    linkedEntities: [
      { id: 'char-2', name: 'Seraphine Duskhollow', type: 'character' },
    ],
  },
  {
    id: 'evt-10',
    title: 'The Ember Auction',
    date: '1053-01-04',
    era: 'Third Age',
    category: 'social',
    description: 'A clandestine auction held beneath The Gilded Hearth. The party acquired the stolen map fragment, setting the stage for the journey into the Thornwild.',
    linkedEntities: [
      { id: 'loc-1', name: 'The Gilded Hearth', type: 'location' },
      { id: 'char-1', name: 'Theron Ashvale', type: 'character' },
    ],
  },
];

// -----------------------------------------------
//  Helpers
// -----------------------------------------------

export function getAllEvents(): TimelineEvent[] {
  return MOCK_EVENTS;
}

export function getEventCategories(): EventCategory[] {
  const cats = new Set<EventCategory>();
  for (const evt of MOCK_EVENTS) {
    cats.add(evt.category);
  }
  return Array.from(cats);
}
