import { Result } from '@mnemora/core/src/domain/core/Result';
import { RepositoryError } from '@mnemora/core/src/domain/core/errors';

export interface SessionNotesQuickNoteRecord {
    id: string;
    content: string;
    capturedAt: string;
    linkedEntityIDs: string[];
    visibility: 'gm_only' | 'players';
}

export interface SessionNotesFeedbackRecord {
    stars: string[];
    wishes: string[];
    collectedAt: string;
}

export interface SessionNotesStorageState {
    version: 1;
    notesBySession: Record<string, SessionNotesQuickNoteRecord[]>;
    feedbackBySession: Record<string, SessionNotesFeedbackRecord | null>;
}

const DEFAULT_STATE: SessionNotesStorageState = {
    version: 1,
    notesBySession: {},
    feedbackBySession: {},
};

let memoryState: SessionNotesStorageState = {
    version: 1,
    notesBySession: {},
    feedbackBySession: {},
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

function isStringArray(value: unknown): value is string[] {
    return Array.isArray(value) && value.every((v) => typeof v === 'string');
}

function normalizeNoteRecord(value: unknown): SessionNotesQuickNoteRecord | null {
    // Exit case - the value is not a record
    if (!isRecord(value)) return null;

    const id = typeof value.id === 'string' ? value.id : null;
    const content = typeof value.content === 'string' ? value.content : null;
    const capturedAt = typeof value.capturedAt === 'string' ? value.capturedAt : null;
    const linkedEntityIDs = isStringArray(value.linkedEntityIDs) ? value.linkedEntityIDs : [];
    const visibility = value.visibility === 'players' ? 'players' : 'gm_only';

    if (!id || !content || !capturedAt) return null;

    return { id, content, capturedAt, linkedEntityIDs: [...linkedEntityIDs], visibility };
}

function normalizeFeedbackRecord(value: unknown): SessionNotesFeedbackRecord | null {
    // Exit case - the value is null
    if (value === null) return null;
    
    // Exit case - the value is not a record
    if (!isRecord(value)) return null;

    const stars = isStringArray(value.stars) ? value.stars : [];
    const wishes = isStringArray(value.wishes) ? value.wishes : [];
    const collectedAt = typeof value.collectedAt === 'string' ? value.collectedAt : null;
    
    // Exit case - no collectedAt time
    if (!collectedAt) return null;

    return {
        stars: [...stars],
        wishes: [...wishes],
        collectedAt,
    };
}

function normalizeState(input: unknown): SessionNotesStorageState | null {
    // Exit case - the input is not a record
    if (!isRecord(input)) return null;

    // Exit case - the input version is mismatched
    if (input.version !== 1) return null;

    // Exit case - the notes or the feedback are not records
    if (!isRecord(input.notesBySession) || !isRecord(input.feedbackBySession)) return null;

    const notesBySession: Record<string, SessionNotesQuickNoteRecord[]> = {};
    for (const [sessionID, raw] of Object.entries(input.notesBySession)) {
        const list = Array.isArray(raw) ? raw : [];
        const normalized = list
            .map((n) => normalizeNoteRecord(n))
            .filter((n): n is SessionNotesQuickNoteRecord => n !== null);
        notesBySession[sessionID] = normalized;
    }

    const feedbackBySession: Record<string, SessionNotesFeedbackRecord | null> = {};
    for (const [sessionID, raw] of Object.entries(input.feedbackBySession)) {
        feedbackBySession[sessionID] = normalizeFeedbackRecord(raw);
    }

    return { version: 1, notesBySession, feedbackBySession };
}

function cloneState(state: SessionNotesStorageState): SessionNotesStorageState {
    const notesBySession: Record<string, SessionNotesQuickNoteRecord[]> = {};
    for (const [k, v] of Object.entries(state.notesBySession)) {
        notesBySession[k] = v.map((n) => ({
            id: n.id,
            content: n.content,
            capturedAt: n.capturedAt,
            linkedEntityIDs: [...n.linkedEntityIDs],
            visibility: n.visibility,
        }));
    }

    const feedbackBySession: Record<string, SessionNotesFeedbackRecord | null> = {};
    for (const [k, v] of Object.entries(state.feedbackBySession)) {
        feedbackBySession[k] = v
            ? {
                stars: [...v.stars],
                wishes: [...v.wishes],
                collectedAt: v.collectedAt,
            }
            : null;
    }

    return { version: 1, notesBySession, feedbackBySession };
}

export function readSessionNotesState(storageKey: string): Result<SessionNotesStorageState, RepositoryError> {
    const storage = getStorage();

    // Exit case - the storage could not be retrieved
    if (!storage) {
        return Result.ok(cloneState(memoryState));
    }

    try {
        const raw = storage.getItem(storageKey);
        
        // Exit case - the item could not be retrieved from storage
        if (!raw) {
            return Result.ok(cloneState(DEFAULT_STATE));
        }

        const parsed = JSON.parse(raw) as unknown;
        const normalized = normalizeState(parsed);
        
        // Exit case - normalization failed
        if (!normalized) {
            return Result.ok(cloneState(DEFAULT_STATE));
        }

        return Result.ok(cloneState(normalized));
    } catch (error) {
        return Result.fail(new RepositoryError('Failed to read session notes state from localStorage', error));
    }
}

export function writeSessionNotesState(storageKey: string, state: SessionNotesStorageState): Result<void, RepositoryError> {
    const storage = getStorage();

    // Exit case - the storage could not be retrieved
    if (!storage) {
        memoryState = cloneState(state);
        return Result.okVoid();
    }

    try {
        storage.setItem(storageKey, JSON.stringify(state));
        return Result.okVoid();
    } catch (error) {
        return Result.fail(new RepositoryError('Failed to write session notes state to localStorage', error));
    }
}

export function mutateSessionNotesState<T>(
    storageKey: string,
    mutator: (draft: SessionNotesStorageState) => T,
): Result<{ readonly state: SessionNotesStorageState; readonly value: T }, RepositoryError> {
    const currentResult = readSessionNotesState(storageKey);
    
    // Exit case - failed to read the state
    if (currentResult.isFailure) return Result.fail(currentResult.error);

    const draft = cloneState(currentResult.value);
    let value: T;

    try {
        value = mutator(draft);
    } catch (error) {
        return Result.fail(new RepositoryError('Failed to mutate session notes state', error));
    }

    const writeResult = writeSessionNotesState(storageKey, draft);
    
    // Exit case - failed to write the state
    if (writeResult.isFailure) return Result.fail(writeResult.error);

    return Result.ok({ state: draft, value });
}

export function getOrCreateNotesList(
    state: SessionNotesStorageState,
    sessionID: string,
): SessionNotesQuickNoteRecord[] {
    return state.notesBySession[sessionID] ?? (state.notesBySession[sessionID] = []);
}
