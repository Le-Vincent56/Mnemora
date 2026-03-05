import { Result } from '../../domain/core/Result';
import type { IStagedProposalRepository } from '../../domain/repositories/IStagedProposalRepository';
import { StagedProposalAuditEvent } from '../../domain/value-objects/StagedProposalAuditEvent';
import type {
    ListStagedProposalAuditEventsRequest,
    ListStagedProposalAuditEventsResponse,
    StagedProposalAuditEventDTO,
} from '../dtos/StagedProposalsDTOs';
import type { IUseCase } from './IUseCase';
import { UseCaseError } from './UseCaseError';

export class ListStagedProposalAuditEventsUseCase implements IUseCase<ListStagedProposalAuditEventsRequest, ListStagedProposalAuditEventsResponse> {
    constructor(private readonly stagedProposalRepository: IStagedProposalRepository) { }
    
    async execute(request: ListStagedProposalAuditEventsRequest): Promise<Result<ListStagedProposalAuditEventsResponse, UseCaseError>> {
        // Exit case - no proposal ID
        if (!request.proposalID?.trim()) {
            return Result.fail(UseCaseError.validation('Proposal ID is required', 'proposalId'));
        }

        const result = await this.stagedProposalRepository.listAuditEvents(request.proposalID);
        
        // Exit case - failed to list audit events
        if (result.isFailure) {
            return Result.fail(
                UseCaseError.repositoryError('Failed to list staged proposal audit events', result.error)
            );
        }
        
        const sorted = [...result.value].sort((a, b) =>
            a.occurredAt.getTime() - b.occurredAt.getTime()
        );
        
        return Result.ok({
            events: sorted.map(toDTO),
        });
    }
}

function toDTO(event: StagedProposalAuditEvent): StagedProposalAuditEventDTO {
    return {
        id: event.id,
        proposalID: event.proposalID,
        sessionID: event.sessionID,
        action: event.action,
        occurredAt: event.occurredAt.toISOString(),
        metadata: event.metadata,
    };
}