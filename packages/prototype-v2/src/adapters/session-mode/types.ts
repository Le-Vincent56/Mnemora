import type { ActiveSessionRunDTO } from '@mnemora/core/src/application/dtos/SessionRunDTOs';
import type { QuickNoteDTO, SessionSummaryDTO, StarsAndWishesDTO } from '@mnemora/core/src/application/dtos/SessionNotesDTOs';
import type {
    ReviewStagedProposalRequest,
    StagedProposalAuditEventDTO,
    StagedProposalDTO,
} from '@mnemora/core/src/application/dtos/StagedProposalsDTOs';
import type { StagedProposalKind } from '@mnemora/core/src/domain/value-objects/StagedProposal';
import type { Result } from '@mnemora/core/src/domain/core/Result';

export interface SelectedSession {
    readonly sessionID: string;
    readonly sessionName: string;
}

export interface SessionModeStatus {
    readonly checking: boolean;
    readonly starting: boolean;
    readonly ending: boolean;
    readonly notesLoading: boolean;
    readonly notesSaving: boolean;
    readonly proposalsLoading: boolean;
    readonly proposalsSaving: boolean;
}

export interface SessionNotesState {
    readonly quickNotes: readonly QuickNoteDTO[];
    readonly starsAndWishes: StarsAndWishesDTO | null;
}

export interface UndoRedoState {
    readonly canUndo: boolean;
    readonly canRedo: boolean;
    readonly undoCount: number;
    readonly redoCount: number;
    readonly nextUndoDescription: string | null;
    readonly nextRedoDescription: string | null;
}

export type SessionModeErrorCode =
    | 'SESSION_NOT_SELECTED'
    | 'NO_ACTIVE_SESSION'
    | 'CONFLICT'
    | 'NOT_FOUND'
    | 'VALIDATION'
    | 'INVALID_OPERATION'
    | 'REPOSITORY_ERROR'
    | 'UNKNOWN';
export interface SessionModeError {
    readonly code: SessionModeErrorCode;
    readonly message: string;
    readonly cause?: unknown;
}

export interface SessionModeContextValue {
    readonly selectedSession: SelectedSession | null;
    readonly detectedActiveRun: ActiveSessionRunDTO | null;
    readonly activeRun: ActiveSessionRunDTO | null;
    readonly status: SessionModeStatus;
    readonly error: SessionModeError | null;
    readonly notes: SessionNotesState;
    readonly undoRedo: UndoRedoState;
    selectSession(session: SelectedSession | null): void;
    refreshDetectedActiveRun(): Promise<void>;
    startSelectedSessionRun(): Promise<Result<ActiveSessionRunDTO, SessionModeError>>;
    resumeDetectedRun(): Result<void, SessionModeError>;
    endActiveSessionRun(durationSeconds: number): Promise<Result<void, SessionModeError>>;
    endActiveSessionWithSummary(durationSeconds: number): Promise<Result<SessionSummaryDTO, SessionModeError>>;
    refreshNotes(): Promise<void>;
    addQuickNote(content: string): Promise<Result<void, SessionModeError>>;
    updateQuickNote(noteID: string, content: string): Promise<Result<void, SessionModeError>>;
    removeQuickNote(noteID: string): Promise<Result<void, SessionModeError>>;
    addStar(star: string): Promise<Result<void, SessionModeError>>;
    removeStar(index: number): Promise<Result<void, SessionModeError>>;
    addWish(wish: string): Promise<Result<void, SessionModeError>>;
    removeWish(index: number): Promise<Result<void, SessionModeError>>;
    undo(): Promise<Result<void, SessionModeError>>;
    redo(): Promise<Result<void, SessionModeError>>;
    clearError(): void;
    listStagedProposals(sessionID: string, includeResolved?: boolean): Promise<Result<readonly StagedProposalDTO[], SessionModeError>>;
    listStagedProposalAuditEvents(proposalID: string): Promise<Result<readonly StagedProposalAuditEventDTO[], SessionModeError>>;
    stageProposal(input: { content: string; title?: string | null; kind?: StagedProposalKind }): Promise<Result<StagedProposalDTO, SessionModeError>>;
    reviewStagedProposal(request: ReviewStagedProposalRequest): Promise<Result<StagedProposalDTO, SessionModeError>>;
}
