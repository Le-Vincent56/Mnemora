import { Result } from '@mnemora/core/src/domain/core/Result';
import { RepositoryError } from '@mnemora/core/src/domain/core/errors';
import type { IStagedProposalRepository } from '@mnemora/core/src/domain/repositories/IStagedProposalRepository';
import {
    StagedProposal,
    isStagedProposalKind,
    isStagedProposalStatus,
} from '@mnemora/core/src/domain/value-objects/StagedProposal';
import {
    StagedProposalAuditEvent,
    isStagedProposalAuditAction,
} from '@mnemora/core/src/domain/value-objects/StagedProposalAuditEvent';
import { STAGED_PROPOSALS_STORAGE_KEY } from '../constants';
import {
    getOrCreateAuditEventsList,
    getOrCreateProposalsList,
    mutateStagedProposalsState,
    readStagedProposalsState,
    type StagedProposalAuditEventRecord,
    type StagedProposalRecord,
} from './StagedProposalsLocalStorage';

function parseISODate(value: string | null): Date | null {
    // Exit case - no value given
    if (!value) return null;
    
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
}

function recordToProposal(record: StagedProposalRecord): StagedProposal {
    const kind = isStagedProposalKind(record.kind) ? record.kind : 'other';
    const status = isStagedProposalStatus(record.status) ? record.status : 'open';
    const createdAt = parseISODate(record.createdAt) ?? new Date();
    const updatedAt = parseISODate(record.updatedAt) ?? createdAt;
    
    return StagedProposal.fromProps({
        id: record.id,
        sessionID: record.sessionID,
        kind,
        title: record.title,
        content: record.content,
        status,
        mergedTarget: record.mergedTarget ? { type: record.mergedTarget.type, targetID: record.mergedTarget.targetID } : null,
        createdAt,
        updatedAt,
    });
}

function recordToAuditEvent(record: StagedProposalAuditEventRecord): StagedProposalAuditEvent {
    const action = isStagedProposalAuditAction(record.action) ? record.action : 'created';
    const occurredAt = parseISODate(record.occurredAt) ?? new Date();
    
    return StagedProposalAuditEvent.fromProps({
        id: record.id,
        proposalID: record.proposalID,
        sessionID: record.sessionID,
        action,
        occurredAt,
        metadata: { ...record.metadata },
    });
}

export class LocalStorageStagedProposalRepository implements IStagedProposalRepository {
    constructor(private readonly storageKey: string = STAGED_PROPOSALS_STORAGE_KEY) { }
    
    async listBySessionID(sessionID: string): Promise<Result<StagedProposal[], RepositoryError>> {
        try {
            const stateResult = readStagedProposalsState(this.storageKey);

            // Exit case - failed to read the state
            if (stateResult.isFailure) return Result.fail(stateResult.error);

            const list = stateResult.value.proposalsBySession[sessionID] ?? [];
            const proposals = list
                .map((r) => recordToProposal(r))
                .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
            return Result.ok(proposals);
        } catch (error) {
            return Result.fail(new RepositoryError('Failed to list staged proposals', error));
        }
    }

    async getByID(proposalID: string): Promise<Result<StagedProposal | null, RepositoryError>> {
        try {
            const stateResult = readStagedProposalsState(this.storageKey);
            
            // Exit case - failed to read the state
            if (stateResult.isFailure) return Result.fail(stateResult.error);
            
            const sessionID = stateResult.value.proposalToSession[proposalID] ?? null;
            
            // Exit case - failed to retrieve the session ID
            if (!sessionID) return Result.ok(null);
            
            const list = stateResult.value.proposalsBySession[sessionID] ?? [];
            const rec = list.find((p) => p.id === proposalID) ?? null;
            
            // Exit case - failed to find the proposal
            if (!rec) return Result.ok(null);

            return Result.ok(recordToProposal(rec));
        } catch (error) {
            return Result.fail(new RepositoryError('Failed to get staged proposal', error));
        }
    }

    async listAuditEvents(proposalId: string): Promise<Result<StagedProposalAuditEvent[], RepositoryError>> {
        try {
            const stateResult = readStagedProposalsState(this.storageKey);

            // Exit case - failed to read the state
            if (stateResult.isFailure) return Result.fail(stateResult.error);
            
            const list = stateResult.value.auditEventsByProposal[proposalId] ?? [];
            const events = list
                .map((r) => recordToAuditEvent(r))
                .sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime());
            
            return Result.ok(events);
        } catch (error) {
            return Result.fail(new RepositoryError('Failed to list staged proposal audit events', error));
        }
    }

    async saveProposalWithAuditEvent(
        proposal: StagedProposal,
        event: StagedProposalAuditEvent,
    ): Promise<Result<void, RepositoryError>> {
        try {
            const proposalSessionID = proposal.sessionID;
            const mutation = mutateStagedProposalsState<void>(this.storageKey, (state) => {
                const list = getOrCreateProposalsList(state, proposalSessionID);
                const idx = list.findIndex((p) => p.id === proposal.id);
                const record: StagedProposalRecord = {
                    id: proposal.id,
                    sessionID: proposal.sessionID,
                    kind: proposal.kind,
                    title: proposal.title,
                    content: proposal.content,
                    status: proposal.status,
                    mergedTarget: proposal.mergedTarget ? { type: proposal.mergedTarget.type, targetID: proposal.mergedTarget.targetID } : null,
                    createdAt: proposal.createdAt.toISOString(),
                    updatedAt: proposal.updatedAt.toISOString(),
                };

                if (idx >= 0) {
                    list[idx] = record;
                } else {
                    list.push(record);
                }

                state.proposalToSession[proposal.id] = proposalSessionID;
                const events = getOrCreateAuditEventsList(state, proposal.id);
                const eventRecord: StagedProposalAuditEventRecord = {
                    id: event.id,
                    proposalID: event.proposalID,
                    sessionID: event.sessionID,
                    action: event.action,
                    occurredAt: event.occurredAt.toISOString(),
                    metadata: { ...event.metadata },
                };
                events.push(eventRecord);
                events.sort((a, b) => {
                    const da = parseISODate(a.occurredAt)?.getTime() ?? 0;
                    const db = parseISODate(b.occurredAt)?.getTime() ?? 0;
                    return da - db;
                });
            });
            return mutation.map(() => undefined);
        } catch (error) {
            return Result.fail(new RepositoryError('Failed to save staged proposal with audit event', error));
        }
    }
}