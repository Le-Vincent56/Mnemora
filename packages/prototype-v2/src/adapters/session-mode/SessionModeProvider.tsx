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
import type { SessionSummaryDTO } from '@mnemora/core/src/application/dtos/SessionNotesDTOs';
import type { UseCaseError } from '@mnemora/core/src/application/use-cases/UseCaseError';
import { StartSessionRunUseCase } from '@mnemora/core/src/application/use-cases/StartSessionRunUseCase';
import { GetActiveSessionRunUseCase } from '@mnemora/core/src/application/use-cases/GetActiveSessionRunUseCase';
import { EndSessionRunUseCase } from '@mnemora/core/src/application/use-cases/EndSessionRunUseCase';
import { EndSessionWithSummaryUseCase } from '@mnemora/core/src/application/use-cases/EndSessionWithSummaryUseCase';
import { Result } from '@mnemora/core/src/domain/core/Result';
import type { ViewModelError } from '@mnemora/core/src/presentation/view-models/types';
import { SessionNotesViewModel } from '@mnemora/core/src/presentation/view-models/SessionNotesViewModel';
import { PROTOTYPE_CAMPAIGN, PROTOTYPE_WORLD } from './constants';
import type { SessionModeContextValue, SessionModeError, SessionModeStatus, SelectedSession, SessionNotesState, UndoRedoState } from './types';
import { LocalStorageSessionRunRepository } from './infrastructure/LocalStorageSessionRunRepository';
import { LocalStorageQuickNoteRepository } from './infrastructure/LocalStorageQuickNoteRepository';
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
        notesLoading: false,
        notesSaving: false,
    });

    const [notes, setNotes] = useState<SessionNotesState>({
        quickNotes: [],
        starsAndWishes: null,
    });

    const [undoRedo, setUndoRedo] = useState<UndoRedoState>({
        canUndo: false,
        canRedo: false,
        undoCount: 0,
        redoCount: 0,
        nextUndoDescription: null,
        nextRedoDescription: null,
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

    const quickNoteRepository = useMemo(
        () => new LocalStorageQuickNoteRepository(),
        [],
    );

    const sessionNotesViewModel = useMemo(
        () => new SessionNotesViewModel(entityRepository, quickNoteRepository),
        [entityRepository, quickNoteRepository],
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

    const endWithSummaryUseCase = useMemo(
        () => new EndSessionWithSummaryUseCase(entityRepository, quickNoteRepository, sessionRunRepository),
        [entityRepository, quickNoteRepository, sessionRunRepository],
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

    const mapViewModelError = useCallback((e: ViewModelError): SessionModeError => {
        if (e.code === 'VALIDATION_ERROR') {
            return { code: 'VALIDATION', message: e.message, cause: e };
        }
        if (e.code === 'NOT_FOUND') {
            return { code: 'NOT_FOUND', message: e.message, cause: e };
        }
        if (e.code === 'OPERATION_ERROR') {
            return { code: 'REPOSITORY_ERROR', message: e.message, cause: e };
        }
        return { code: 'UNKNOWN', message: e.message, cause: e };
    }, []);

    const syncNotesState = useCallback(() => {
        setNotes({
            quickNotes: [...sessionNotesViewModel.quickNotes],
            starsAndWishes: sessionNotesViewModel.starsAndWishes,
        });

        setUndoRedo({
            canUndo: sessionNotesViewModel.canUndo,
            canRedo: sessionNotesViewModel.canRedo,
            undoCount: sessionNotesViewModel.undoCount,
            redoCount: sessionNotesViewModel.redoCount,
            nextUndoDescription: sessionNotesViewModel.nextUndoDescription,
            nextRedoDescription: sessionNotesViewModel.nextRedoDescription,
        });
    }, [sessionNotesViewModel]);

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

    const refreshNotes = useCallback(async () => {
        const run = activeRun;

        if (!run) {
            sessionNotesViewModel.reset();
            setNotes({ quickNotes: [], starsAndWishes: null });
            setUndoRedo({
                canUndo: false,
                canRedo: false,
                undoCount: 0,
                redoCount: 0,
                nextUndoDescription: null,
                nextRedoDescription: null,
            });
            return;
        }

        setStatus((prev) => ({ ...prev, notesLoading: true }));
        setError(null);

        await sessionNotesViewModel.load(run.sessionID);
        syncNotesState();

        setStatus((prev) => ({ ...prev, notesLoading: false }));
    }, [activeRun, sessionNotesViewModel, syncNotesState]);

    useEffect(() => {
        void refreshNotes();
    }, [refreshNotes]);

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

    const endActiveSessionWithSummary = useCallback(async (durationSeconds: number) => {
        const run = activeRun;

        // Exit case - no active run
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

        const stars = notes.starsAndWishes?.stars ?? [];
        const wishes = notes.starsAndWishes?.wishes ?? [];

        const request = {
            sessionId: run.sessionID,
            durationSeconds,
            ...(notes.starsAndWishes
                ? { starsAndWishes: { stars: [...stars], wishes: [...wishes] } }
                : {}),
        };

        const result = await endWithSummaryUseCase.execute(request);

        // Exit case - ending was successful
        if (result.isSuccess) {
            const dto: SessionSummaryDTO = result.value;
            setActiveRun(null);
            setDetectedActiveRun(null);
            sessionNotesViewModel.reset();
            setNotes({ quickNotes: [], starsAndWishes: null });
            setUndoRedo({
                canUndo: false,
                canRedo: false,
                undoCount: 0,
                redoCount: 0,
                nextUndoDescription: null,
                nextRedoDescription: null,
            });
            setStatus((prev) => ({ ...prev, ending: false }));
            return Result.ok(dto);
        }

        const mapped = mapUseCaseError(result.error);
        setError(mapped);
        setStatus((prev) => ({ ...prev, ending: false }));
        return Result.fail(mapped);
    }, [activeRun, endWithSummaryUseCase, mapUseCaseError, notes.starsAndWishes, sessionNotesViewModel]);

    const addQuickNote = useCallback(async (content: string) => {
        // Exit case - there is no active run
        if (!activeRun) {
            const e: SessionModeError = { code: 'NO_ACTIVE_SESSION', message: 'No active session.' };
            setError(e);
            return Result.fail(e);
        }

        setStatus((prev) => ({ ...prev, notesSaving: true }));
        setError(null);

        const result = await sessionNotesViewModel.addQuickNote(content);
        syncNotesState();
        setStatus((prev) => ({ ...prev, notesSaving: false }));

        // Exit case - failed to create a quick note
        if (result.isFailure) {
            const mapped = mapViewModelError(result.error);
            setError(mapped);
            return Result.fail(mapped);
        }

        return Result.okVoid();
    }, [activeRun, mapViewModelError, sessionNotesViewModel, syncNotesState]);

    const updateQuickNote = useCallback(async (noteId: string, content: string) => {
        // Exit case - there is no active run
        if (!activeRun) {
            const e: SessionModeError = { code: 'NO_ACTIVE_SESSION', message: 'No active session.' };
            setError(e);
            return Result.fail(e);
        }

        setStatus((prev) => ({ ...prev, notesSaving: true }));
        setError(null);

        const result = await sessionNotesViewModel.updateQuickNote(noteId, content);
        syncNotesState();
        setStatus((prev) => ({ ...prev, notesSaving: false }));

        // Exit case - failed to update the quick note
        if (result.isFailure) {
            const mapped = mapViewModelError(result.error);
            setError(mapped);
            return Result.fail(mapped);
        }

        return Result.okVoid();
    }, [activeRun, mapViewModelError, sessionNotesViewModel, syncNotesState]);

    const removeQuickNote = useCallback(async (noteId: string) => {
        // Exit case - there is no active run
        if (!activeRun) {
            const e: SessionModeError = { code: 'NO_ACTIVE_SESSION', message: 'No active session.' };
            setError(e);
            return Result.fail(e);
        }

        setStatus((prev) => ({ ...prev, notesSaving: true }));
        setError(null);

        const result = await sessionNotesViewModel.removeQuickNote(noteId);
        syncNotesState();
        setStatus((prev) => ({ ...prev, notesSaving: false }));

        // Exit case - failed to remove the quick note
        if (result.isFailure) {
            const mapped = mapViewModelError(result.error);
            setError(mapped);
            return Result.fail(mapped);
        }

        return Result.okVoid();
    }, [activeRun, mapViewModelError, sessionNotesViewModel, syncNotesState]);

    const setFeedback = useCallback(async (stars: readonly string[], wishes: readonly string[]) => {
        // Exit case - there is no active run
        if (!activeRun) {
            const e: SessionModeError = { code: 'NO_ACTIVE_SESSION', message: 'No active session.' };
            setError(e);
            return Result.fail(e);
        }

        setStatus((prev) => ({ ...prev, notesSaving: true }));
        setError(null);

        const result = await sessionNotesViewModel.setSessionFeedback(stars, wishes);
        syncNotesState();
        setStatus((prev) => ({ ...prev, notesSaving: false }));

        // Exit case - failed to set the feedback
        if (result.isFailure) {
            const mapped = mapViewModelError(result.error);
            setError(mapped);
            return Result.fail(mapped);
        }

        return Result.okVoid();
    }, [activeRun, mapViewModelError, sessionNotesViewModel, syncNotesState]);

    const addStar = useCallback(async (star: string) => {
        const currentStars = notes.starsAndWishes?.stars ?? [];
        const currentWishes = notes.starsAndWishes?.wishes ?? [];
        return setFeedback([...currentStars, star], currentWishes);
    }, [notes.starsAndWishes, setFeedback]);

    const removeStar = useCallback(async (index: number) => {
        const currentStars = notes.starsAndWishes?.stars ?? [];
        const currentWishes = notes.starsAndWishes?.wishes ?? [];
        return setFeedback(currentStars.filter((_, i) => i !== index), currentWishes);
    }, [notes.starsAndWishes, setFeedback]);

    const addWish = useCallback(async (wish: string) => {
        const currentStars = notes.starsAndWishes?.stars ?? [];
        const currentWishes = notes.starsAndWishes?.wishes ?? [];
        return setFeedback(currentStars, [...currentWishes, wish]);
    }, [notes.starsAndWishes, setFeedback]);

    const removeWish = useCallback(async (index: number) => {
        const currentStars = notes.starsAndWishes?.stars ?? [];
        const currentWishes = notes.starsAndWishes?.wishes ?? [];
        return setFeedback(currentStars, currentWishes.filter((_, i) => i !== index));
    }, [notes.starsAndWishes, setFeedback]);

    const undo = useCallback(async () => {
        setStatus((prev) => ({ ...prev, notesSaving: true }));
        setError(null);

        const result = await sessionNotesViewModel.undo();
        syncNotesState();
        setStatus((prev) => ({ ...prev, notesSaving: false }));

        // Exit case - failed to undo
        if (result.isFailure) {
            const mapped = mapViewModelError(result.error);
            setError(mapped);
            return Result.fail(mapped);
        }

        return Result.okVoid();
    }, [mapViewModelError, sessionNotesViewModel, syncNotesState]);

    const redo = useCallback(async () => {
        setStatus((prev) => ({ ...prev, notesSaving: true }));
        setError(null);

        const result = await sessionNotesViewModel.redo();
        syncNotesState();
        setStatus((prev) => ({ ...prev, notesSaving: false }));

        // Exit case - failed to redo
        if (result.isFailure) {
            const mapped = mapViewModelError(result.error);
            setError(mapped);
            return Result.fail(mapped);
        }

        return Result.okVoid();
    }, [mapViewModelError, sessionNotesViewModel, syncNotesState]);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    const value = useMemo<SessionModeContextValue>(() => ({
        selectedSession,
        detectedActiveRun,
        activeRun,
        status,
        error,
        notes,
        undoRedo,
        selectSession,
        refreshDetectedActiveRun,
        startSelectedSessionRun,
        resumeDetectedRun,
        endActiveSessionRun,
        endActiveSessionWithSummary,
        refreshNotes,
        addQuickNote,
        updateQuickNote,
        removeQuickNote,
        addStar,
        removeStar,
        addWish,
        removeWish,
        undo,
        redo,
        clearError,
    }), [
        selectedSession,
        detectedActiveRun,
        activeRun,
        status,
        error,
        notes,
        undoRedo,
        selectSession,
        refreshDetectedActiveRun,
        startSelectedSessionRun,
        resumeDetectedRun,
        endActiveSessionRun,
        endActiveSessionWithSummary,
        refreshNotes,
        addQuickNote,
        updateQuickNote,
        removeQuickNote,
        addStar,
        removeStar,
        addWish,
        removeWish,
        undo,
        redo,
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
