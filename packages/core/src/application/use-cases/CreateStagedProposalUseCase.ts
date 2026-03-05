import { Result } from '../../domain/core/Result';
import { ValidationError } from '../../domain/core/errors';
import type { IStagedProposalRepository } from '../../domain/repositories/IStagedProposalRepository';
import { StagedProposal } from '../../domain/value-objects/StagedProposal';
import { StagedProposalAuditEvent } from '../../domain/value-objects/StagedProposalAuditEvent';
import type {
    CreateStagedProposalRequest,
    CreateStagedProposalResponse,
    StagedProposalAuditEventDTO,
    StagedProposalDTO,
} from '../dtos/StagedProposalsDTOs';
import type { IUseCase } from './IUseCase';
import { UseCaseError } from './UseCaseError';

export class CreateStagedProposalUseCase implements IUseCase<CreateStagedProposalRequest, CreateStagedProposalResponse> {
    constructor(private readonly stagedProposalRepository: IStagedProposalRepository) { }

    async execute(request: CreateStagedProposalRequest): Promise<Result<CreateStagedProposalResponse, UseCaseError>> {
        // Exit case - no session ID
        if (!request.sessionID?.trim()) {
            return Result.fail(UseCaseError.validation('Session ID is required', 'sessionID'));
        }

        const proposalResult = StagedProposal.create({
            sessionID: request.sessionID,
            ...(request.kind !== undefined ? { kind: request.kind } : {}),
            title: request.title ?? null,
            content: request.content,
        });

        // Exit case - failed to create a staged proposal
        if (proposalResult.isFailure) {
            return Result.fail(this.mapValidationError(proposalResult.error));
        }

        const proposal = proposalResult.value;

        const eventResult = StagedProposalAuditEvent.create({
            proposalID: proposal.id,
            sessionID: proposal.sessionID,
            action: 'created',
            metadata: {
                kind: proposal.kind,
                ...(proposal.title ? { title: proposal.title } : {}),
            },
        });

        // Exit case - failed to create an audit event
        if (eventResult.isFailure) {
            return Result.fail(this.mapValidationError(eventResult.error));
        }

        const event = eventResult.value;

        const saveResult = await this.stagedProposalRepository.saveProposalWithAuditEvent(proposal, event);

        // Exit case - failed to save the proposal
        if (saveResult.isFailure) {
            return Result.fail(UseCaseError.repositoryError('Failed to save staged proposal', saveResult.error));
        }

        return Result.ok({
            proposal: toStagedProposalDTO(proposal),
            event: toStagedProposalAuditEventDTO(event),
        });
    }

    private mapValidationError(error: ValidationError): UseCaseError {
        return UseCaseError.validation(error.message, error.field ?? 'unknown');
    }
}

function toStagedProposalDTO(proposal: StagedProposal): StagedProposalDTO {
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

function toStagedProposalAuditEventDTO(event: StagedProposalAuditEvent): StagedProposalAuditEventDTO {
    return {
        id: event.id,
        proposalID: event.proposalID,
        sessionID: event.sessionID,
        action: event.action,
        occurredAt: event.occurredAt.toISOString(),
        metadata: event.metadata,
    };
}