import { Result } from '@mnemora/core/src/domain/core/Result';
import { RepositoryError } from '@mnemora/core/src/domain/core/errors';

export interface SessionRunCampaignRecord {
    activeSessionID: string | null;
}

export interface SessionRunSessionRecord {
    name: string | null;
    startedAt: string | null;
    endedAt: string | null;
    durationSeconds: number | null;
}

export interface SessionRunStorageState {
    version: 1;
    campaigns: Record<string, SessionRunCampaignRecord>;
    sessions: Record<string, SessionRunSessionRecord>;
}

const DEFAULT_STATE: SessionRunStorageState = {
    version: 1,
    campaigns: {},
    sessions: {},
}

let memoryState: SessionRunStorageState = {
    version: 1,
    campaigns: {},
    sessions: {},
}

function getStorage(): Storage | null {
    if(typeof window === 'undefined') return null;
    
    try {
        return window.localStorage;
    } catch {
        return null;
    }
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeState(input: unknown): SessionRunStorageState | null {
    // Exit case - the input is not a record
    if(!isRecord(input)) return null;

    // Exit case - the version is invalid
    if(input.version !== 1) return null;

    // Exit case - the types are invalid
    if(!isRecord(input.campaigns) || !isRecord(input.sessions)) return null;

    // Record campaigns
    const campaigns: Record<string, SessionRunCampaignRecord> = {};
    for(const [k, v] of Object.entries(input.campaigns)) {
        const rec = isRecord(v) ? v : {};
        const activeSessionID = typeof rec.activeSessionID === 'string' ? rec.activeSessionID : null;
        campaigns[k] = { activeSessionID };
    }

    // Record sessions
    const sessions : Record<string, SessionRunSessionRecord> = {};
    for(const [k, v] of Object.entries(input.sessions)) {
        const rec = isRecord(v) ? v : {};
        const name = typeof rec.name === 'string' ? rec.name : null;
        const startedAt = typeof rec.startedAt === 'string' ? rec.startedAt : null;
        const endedAt = typeof rec.endedAt === 'string' ? rec.endedAt : null;
        const durationSeconds = typeof rec.durationSeconds === 'number' ? rec.durationSeconds : null;
        sessions[k] = { name, startedAt, endedAt, durationSeconds };
    }

    return { version: 1, campaigns, sessions };
}

function cloneState(state: SessionRunStorageState): SessionRunStorageState {
    // Copy campaign data
    const campaigns: Record<string, SessionRunCampaignRecord> = {};
    for(const [k, v] of Object.entries(state.campaigns)) {
        campaigns[k] = { activeSessionID: v.activeSessionID };
    }

    // Copy session data
    const sessions: Record<string, SessionRunSessionRecord> = {};
    for(const [k, v] of Object.entries(state.sessions)) {
        sessions[k] = {
            name: v.name,
            startedAt: v.startedAt,
            endedAt: v.endedAt,
            durationSeconds: v.durationSeconds
        };
    }

    return { version: 1, campaigns, sessions };
}

export function readSessionRunState(storageKey: string): Result<SessionRunStorageState, RepositoryError> {
    const storage = getStorage();

    // If there's no storage, return the cloned memory state
    if(!storage) {
        return Result.ok(cloneState(memoryState));
    }

    try {
        const raw = storage.getItem(storageKey);
        
        // Exit case - no item retrieved, return the default state
        if(!raw) {
            return Result.ok(cloneState(DEFAULT_STATE));
        }

        const parsed = JSON.parse(raw) as unknown;
        const normalized = normalizeState(parsed);

        // Exit case - unable to normalize, return the default state
        if(!normalized) {
            return Result.ok(cloneState(DEFAULT_STATE));
        }

        return Result.ok(cloneState(normalized));
    } catch (error) {
        return Result.fail(new RepositoryError('Failed to read session run state from localStorage', error));
    }
}

export function writeSessionRunState(storageKey: string, state: SessionRunStorageState): Result<void, RepositoryError> {
    const storage = getStorage();
    
    // Exit case - no storage
    if(!storage) {
        memoryState = cloneState(state);
        return Result.okVoid();
    }

    try {
        storage.setItem(storageKey, JSON.stringify(state));
        return Result.okVoid();
    } catch (error) {
        return Result.fail(new RepositoryError('Failed to write session run state to localStorage', error));
    }
}

export function mutateSessionRunState<T>(
    storageKey: string,
    mutator: (draft: SessionRunStorageState) => T,
): Result<{ readonly state: SessionRunStorageState; readonly value: T }, RepositoryError> {
    const currentResult = readSessionRunState(storageKey);
    
    // Exit case - the current result failed
    if(currentResult.isFailure) {
        return Result.fail(currentResult.error);
    }

    const draft = cloneState(currentResult.value);

    let value: T;
    try {
        value = mutator(draft);
    } catch (error) {
        return Result.fail(new RepositoryError('Failed to mutate session run state', error));
    }

    const writeResult = writeSessionRunState(storageKey, draft);
    
    // Exit case - if writing failed
    if(writeResult.isFailure) {
        return Result.fail(writeResult.error);
    }

    return Result.ok({ state: draft, value });
}

export function getOrCreateCampaignRecord(
    state: SessionRunStorageState,
    campaignID: string
): SessionRunCampaignRecord {
    return state.campaigns[campaignID] ?? (state.campaigns[campaignID] = { activeSessionID: null });
}

export function getOrCreateSessionRecord(
    state: SessionRunStorageState, 
    sessionID: string
): SessionRunSessionRecord {
    return state.sessions[sessionID] ?? (state.sessions[sessionID] = {
        name: null,
        startedAt: null,
        endedAt: null,
        durationSeconds: null,
    });
}