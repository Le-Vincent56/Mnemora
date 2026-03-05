import { Result } from '@mnemora/core/src/domain/core/Result';
import { RepositoryError } from '@mnemora/core/src/domain/core/errors';

export interface StagedProposalMergeTargetRecord {
    type: 'proposal' | 'canon';
    targetID: string;
}

export interface StagedProposalRecord {
    id: string;
    sessionID: string;
    kind: string;
    title: string | null;
    content: string;
    status: string;
    mergedTarget: StagedProposalMergeTargetRecord | null;
    createdAt: string;
    updatedAt: string;
}

export interface StagedProposalAuditEventRecord {
    id: string;
    proposalID: string;
    sessionID: string;
    action: string;
    occurredAt: string;
    metadata: Record<string, unknown>;
}

export interface StagedProposalsStorageState {
    version: 1;
    proposalsBySession: Record<string, StagedProposalRecord[]>;
    auditEventsByProposal: Record<string, StagedProposalAuditEventRecord[]>;
    proposalToSession: Record<string, string>;
}

const DEFAULT_STATE: StagedProposalsStorageState = {
    version: 1,
    proposalsBySession: {},
    auditEventsByProposal: {},
    proposalToSession: {},
};

let memoryState: StagedProposalsStorageState = {
    version: 1,
    proposalsBySession: {},
    auditEventsByProposal: {},
    proposalToSession: {},
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

function normalizeMergeTarget(value: unknown): StagedProposalMergeTargetRecord | null {
    // Exit case - the value is not a record
    if (!isRecord(value)) return null;
    
    const type = value.type === 'canon' ? 'canon' : (value.type === 'proposal' ? 'proposal' : null);
    const targetID = typeof value.targetID === 'string' ? value.targetID : null;
    
    // Exit case - neither the type nor the target ID were normalized correctly
    if (!type || !targetID) return null;

    return { type, targetID };
}

function normalizeProposalRecord(value: unknown): StagedProposalRecord | null {
    // Exit case - the value is not a record
    if (!isRecord(value)) return null;
    
    const id = typeof value.id === 'string' ? value.id : null;
    const sessionID = typeof value.sessionID === 'string' ? value.sessionID : null;
    const kind = typeof value.kind === 'string' ? value.kind : 'other';
    const title = value.title === null ? null : (typeof value.title === 'string' ? value.title : null);
    const content = typeof value.content === 'string' ? value.content : null;
    const status = typeof value.status === 'string' ? value.status : 'open';
    const mergedTarget = normalizeMergeTarget(value.mergedTarget);
    const createdAt = typeof value.createdAt === 'string' ? value.createdAt : null;
    const updatedAt = typeof value.updatedAt === 'string' ? value.updatedAt : null;
    
    // Exit case - invalid data
    if (!id || !sessionID || !content || !createdAt || !updatedAt) return null;
    
    return {
        id,
        sessionID: sessionID,
        kind,
        title,
        content,
        status,
        mergedTarget,
        createdAt,
        updatedAt,
    };
}

function normalizeAuditEventRecord(value: unknown): StagedProposalAuditEventRecord | null {
    // Exit case - the value is not a record
    if (!isRecord(value)) return null;
    
    const id = typeof value.id === 'string' ? value.id : null;
    const proposalID = typeof value.proposalID === 'string' 
        ? value.proposalID 
        : null;
    const sessionID = typeof value.sessionID === 'string' 
        ? value.sessionID 
        : null;
    const action = typeof value.action === 'string' ? value.action : null;
    const occurredAt = typeof value.occurredAt === 'string' ? value.occurredAt : null;
    const metadata = isRecord(value.metadata) ? value.metadata : {};
    
    // Exit case - invalid data
    if (!id || !proposalID || !sessionID || !action || !occurredAt) return null;
    
    return {
        id,
        proposalID: proposalID,
        sessionID: sessionID,
        action,
        occurredAt,
        metadata: { ...metadata },
    };
}

function normalizeState(input: unknown): StagedProposalsStorageState | null {
    // Exit case - the input is not a record
    if (!isRecord(input)) return null;

    // Exit case - the input is of the incorrect version
    if (input.version !== 1) return null;

    // Exit case - the input's data are not records
    if (!isRecord(input.proposalsBySession) || !isRecord(input.auditEventsByProposal)) return null;
    
    const proposalsBySession: Record<string, StagedProposalRecord[]> = {};
    for (const [sessionID, raw] of Object.entries(input.proposalsBySession)) {
        const list = Array.isArray(raw) ? raw : [];
        const normalized = list
            .map((p) => normalizeProposalRecord(p))
            .filter((p): p is StagedProposalRecord => p !== null);
        proposalsBySession[sessionID] = normalized;
    }

    const auditEventsByProposal: Record<string, StagedProposalAuditEventRecord[]> = {};
    for (const [proposalID, raw] of Object.entries(input.auditEventsByProposal)) {
        const list = Array.isArray(raw) ? raw : [];
        const normalized = list
            .map((e) => normalizeAuditEventRecord(e))
            .filter((e): e is StagedProposalAuditEventRecord => e !== null);
        auditEventsByProposal[proposalID] = normalized;
    }

    // Self-heal / rebuild index from proposals
    const proposalToSession: Record<string, string> = {};
    for (const [sessionID, list] of Object.entries(proposalsBySession)) {
        for (const p of list) proposalToSession[p.id] = sessionID;
    }

    return { version: 1, proposalsBySession, auditEventsByProposal, proposalToSession };
}

function cloneState(state: StagedProposalsStorageState): StagedProposalsStorageState {
    const proposalsBySession: Record<string, StagedProposalRecord[]> = {};
    for (const [k, v] of Object.entries(state.proposalsBySession)) {
        proposalsBySession[k] = v.map((p) => ({
            id: p.id,
            sessionID: p.sessionID,
            kind: p.kind,
            title: p.title,
            content: p.content,
            status: p.status,
            mergedTarget: p.mergedTarget ? { type: p.mergedTarget.type, targetID: p.mergedTarget.targetID } : null,
            createdAt: p.createdAt,
            updatedAt: p.updatedAt,
        }));
    }

    const auditEventsByProposal: Record<string, StagedProposalAuditEventRecord[]> = {};
    for (const [k, v] of Object.entries(state.auditEventsByProposal)) {
        auditEventsByProposal[k] = v.map((e) => ({
            id: e.id,
            proposalID: e.proposalID,
            sessionID: e.sessionID,
            action: e.action,
            occurredAt: e.occurredAt,
            metadata: { ...e.metadata },
        }));
    }

    const proposalToSession: Record<string, string> = {};
    for (const [k, v] of Object.entries(state.proposalToSession)) {
        if (typeof v === 'string') proposalToSession[k] = v;
    }

    return { version: 1, proposalsBySession, auditEventsByProposal, proposalToSession };
}

export function readStagedProposalsState(storageKey: string): Result<StagedProposalsStorageState, RepositoryError> {
    const storage = getStorage();
    
    // Exit case - could not get the storage
    if (!storage) {
        return Result.ok(cloneState(memoryState));
    }

    try {
        const raw = storage.getItem(storageKey);
        
        // Exit case - could not retrieve the item
        if (!raw) return Result.ok(cloneState(DEFAULT_STATE));
        
        const parsed = JSON.parse(raw) as unknown;
        const normalized = normalizeState(parsed);
        
        // Exit case - failed to normalize the item
        if (!normalized) return Result.ok(cloneState(DEFAULT_STATE));
        
        return Result.ok(cloneState(normalized));
    } catch (error) {
        return Result.fail(new RepositoryError('Failed to read staged proposals state from localStorage', error));
    }
}
export function writeStagedProposalsState(storageKey: string, state: StagedProposalsStorageState): Result<void, RepositoryError> {
    const storage = getStorage();
    
    // Exit case - could not retrieve the storage
    if (!storage) {
        memoryState = cloneState(state);
        return Result.okVoid();
    }

    try {
        storage.setItem(storageKey, JSON.stringify(state));
        return Result.okVoid();
    } catch (error) {
        return Result.fail(new RepositoryError('Failed to write staged proposals state to localStorage', error));
    }
}

export function mutateStagedProposalsState<T>(
    storageKey: string,
    mutator: (draft: StagedProposalsStorageState) => T,
): Result<{ readonly state: StagedProposalsStorageState; readonly value: T }, RepositoryError> {
    
    const currentResult = readStagedProposalsState(storageKey);
    
    // Exit case - failed to read the staged proposals state
    if (currentResult.isFailure) return Result.fail(currentResult.error);
    
    const draft = cloneState(currentResult.value);
    let value: T;
    
    try {
        value = mutator(draft);
    } catch (error) {
        return Result.fail(new RepositoryError('Failed to mutate staged proposals state', error));
    }
    
    const writeResult = writeStagedProposalsState(storageKey, draft);
    
    // Exit case - failed to write to the staged proposals state
    if (writeResult.isFailure) return Result.fail(writeResult.error);
    
    return Result.ok({ state: draft, value });
}

export function getOrCreateProposalsList(
    state: StagedProposalsStorageState,
    sessionID: string,
): StagedProposalRecord[] {
    return state.proposalsBySession[sessionID] ?? (state.proposalsBySession[sessionID] = []);
}

export function getOrCreateAuditEventsList(
    state: StagedProposalsStorageState,
    proposalID: string,
): StagedProposalAuditEventRecord[] {
    return state.auditEventsByProposal[proposalID] ?? (state.auditEventsByProposal[proposalID] = []);
}