import { Result } from '../core/Result';
import { RepositoryError } from '../core/errors';
import { StagedProposal } from '../value-objects/StagedProposal';
import { StagedProposalAuditEvent } from '../value-objects/StagedProposalAuditEvent';

export interface IStagedProposalRepository {
    listBySessionID(sessionID: string): Promise<Result<StagedProposal[], RepositoryError>>;
    
    getByID(proposalID: string): Promise<Result<StagedProposal | null, RepositoryError>>;
    
    listAuditEvents(proposalID: string): Promise<Result<StagedProposalAuditEvent[], RepositoryError>>;
    
    /**
     * Atomic write: upsert proposal snapshot + append audit event.
     * This is the crash-safety boundary for staging/review actions.
     */
    saveProposalWithAuditEvent(
        proposal: StagedProposal,
        event: StagedProposalAuditEvent
    ): Promise<Result<void, RepositoryError>>;
}