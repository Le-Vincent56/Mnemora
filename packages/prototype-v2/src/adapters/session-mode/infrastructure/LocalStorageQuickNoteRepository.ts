import { Result } from '@mnemora/core/src/domain/core/Result';
import { RepositoryError } from '@mnemora/core/src/domain/core/errors';
import type { IQuickNoteRepository } from '@mnemora/core/src/domain/repositories/IQuickNoteRepository';
import { QuickNote, type QuickNoteVisibility } from '@mnemora/core/src/domain/value-objects/QuickNote';
import { StarsAndWishes } from '@mnemora/core/src/domain/value-objects/StarsAndWishes';
import { SESSION_NOTES_STORAGE_KEY } from '../constants';
import {
    getOrCreateNotesList,
    mutateSessionNotesState,
    readSessionNotesState,
    type SessionNotesQuickNoteRecord,
} from './SessionNotesLocalStorage';

function parseISODate(value: string | null): Date | null {
    if (!value) return null;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
}

export class LocalStorageQuickNoteRepository implements IQuickNoteRepository {
    constructor(private readonly storageKey: string = SESSION_NOTES_STORAGE_KEY) { }

    async findBySessionID(sessionID: string): Promise<Result<QuickNote[], RepositoryError>> {
        try {
            const stateResult = readSessionNotesState(this.storageKey);

            // Exit case - if the read failed
            if (stateResult.isFailure) return Result.fail(stateResult.error);

            const list = stateResult.value.notesBySession[sessionID] ?? [];
            const notes = list
                .map((r) => this.recordToQuickNote(r))
                .sort((a, b) => a.capturedAt.getTime() - b.capturedAt.getTime());

            return Result.ok(notes);
        } catch (error) {
            return Result.fail(new RepositoryError('Failed to find quick notes', error));
        }
    }

    async saveQuickNote(sessionID: string, note: QuickNote): Promise<Result<void, RepositoryError>> {
        try {
            const mutation = mutateSessionNotesState<void>(this.storageKey, (state) => {
                const list = getOrCreateNotesList(state, sessionID);
                const idx = list.findIndex((n) => n.id === note.id);

                const record: SessionNotesQuickNoteRecord = {
                    id: note.id,
                    content: note.content,
                    capturedAt: note.capturedAt.toISOString(),
                    linkedEntityIDs: [...note.linkedEntityIDs],
                    visibility: note.visibility,
                };

                if (idx >= 0) {
                    list[idx] = record;
                } else {
                    list.push(record);
                }

                list.sort((a, b) => {
                    const da = parseISODate(a.capturedAt)?.getTime() ?? 0;
                    const db = parseISODate(b.capturedAt)?.getTime() ?? 0;
                    return da - db;
                });
            });

            return mutation.map(() => undefined);
        } catch (error) {
            return Result.fail(new RepositoryError('Failed to save quick note', error));
        }
    }

    async deleteQuickNote(noteID: string): Promise<Result<void, RepositoryError>> {
        try {
            const mutation = mutateSessionNotesState<void>(this.storageKey, (state) => {
                for (const [sessionId, list] of Object.entries(state.notesBySession)) {
                    const next = list.filter((n) => n.id !== noteID);
                    state.notesBySession[sessionId] = next;
                }
            });

            return mutation.map(() => undefined);
        } catch (error) {
            return Result.fail(new RepositoryError('Failed to delete quick note', error));
        }
    }

    async deleteAllForSession(sessionID: string): Promise<Result<void, RepositoryError>> {
        try {
            const mutation = mutateSessionNotesState<void>(this.storageKey, (state) => {
                state.notesBySession[sessionID] = [];
            });

            return mutation.map(() => undefined);
        } catch (error) {
            return Result.fail(new RepositoryError('Failed to delete quick notes', error));
        }
    }

    async findFeedbackBySessionID(sessionID: string): Promise<Result<StarsAndWishes | null, RepositoryError>> {
        try {
            const stateResult = readSessionNotesState(this.storageKey);
            
            // Exit case - failed to read the state
            if (stateResult.isFailure) return Result.fail(stateResult.error);

            const rec = stateResult.value.feedbackBySession[sessionID] ?? null;
            
            // Exit case - failed to get the feedback
            if (!rec) return Result.ok(null);

            const collectedAt = parseISODate(rec.collectedAt) ?? new Date();
            return Result.ok(StarsAndWishes.fromProps({
                stars: [...rec.stars],
                wishes: [...rec.wishes],
                collectedAt,
            }));
        } catch (error) {
            return Result.fail(new RepositoryError('Failed to find session feedback', error));
        }
    }

    async saveFeedback(sessionID: string, feedback: StarsAndWishes): Promise<Result<void, RepositoryError>> {
        try {
            const mutation = mutateSessionNotesState<void>(this.storageKey, (state) => {
                // Match SQLite behavior: empty feedback == no rows == null
                state.feedbackBySession[sessionID] = feedback.isEmpty
                    ? null
                    : {
                        stars: [...feedback.stars],
                        wishes: [...feedback.wishes],
                        collectedAt: feedback.collectedAt.toISOString(),
                    };
            });

            return mutation.map(() => undefined);
        } catch (error) {
            return Result.fail(new RepositoryError('Failed to save session feedback', error));
        }
    }

    async deleteFeedbackForSession(sessionID: string): Promise<Result<void, RepositoryError>> {
        try {
            const mutation = mutateSessionNotesState<void>(this.storageKey, (state) => {
                state.feedbackBySession[sessionID] = null;
            });

            return mutation.map(() => undefined);
        } catch (error) {
            return Result.fail(new RepositoryError('Failed to delete session feedback', error));
        }
    }

    private recordToQuickNote(record: SessionNotesQuickNoteRecord): QuickNote {
        return QuickNote.fromProps({
            id: record.id,
            content: record.content,
            capturedAt: parseISODate(record.capturedAt) ?? new Date(),
            linkedEntityIDs: [...record.linkedEntityIDs],
            visibility: record.visibility as QuickNoteVisibility,
        });
    }
}
