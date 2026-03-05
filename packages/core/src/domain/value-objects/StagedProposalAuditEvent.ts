import { Result } from '../core/Result';
import { ValidationError } from '../core/errors';

export const STAGED_PROPOSAL_AUDIT_ACTIONS = [
    'created',
    'accepted',
    'edited_then_accepted',
    'deferred',
    'discarded',
    'merged',
    'reclassified',
] as const;

export type StagedProposalAuditAction = typeof STAGED_PROPOSAL_AUDIT_ACTIONS[number];

export function isStagedProposalAuditAction(value: string): value is StagedProposalAuditAction {
    return (STAGED_PROPOSAL_AUDIT_ACTIONS as readonly string[]).includes(value);
}

export interface StagedProposalAuditEventProps {
    readonly id: string;
    readonly proposalID: string;
    readonly sessionID: string;
    readonly action: StagedProposalAuditAction;
    readonly occurredAt: Date;
    readonly metadata: Record<string, unknown>;
}

export interface CreateStagedProposalAuditEventProps {
    readonly proposalID: string;
    readonly sessionID: string;
    readonly action: StagedProposalAuditAction;
    readonly occurredAt?: Date;
    readonly metadata?: Record<string, unknown>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Append-only audit event for staged proposal review.
 * Kept minimal: action, timestamp, and small metadata blob
 */
export class StagedProposalAuditEvent {
    private readonly props: StagedProposalAuditEventProps;

    get id(): string { return this.props.id; }
    get proposalID(): string { return this.props.proposalID; }
    get sessionID(): string { return this.props.sessionID; }
    get action(): StagedProposalAuditAction { return this.props.action; }
    get occurredAt(): Date { return this.props.occurredAt; }
    get metadata(): Record<string, unknown> { return this.props.metadata; }
    
    private constructor(props: StagedProposalAuditEventProps) {
        this.props = props;
        Object.freeze(this);
    }

    static create(input: CreateStagedProposalAuditEventProps): Result<StagedProposalAuditEvent, ValidationError> {
        const proposalID = input.proposalID?.trim();

        // Exit case - no proposal ID
        if(!proposalID) {
            return Result.fail(ValidationError.required('proposalID'));
        }

        const sessionID = input.sessionID?.trim();
        
        // Exit case - no session ID
        if(!sessionID) {
            return Result.fail(ValidationError.required('sessionID'));
        }

        const occurredAt = input.occurredAt ?? new Date();
        const metadata = isRecord(input.metadata) ? { ...input.metadata } : {};

        return Result.ok(new StagedProposalAuditEvent({
            id: crypto.randomUUID(),
            proposalID,
            sessionID,
            action: input.action,
            occurredAt,
            metadata,
        }));
    }

    static fromProps(props: StagedProposalAuditEventProps): StagedProposalAuditEvent {
        return new StagedProposalAuditEvent(props);
    }
}