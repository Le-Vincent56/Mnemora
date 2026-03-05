import type { 
    MergeTarget, 
    StagedProposalKind, 
    StagedProposalStatus 
} from "../../domain/value-objects/StagedProposal";
import type { StagedProposalAuditAction } from "../../domain/value-objects/StagedProposalAuditEvent";

export interface StagedProposalDTO {
    readonly id: string;
    readonly sessionID: string;
    readonly kind: StagedProposalKind;
    readonly title: string | null;
    readonly content: string;
    readonly status: StagedProposalStatus;
    readonly mergedTarget: MergeTarget | null;
    readonly createdAt: string;     // ISO date string
    readonly updatedAt: string;     // ISO date string
}

export interface StagedProposalAuditEventDTO {
    readonly id: string;
    readonly proposalID: string;
    readonly sessionID: string;
    readonly action: StagedProposalAuditAction;
    readonly occurredAt: string;    // ISO date string
    readonly metadata: Record<string, unknown>;
}

export interface CreateStagedProposalRequest {
    readonly sessionID: string;
    readonly kind?: StagedProposalKind;
    readonly title?: string | null;
    readonly content: string;
}

export interface CreateStagedProposalResponse {
    readonly proposal: StagedProposalDTO;
    readonly event: StagedProposalAuditEventDTO;
}

export interface ListStagedProposalsRequest {
    readonly sessionID: string;

    /**
     * When false (default), returns only proposals that still
     * need review (open and deferred)
     */
    readonly includeResolved?: boolean;
}

export interface ListStagedProposalsResponse {
    readonly proposals: readonly StagedProposalDTO[];
}

export interface ListStagedProposalAuditEventsRequest {
    readonly proposalID: string;
}

export interface ListStagedProposalAuditEventsResponse {
    readonly events: readonly StagedProposalAuditEventDTO[];
}

export type ReviewStagedProposalAction = 
    | 'accept'
    | 'edit_then_accept'
    | 'defer'
    | 'discard'
    | 'merge'
    | 'reclassify';

export interface ReviewStagedProposalRequest {
    readonly proposalID: string;
    readonly action: ReviewStagedProposalAction;
    readonly edits?: {
        readonly title?: string | null;
        readonly content?: string;
    };
    readonly reason?: string;
    readonly mergeTarget?: MergeTarget;
    readonly reclassifyToKind?: StagedProposalKind;
}

export interface ReviewStagedProposalResponse {
    readonly proposal: StagedProposalDTO;
    readonly event: StagedProposalAuditEventDTO;
}