import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ReactNode,
} from 'react';
import type { ActiveSessionRunDTO } from '@mnemora/core/src/application/dtos/SessionRunDTOs';
import type { UseCaseError } from '@mnemora/core/src/application/use-cases/UseCaseError';
import { StartSessionRunUseCase } from '@mnemora/core/src/application/use-cases/StartSessionRunUseCase';
import { GetActiveSessionRunUseCase } from '@mnemora/core/src/application/use-cases/GetActiveSessionRunUseCase';
import { EndSessionRunUseCase } from '@mnemora/core/src/application/use-cases/EndSessionRunUseCase';
import { Result } from '@mnemora/core/src/domain/core/Result';
import { PROTOTYPE_CAMPAIGN, PROTOTYPE_WORLD } from './constants';
import type { SessionModeContextValue, SessionModeError, SessionModeStatus, SelectedSession } from './types';
import { LocalStorageSessionRunRepository } from './infrastructure/LocalStorageSessionRunRepository';
import { SessionSelectionEntityRepository } from './infrastructure/SessionSelectionEntityRepository';
import { StaticCampaignRepository } from './infrastructure/StaticCampaignRepository';

const SessionModeContext = createContext<SessionModeContextValue | null>(null);

export function SessionModeProvider({ children }: { children: ReactNode }) {
    const [selectedSession, setSelectedSessionState] = useState<SelectedSession | null>(null);
    const selectedSessionRef = useRef<SelectedSession | null>(null);
    const [detectedActiveRun, setDetectedActiveRun] = useState<ActiveSessionRunDTO | null>(null);
    const [activeRun, setActiveRun] = useState<ActiveSessionRunDTO | null>(null);
    const [status, setStatus] = useState<SessionModeStatus>({
        checking: false,
        starting: false,
        ending: false,
    });

    const [error, setError] = useState<SessionModeError | null>(null);
    const selectSession = useCallback((session: SelectedSession | null) => {
        selectedSessionRef.current = session;
        setSelectedSessionState(session);
    }, []);

    const campaignRepository = useMemo(
        () => new StaticCampaignRepository(PROTOTYPE_CAMPAIGN.id),
        [],
    );

    const entityRepository = useMemo(
        () => new SessionSelectionEntityRepository({
            worldID: PROTOTYPE_WORLD.id,
            campaignID: PROTOTYPE_CAMPAIGN.id,
            getSelectedSession: () => selectedSessionRef.current,
        }),
        [],
    );

    const sessionRunRepository = useMemo(
        () => new LocalStorageSessionRunRepository((sessionID: string) => {
            const selected = selectedSessionRef.current;
            if (selected && selected.sessionID === sessionID) {
                return selected.sessionName;
            }
            return null;
        }),
        [],
    );

    const startUseCase = useMemo(
        () => new StartSessionRunUseCase(entityRepository, campaignRepository, sessionRunRepository),
        [entityRepository, campaignRepository, sessionRunRepository],
    );

    const getActiveUseCase = useMemo(
        () => new GetActiveSessionRunUseCase(campaignRepository, sessionRunRepository),
        [campaignRepository, sessionRunRepository],
    );

    const endUseCase = useMemo(
        () => new EndSessionRunUseCase(entityRepository, campaignRepository, sessionRunRepository),
        [entityRepository, campaignRepository, sessionRunRepository],
    );

    const mapUseCaseError = useCallback((e: UseCaseError): SessionModeError => {
        if (e.code === 'CONFLICT') {
            return { code: 'CONFLICT', message: e.message, cause: e.cause };
        }
        if (e.code === 'NOT_FOUND') {
            return { code: 'NOT_FOUND', message: e.message, cause: e.cause };
        }
        if (e.code === 'INVALID_OPERATION') {
            return { code: 'INVALID_OPERATION', message: e.message, cause: e.cause };
        }
        if (e.code === 'REPOSITORY_ERROR') {
            return { code: 'REPOSITORY_ERROR', message: e.message, cause: e.cause };
        }
        if (e.code.startsWith('VALIDATION_')) {
            return { code: 'VALIDATION', message: e.message, cause: e.cause };
        }
        return { code: 'UNKNOWN', message: e.message, cause: e.cause };
    }, []);

    const refreshDetectedActiveRun = useCallback(async () => {
        setStatus((prev) => ({ ...prev, checking: true }));
        setError(null);

        const result = await getActiveUseCase.execute({ campaignID: PROTOTYPE_CAMPAIGN.id });
        
        if (result.isSuccess) {
            setDetectedActiveRun(result.value);
        } else {
            setError(mapUseCaseError(result.error));
        }
        
        setStatus((prev) => ({ ...prev, checking: false }));
    }, [getActiveUseCase, mapUseCaseError]);

    useEffect(() => {
        void refreshDetectedActiveRun();
    }, [refreshDetectedActiveRun]);

    const startSelectedSessionRun = useCallback(async () => {
        const selected = selectedSessionRef.current;
        
        // Exit case - no session selected
        if (!selected) {
            const e: SessionModeError = {
                code: 'SESSION_NOT_SELECTED',
                message: 'Select a Session before starting Session Mode.',
            };
            setError(e);
            return Result.fail(e);
        }

        setStatus((prev) => ({ ...prev, starting: true }));
        setError(null);
        
        const result = await startUseCase.execute({ sessionID: selected.sessionID });
        
        // Exit case - setting the active run was successful
        if (result.isSuccess) {
            const dto = result.value;
            setDetectedActiveRun(dto);
            setActiveRun(dto);
            selectSession({ sessionID: dto.sessionID, sessionName: dto.sessionName });
            setStatus((prev) => ({ ...prev, starting: false }));
            return Result.ok(dto);
        }

        // Map and handle errors
        const mapped = mapUseCaseError(result.error);
        setError(mapped);
        setStatus((prev) => ({ ...prev, starting: false }));
        
        if (mapped.code === 'CONFLICT') {
            await refreshDetectedActiveRun();
        }

        return Result.fail(mapped);
    }, [mapUseCaseError, refreshDetectedActiveRun, selectSession, startUseCase]);

    const resumeDetectedRun = useCallback(() => {
        // Exit case - no deetected active run
        if (!detectedActiveRun) {
            const e: SessionModeError = {
                code: 'NO_ACTIVE_SESSION',
                message: 'No active session run to resume.',
            };
            setError(e);
            return Result.fail(e);
        }

        setError(null);
        setActiveRun(detectedActiveRun);
        selectSession({ sessionID: detectedActiveRun.sessionID, sessionName: detectedActiveRun.sessionName });
        
        return Result.okVoid();
    }, [detectedActiveRun, selectSession]);

    const endActiveSessionRun = useCallback(async (durationSeconds: number) => {
        const run = activeRun;
        
        // Exit case - no active session run
        if (!run) {
            const e: SessionModeError = {
                code: 'NO_ACTIVE_SESSION',
                message: 'No active session run to end.',
            };
            setError(e);
            return Result.fail(e);
        }

        setStatus((prev) => ({ ...prev, ending: true }));
        setError(null);

        const result = await endUseCase.execute({
            sessionId: run.sessionID,
            durationSeconds,
        });

        // Exit case - ending the active session was successful
        if (result.isSuccess) {
            setActiveRun(null);
            setDetectedActiveRun(null);
            setStatus((prev) => ({ ...prev, ending: false }));
            return Result.okVoid();
        }

        const mapped = mapUseCaseError(result.error);
        setError(mapped);
        setStatus((prev) => ({ ...prev, ending: false }));

        return Result.fail(mapped);
    }, [activeRun, endUseCase, mapUseCaseError]);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    const value = useMemo<SessionModeContextValue>(() => ({
        selectedSession,
        detectedActiveRun,
        activeRun,
        status,
        error,
        selectSession,
        refreshDetectedActiveRun,
        startSelectedSessionRun,
        resumeDetectedRun,
        endActiveSessionRun,
        clearError,
    }), [
        selectedSession,
        detectedActiveRun,
        activeRun,
        status,
        error,
        selectSession,
        refreshDetectedActiveRun,
        startSelectedSessionRun,
        resumeDetectedRun,
        endActiveSessionRun,
        clearError,
    ]);

    return (
        <SessionModeContext.Provider value={value}>
            {children}
        </SessionModeContext.Provider>
    );
}

export function useSessionMode(): SessionModeContextValue {
    const ctx = useContext(SessionModeContext);
    
    // Exit case - no context
    if (!ctx) {
        throw new Error('useSessionMode must be used within a SessionModeProvider');
    }

    return ctx;
}