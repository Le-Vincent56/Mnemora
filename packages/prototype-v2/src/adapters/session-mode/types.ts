import type { ActiveSessionRunDTO } from '@mnemora/core/src/application/dtos/SessionRunDTOs';
import type { Result } from '@mnemora/core/src/domain/core/Result';

export interface SelectedSession {
    readonly sessionID: string;
    readonly sessionName: string;
}

export interface SessionModeStatus {
    readonly checking: boolean;
    readonly starting: boolean;
    readonly ending: boolean;
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
    selectSession(session: SelectedSession | null): void;
    refreshDetectedActiveRun(): Promise<void>;
    startSelectedSessionRun(): Promise<Result<ActiveSessionRunDTO, SessionModeError>>;
    resumeDetectedRun(): Result<void, SessionModeError>;
    endActiveSessionRun(durationSeconds: number): Promise<Result<void, SessionModeError>>;
    clearError(): void;
}