import { Result } from '../core/Result';
import { ValidationError } from '../core/errors';

const MAX_TITLE_LENGTH = 120;
const MAX_CONTENT_LENGTH = 4000;

export const STAGED_PROPOSAL_KINDS = [
    'other',
    'npc',
    'location',
    'clue',
    'item',
    'secret',
    'ruling',
    'task',
] as const;

export type StagedProposalKind = typeof STAGED_PROPOSAL_KINDS[number];

export function isStagedProposalKind(value: string): value is StagedProposalKind {
    return (STAGED_PROPOSAL_KINDS as readonly string[]).includes(value);
}

export const STAGED_PROPOSAL_STATUSES = [
    'open',
    'accepted',
    'deferred',
    'discarded',
    'merged',
] as const;

export type StagedProposalStatus = typeof STAGED_PROPOSAL_STATUSES[number];

export function isStagedProposalStatus(value: string): value is StagedProposalStatus {
    return (STAGED_PROPOSAL_STATUSES as readonly string[]).includes(value);
}

export type MergeTargetType = 'proposal' | 'canon';

export interface MergeTarget {
    readonly type: MergeTargetType;
    readonly targetID: string;
}

export interface StagedProposalProps {
    readonly id: string;
    readonly sessionID: string;
    readonly kind: StagedProposalKind;
    readonly title: string | null;
    readonly content: string;
    readonly status: StagedProposalStatus;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly mergedTarget: MergeTarget | null;
}

export interface CreateStagedProposalProps {
    readonly sessionID: string;
    readonly kind?: StagedProposalKind;
    readonly title?: string | null;
    readonly content: string;
    readonly createdAt?: Date;
}

/**
 * StagedProposal: a durable, reviewable "candidate change"
 * captured during Session Mode. Immutable snapshot; updates are done
 * by replacement.
 */
export class StagedProposal {
    private readonly props: StagedProposalProps;
    
    get id(): string { return this.props.id; }
    get sessionID(): string { return this.props.sessionID; }
    get kind(): StagedProposalKind { return this.props.kind; }
    get title(): string | null { return this.props.title; }
    get content(): string { return this.props.content; }
    get status(): StagedProposalStatus { return this.props.status; }
    get createdAt(): Date { return this.props.createdAt; }
    get updatedAt(): Date { return this.props.updatedAt; }
    get mergedTarget(): MergeTarget | null { return this.props.mergedTarget; }

    private constructor(props: StagedProposalProps) {
        this.props = props;
        Object.freeze(this);
    }

    static create(input: CreateStagedProposalProps): Result<StagedProposal, ValidationError> {
        const sessionID = input.sessionID?.trim();
        
        // Exit case - no session ID
        if(!sessionID) {
            return Result.fail(ValidationError.required('sessionID'));
        }

        const kind: StagedProposalKind = input.kind ?? 'other';
        const titleResult = StagedProposal.normalizeTitle(input.title);

        // Exit case - failed to normalize the title
        if(titleResult.isFailure) return Result.fail(titleResult.error);

        const contentResult = StagedProposal.normalizeContent(input.content);
        
        // Exit case - failed to normalize content
        if(contentResult.isFailure) return Result.fail(contentResult.error);

        const createdAt = input.createdAt ?? new Date();

        return Result.ok(new StagedProposal({
            id: crypto.randomUUID(),
            sessionID,
            kind,
            title: titleResult.value,
            content: contentResult.value,
            status: 'open',
            createdAt,
            updatedAt: createdAt,
            mergedTarget: null,
        }));
    }

    static fromProps(props: StagedProposalProps): StagedProposal {
        return new StagedProposal(props);
    }

    withTitle(title: string | null): Result<StagedProposal, ValidationError> {
        const normalized = StagedProposal.normalizeTitle(title);

        // Exit case - failed to normalize the title
        if(normalized.isFailure) return Result.fail(normalized.error);

        return Result.ok(new StagedProposal({
            ...this.props,
            title: normalized.value,
            updatedAt: new Date(),
        }));
    }

    withContent(content: string): Result<StagedProposal, ValidationError> {
        const normalized = StagedProposal.normalizeContent(content);
        
        // Exit case - failed to normalize the content
        if(normalized.isFailure) return Result.fail(normalized.error);

        return Result.ok(new StagedProposal({
            ...this.props,
            content: normalized.value,
            updatedAt: new Date(),
        }));
    }

    reclassify(kind: StagedProposalKind): StagedProposal {
        return new StagedProposal({
            ...this.props,
            kind,
            updatedAt: new Date(),
        });
    }

    accept(): StagedProposal {
        return new StagedProposal({
            ...this.props,
            status: 'accepted',
            updatedAt: new Date(),
        });
    }

    defer(): StagedProposal {
        return new StagedProposal({
            ...this.props,
            status: 'deferred',
            updatedAt: new Date(),
        });
    }

    discard(): StagedProposal {
        return new StagedProposal({
            ...this.props,
            status: 'discarded',
            updatedAt: new Date(),
        });
    }

    merge(target: MergeTarget): Result<StagedProposal, ValidationError> {
        const targetID = target.targetID?.trim();
        
        // Exit case - no target ID
        if(!targetID) {
            return Result.fail(ValidationError.required('mergeTargetID'));
        }

        const type: MergeTargetType = target.type === 'canon' ? 'canon' : 'proposal';
        
        return Result.ok(new StagedProposal({
            ...this.props,
            status: 'merged',
            mergedTarget: { type, targetID },
            updatedAt: new Date(),
        }));
    }

    private static normalizeTitle(title: string | null | undefined): Result<string | null, ValidationError> {
        // Exit case - the title is null or undefined
        if(title === null || title === undefined) return Result.ok(null);

        const trimmed = title.trim();

        // Exit case - the trimmed title's length is 0
        if(trimmed.length === 0) return Result.ok(null);

        // Exit case - the trimmed title's length is greater than the max
        if(trimmed.length > MAX_TITLE_LENGTH) {
            return Result.fail(ValidationError.tooLong('title', MAX_TITLE_LENGTH));
        }

        return Result.ok(trimmed);
    }

    private static normalizeContent(content: string): Result<string, ValidationError> {
        const trimmed = content.trim();

        // Exit case - the trimmed content's length equals 0
        if (trimmed.length === 0) {
            return Result.fail(new ValidationError('Proposal content cannot be empty', 'content'));
        }

        // Exit case - the trimmed content's length is greater than the max
        if (trimmed.length > MAX_CONTENT_LENGTH) {
            return Result.fail(ValidationError.tooLong('content', MAX_CONTENT_LENGTH));
        }
        
        return Result.ok(trimmed);
    }
}