import { Result } from '../../domain/core/Result';
import { ValidationError } from '../../domain/core/errors';
import type { IStagedProposalRepository } from '../../domain/repositories/IStagedProposalRepository';
import { StagedProposal, type MergeTarget } from '../../domain/value-objects/StagedProposal';
import { StagedProposalAuditEvent, type StagedProposalAuditAction } from '../../domain/value-objects/StagedProposalAuditEvent';
import type {
    ReviewStagedProposalRequest,
    ReviewStagedProposalResponse,
    StagedProposalDTO,
    StagedProposalAuditEventDTO,
} from '../dtos/StagedProposalsDTOs';
import type { IUseCase } from './IUseCase';
import { UseCaseError } from './UseCaseError';

export class ReviewStagedProposalUseCase implements IUseCase<ReviewStagedProposalRequest, ReviewStagedProposalResponse> {
    constructor(private readonly stagedProposalRepository: IStagedProposalRepository) { }
    
    async execute(request: ReviewStagedProposalRequest): Promise<Result<ReviewStagedProposalResponse, UseCaseError>> {
        const proposalID = request.proposalID?.trim();
        
        // Exit case - no proposal ID
        if (!proposalID) {
            return Result.fail(UseCaseError.validation('Proposal ID is required', 'proposalId'));
        }

        const currentResult = await this.stagedProposalRepository.getByID(proposalID);
        
        // Exit case - failed to get the proposal by ID
        if (currentResult.isFailure) {
            return Result.fail(
                UseCaseError.repositoryError('Failed to load staged proposal', currentResult.error)
            );
        }

        const current = currentResult.value;
        
        // Exit case - failed to get the staged proposal
        if (!current) {
            return Result.fail(UseCaseError.notFound('StagedProposal', proposalID));
        }

        let updated: StagedProposal = current;
        let auditAction: StagedProposalAuditAction;
        let metadata: Record<string, unknown> = {};
        
        switch (request.action) {
            case 'accept': {
                updated = current.accept();
                auditAction = 'accepted';
                break;
            }

            case 'edit_then_accept': {
                const edits = request.edits;
                const hasEdits = !!edits && (edits.title !== undefined || edits.content !== undefined);
                
                // Exit case - the proposal does not have edits
                if (!hasEdits) {
                    return Result.fail(
                        UseCaseError.validation('edits.title and/or edits.content is required for edit_then_accept', 'edits')
                    );
                }

                const editedFields: string[] = [];
                let draft = current;
                
                if (edits!.title !== undefined) {
                    const r = draft.withTitle(edits!.title);

                    // Exit case - failed to update the title
                    if (r.isFailure) return Result.fail(this.mapValidationError(r.error));
                    
                    draft = r.value;
                    editedFields.push('title');
                }
                
                if (edits!.content !== undefined) {
                    const r = draft.withContent(edits!.content);
                    
                    // Exit case - failed to update the content
                    if (r.isFailure) return Result.fail(this.mapValidationError(r.error));
                    
                    draft = r.value;
                    editedFields.push('content');
                }
                
                updated = draft.accept();
                auditAction = 'edited_then_accepted';
                metadata = { editedFields };
                break;
            }

            case 'defer': {
                updated = current.defer();
                auditAction = 'deferred';
                const reason = request.reason?.trim();
                if (reason) metadata = { reason };
                break;
            }

            case 'discard': {
                updated = current.discard();
                auditAction = 'discarded';
                const reason = request.reason?.trim();
                if (reason) metadata = { reason };
                break;
            }

            case 'merge': {
                const target = request.mergeTarget;
                
                // Exit case - no target to merge
                if (!target) {
                    return Result.fail(UseCaseError.validation('mergeTarget is required for merge', 'mergeTarget'));
                }

                const mergeResult = current.merge(target as MergeTarget);
                
                // Exit case - failed to merge
                if (mergeResult.isFailure) return Result.fail(this.mapValidationError(mergeResult.error));
                
                updated = mergeResult.value;
                auditAction = 'merged';
                metadata = { target: updated.mergedTarget };
                break;
            }
            
            case 'reclassify': {
                const toKind = request.reclassifyToKind;
                
                // Exit case - the kind to reclassify to does not exist
                if (!toKind) {
                    return Result.fail(
                        UseCaseError.validation('reclassifyToKind is required for reclassify', 'reclassifyToKind')
                    );
                }

                updated = current.reclassify(toKind);
                auditAction = 'reclassified';
                metadata = { fromKind: current.kind, toKind };
                break;
            }

            default: {
                return Result.fail(UseCaseError.validation('Unknown review action', 'action'));
            }
        }
        const eventResult = StagedProposalAuditEvent.create({
            proposalID: updated.id,
            sessionID: updated.sessionID,
            action: auditAction,
            metadata,
        });

        // Exit case - failed to create the audit event
        if (eventResult.isFailure) {
            return Result.fail(this.mapValidationError(eventResult.error));
        }

        const event = eventResult.value;
        const saveResult = await this.stagedProposalRepository.saveProposalWithAuditEvent(updated, event);
        
        // Exit case - failed to save the proposal and audit
        if (saveResult.isFailure) {
            return Result.fail(
                UseCaseError.repositoryError('Failed to persist staged proposal review', saveResult.error)
            );
        }

        return Result.ok({
            proposal: toStagedProposalDTO(updated),
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