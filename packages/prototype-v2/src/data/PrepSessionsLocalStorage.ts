import { getAllSessions, type SessionBlock, type SessionData } from './mockSessions';

export const PREP_SESSIONS_STORAGE_KEY = 'mnemora:prototype-v2:prep-sessions:v1' as const;

interface PrepSessionsStorageState {
    version: 1;
    sessions: SessionData[];
}

const DEFAULT_STATE: PrepSessionsStorageState = {
    version: 1,
    sessions: getAllSessions(),
};

let memoryState: PrepSessionsStorageState = {
    version: 1,
    sessions: getAllSessions(),
};

function getStorage(): Storage | null {
    if (typeof window === 'undefined') return null;
    try {
        return window.localStorage;
    } catch {
        return null;
    }
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeChecklistItem(value: unknown): { label: string; done: boolean } | null {
    // Exit case - the value is not a record
    if (!isRecord(value)) return null;
    const label = typeof value.label === 'string' ? value.label : null;
    
    // Exit case - no label
    if (!label) return null;
    
    const done = typeof value.done === 'boolean' ? value.done : false;
    return { label, done };
}

function normalizeFeedback(value: unknown): { stars: number; wishes: number } {
    // Exit case - the vlaue is not a record
    if (!isRecord(value)) return { stars: 0, wishes: 0 };
    
    const stars = typeof value.stars === "number" && Number.isFinite(value.stars) ? value.stars : 0;
    const wishes = typeof value.wishes === "number" && Number.isFinite(value.wishes) ? value.wishes : 0;
    
    return { stars, wishes };
}

const BLOCK_TYPES = ['text', 'heading', 'checklist', 'divider'] as const;

type BlockType = (typeof BLOCK_TYPES)[number];

function isBlockType(value: unknown): value is BlockType {
    return typeof value === 'string' && (BLOCK_TYPES as readonly string[]).includes(value);
}

function genBlockID(): string {
    return `blk-${Date.now()}-${Math.floor(Math.random() * 1_000_000_000)}`;
}

function normalizeBlock(value: unknown): SessionBlock | null {
    // Exit case - the value is not a record
    if (!isRecord(value)) return null;
    
    const idRaw = typeof value.id === 'string' ? value.id.trim() : '';
    const id = idRaw.length > 0 ? idRaw : genBlockID();
    const type: BlockType = isBlockType(value.type) ? value.type : 'text';
    const content = typeof value.content === 'string' ? value.content : '';
    
    // Exit case - the block type is a checklist
    if (type === 'checklist') {
        const checked = typeof value.checked === 'boolean' ? value.checked : false;
        return { id, type, content, checked };
    }
    
    return { id, type, content };
}

function normalizeSession(value: unknown): SessionData | null {
    // Exit case - the value is not a record
    if (!isRecord(value)) return null;
    const id = typeof value.id === 'string' ? value.id : null;
    
    // Exit case - there is no ID
    if (!id) return null;
    
    const number = typeof value.number === 'number' && Number.isFinite(value.number) ? value.number : 0;
    const title = typeof value.title === 'string' ? value.title : 'Untitled Session';
    const date = typeof value.date === 'string' ? value.date : new Date().toISOString();
    const recap = typeof value.recap === 'string' ? value.recap : '';
    const prepNotes = typeof value.prepNotes === 'string' ? value.prepNotes : '';
    const feedback = normalizeFeedback(value.feedback);
    
    const isUpcoming =
        typeof value.isUpcoming === 'boolean'
            ? value.isUpcoming
            : new Date(date).getTime() > Date.now();
    
    const prepChecklist = Array.isArray(value.prepChecklist)
        ? value.prepChecklist
            .map(normalizeChecklistItem)
            .filter((c): c is { label: string; done: boolean } => c !== null)
        : [];
    
    const blocks = Array.isArray(value.blocks)
        ? value.blocks
            .map(normalizeBlock)
            .filter((b): b is SessionBlock => b !== null)
        : [];
    
    return {
        id,
        number,
        title,
        date,
        recap,
        prepNotes,
        feedback,
        isUpcoming,
        prepChecklist,
        blocks,
    };
}

function normalizeState(input: unknown): PrepSessionsStorageState | null {
    // Exit case - the input is not a record
    if (!isRecord(input)) return null;

    // Exit case - the input's version is mismatched
    if (input.version !== 1) return null;

    // Exit case - the input's session is not an array
    if (!Array.isArray(input.sessions)) return null;

    const sessions = input.sessions
        .map(normalizeSession)
        .filter((s): s is SessionData => s !== null);
    
    return { version: 1, sessions };
}

function cloneSessions(sessions: readonly SessionData[]): SessionData[] {
    return sessions.map((s) => ({
        ...s,
        feedback: { ...s.feedback },
        prepChecklist: s.prepChecklist.map((c) => ({ ...c })),
        blocks: s.blocks.map((b) => ({ ...b })),
    }));
}

export function loadPrepSessions(storageKey: string = PREP_SESSIONS_STORAGE_KEY): SessionData[] {
    const storage = getStorage();
    
    // Exit case - could not retrieve the storage
    if (!storage) {
        return cloneSessions(memoryState.sessions);
    }

    try {
        const raw = storage.getItem(storageKey);
        
        // Exit case - could not get the item
        if (!raw) {
            const seeded = cloneSessions(DEFAULT_STATE.sessions);
            memoryState = { version: 1, sessions: seeded };
            return cloneSessions(seeded);
        }

        const parsed = JSON.parse(raw) as unknown;
        const normalized = normalizeState(parsed);
        
        // Exit case - could not normalize the state
        if (!normalized) {
            const seeded = cloneSessions(DEFAULT_STATE.sessions);
            memoryState = { version: 1, sessions: seeded };
            return cloneSessions(seeded);
        }

        memoryState = { version: 1, sessions: cloneSessions(normalized.sessions) };
        return cloneSessions(normalized.sessions);
    } catch {
        const seeded = cloneSessions(DEFAULT_STATE.sessions);
        memoryState = { version: 1, sessions: seeded };
        return cloneSessions(seeded);
    }
}

export function savePrepSessions(
    sessions: readonly SessionData[],
    storageKey: string = PREP_SESSIONS_STORAGE_KEY,
): void {
    const nextState: PrepSessionsStorageState = {
        version: 1,
        sessions: cloneSessions(sessions),
    };

    memoryState = nextState;
    const storage = getStorage();

    // Exit case - could not get the storage
    if (!storage) return;
    
    try {
        storage.setItem(storageKey, JSON.stringify(nextState));
    } catch {
        // keep memoryState fallback
    }
}