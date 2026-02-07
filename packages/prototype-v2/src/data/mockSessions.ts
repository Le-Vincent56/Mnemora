// -----------------------------------------------
//  Types
// -----------------------------------------------

export interface SessionFeedback {
  stars: number;
  wishes: number;
}

export interface SessionBlock {
  id: string;
  type: 'text' | 'heading' | 'checklist' | 'divider';
  content: string;
  checked?: boolean;
}

export interface SessionData {
  id: string;
  number: number;
  title: string;
  date: string;
  recap: string;
  prepNotes: string;
  feedback: SessionFeedback;
  isUpcoming: boolean;
  prepChecklist: Array<{ label: string; done: boolean }>;
  blocks: SessionBlock[];
}

// -----------------------------------------------
//  Mock Data
// -----------------------------------------------

const MOCK_SESSIONS: SessionData[] = [
  {
    id: 'sess-next',
    number: 14,
    title: 'The Grandmother Oak',
    date: '2026-02-08T19:00:00Z',
    recap: '',
    prepNotes: '',
    isUpcoming: true,
    feedback: { stars: 0, wishes: 0 },
    prepChecklist: [
      { label: 'Finalize Grandmother Oak encounter map', done: true },
      { label: 'Prepare Fey Court NPC voices', done: false },
      { label: 'Review ley line lore notes', done: true },
      { label: 'Set up ambient audio playlist', done: false },
      { label: 'Print player handouts', done: false },
    ],
    blocks: [
      { id: 'b-1', type: 'heading', content: 'Prep Checklist' },
      { id: 'b-2', type: 'checklist', content: 'Finalize Grandmother Oak encounter map', checked: true },
      { id: 'b-3', type: 'checklist', content: 'Prepare Fey Court NPC voices', checked: false },
      { id: 'b-4', type: 'checklist', content: 'Review ley line lore notes', checked: true },
      { id: 'b-5', type: 'checklist', content: 'Set up ambient audio playlist', checked: false },
      { id: 'b-6', type: 'checklist', content: 'Print player handouts', checked: false },
      { id: 'b-7', type: 'divider', content: '' },
      { id: 'b-8', type: 'heading', content: 'Notes' },
      { id: 'b-9', type: 'text', content: 'The Grandmother Oak is the oldest living thing in the Thornwild. The party will need to navigate fey wards to reach it.' },
      { id: 'b-10', type: 'text', content: '' },
    ],
  },
  {
    id: 'sess-13',
    number: 13,
    title: 'Into the Thornwild',
    date: '2026-01-11T19:00:00Z',
    recap: 'Armed with the map fragment, the party ventured into the Thornwild. They encountered fey tricksters and a wounded ranger from the Compact. The session ended with the party discovering strange glowing roots leading deeper into the forest.',
    prepNotes: 'Need to track Compact ranger motivations for next session.',
    isUpcoming: false,
    feedback: { stars: 8, wishes: 3 },
    prepChecklist: [],
    blocks: [],
  },
  {
    id: 'sess-12',
    number: 12,
    title: 'The Ember Auction',
    date: '2026-01-04T19:00:00Z',
    recap: 'The party attended a clandestine auction beneath The Gilded Hearth, bidding on a map fragment rumored to show the Grandmother Oak. Theron was revealed as a Compact informant.',
    prepNotes: '',
    isUpcoming: false,
    feedback: { stars: 12, wishes: 2 },
    prepChecklist: [],
    blocks: [],
  },
  {
    id: 'sess-11',
    number: 11,
    title: 'Shadows Over Brindlemark',
    date: '2025-12-28T19:00:00Z',
    recap: 'Strange disappearances in the merchant quarter led the party to uncover a smuggling ring connected to the Northern Compact. They gained access to the auction invitation.',
    prepNotes: '',
    isUpcoming: false,
    feedback: { stars: 6, wishes: 4 },
    prepChecklist: [],
    blocks: [],
  },
  {
    id: 'sess-10',
    number: 10,
    title: 'The Cartographer\'s Bargain',
    date: '2025-12-21T19:00:00Z',
    recap: 'Seraphine Duskhollow offered the party a deal: retrieve her stolen ley line notes from a rival collector in exchange for a map to the Grandmother Oak.',
    prepNotes: '',
    isUpcoming: false,
    feedback: { stars: 9, wishes: 1 },
    prepChecklist: [],
    blocks: [],
  },
  {
    id: 'sess-9',
    number: 9,
    title: 'Border Tensions',
    date: '2025-12-14T19:00:00Z',
    recap: 'Patrol duty along the Thornwild border revealed increasing fey incursions. The party negotiated a temporary truce with a fey emissary after a tense standoff.',
    prepNotes: '',
    isUpcoming: false,
    feedback: { stars: 7, wishes: 5 },
    prepChecklist: [],
    blocks: [],
  },
  {
    id: 'sess-8',
    number: 8,
    title: 'The Gilded Hearth',
    date: '2025-12-07T19:00:00Z',
    recap: 'The party arrived in Brindlemark and established their base at The Gilded Hearth. They met Theron Ashvale and learned about the Northern Compact\'s interest in the Thornwild.',
    prepNotes: '',
    isUpcoming: false,
    feedback: { stars: 10, wishes: 2 },
    prepChecklist: [],
    blocks: [],
  },
  {
    id: 'sess-7',
    number: 7,
    title: 'Road to Brindlemark',
    date: '2025-11-30T19:00:00Z',
    recap: 'A travel session through the northern highlands. Bandit ambush at Widow\'s Pass. The party found a cryptic journal hinting at ley line convergences.',
    prepNotes: '',
    isUpcoming: false,
    feedback: { stars: 5, wishes: 3 },
    prepChecklist: [],
    blocks: [],
  },
];

// -----------------------------------------------
//  Helpers
// -----------------------------------------------

export function getUpcomingSession(): SessionData | undefined {
  return MOCK_SESSIONS.find((s) => s.isUpcoming);
}

export function getSessionHistory(): SessionData[] {
  return MOCK_SESSIONS
    .filter((s) => !s.isUpcoming)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function getAllSessions(): SessionData[] {
  return MOCK_SESSIONS.map((s) => ({
    ...s,
    feedback: { ...s.feedback },
    prepChecklist: s.prepChecklist.map((c) => ({ ...c })),
    blocks: s.blocks.map((b) => ({ ...b })),
  }));
}
