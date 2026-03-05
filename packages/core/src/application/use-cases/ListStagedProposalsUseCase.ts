import { Result } from '../../domain/core/Result';
import type { IStagedProposalRepository } from '../../domain/repositories/IStagedProposalRepository';
import { StagedProposal } from '../../domain/value-objects/StagedProposal';
import type {
    ListStagedProposalsRequest,
    ListStagedProposalsResponse,
    StagedProposalDTO,
} from '../dtos/StagedProposalsDTOs';
import type { IUseCase } from './IUseCase';
import { UseCaseError } from './UseCaseError';

export class ListStagedProposalsUseCase implements IUseCase<ListStagedProposalsRequest, ListStagedProposalsResponse> {
    constructor(private readonly stagedProposalRepository: IStagedProposalRepository) { }

    async execute(request: ListStagedProposalsRequest): Promise<Result<ListStagedProposalsResponse, UseCaseError>> {
        // Exit case - no session ID
        if(!request.sessionID?.trim()) {
            return Result.fail(UseCaseError.validation('Session ID is required', 'sessionID'));
        }

        const result = await this.stagedProposalRepository.listBySessionID(request.sessionID);
        
        // Exit case - failed to list proposals by session ID
        if (result.isFailure) {
            return Result.fail(
                UseCaseError.repositoryError('Failed to list staged proposals', result.error)
            );
        }

        const includeResolved = request.includeResolved ?? false;
        const proposals = includeResolved
            ? result.value
            : result.value.filter((p) => p.status === 'open' || p.status === 'deferred');
        const sorted = [...proposals].sort((a, b) =>
            a.createdAt.getTime() - b.createdAt.getTime()
        );

        return Result.ok({
            proposals: sorted.map(toDTO),
        });
    }
}

function toDTO(proposal: StagedProposal): StagedProposalDTO {
    return {
        id: proposal.id,
        sessionID: proposal.sessionID,
        kind: proposal.kind,
        title: proposal.title,
        content: proposal.content,
        status: proposal.status,
        mergedTarget: proposal.mergedTarget,
        createdAt: proposal.createdAt.toISOString(),
        updatedAt: proposal.updatedAt.toISOString(),
    };
}