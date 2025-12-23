import { Result } from '../../domain/core/Result';
import { QuickNote } from '../../domain/value-objects/QuickNote';
import type { IEntityRepository } from '../../domain/repositories/IEntityRepository';
import type { IQuickNoteRepository } from '../../domain/repositories/IQuickNoteRepository';
import type { IUseCase } from './IUseCase';
import { UseCaseError } from './UseCaseError';
import type { AddQuickNoteRequest, AddQuickNoteResponse, QuickNoteDTO } from '../dtos/SessionNotesDTOs';
import { EntityID } from '../../domain/value-objects/EntityID';
import { EntityType } from '../../domain/entities/EntityType';

export class AddQuickNoteUseCase implements IUseCase<AddQuickNoteRequest, AddQuickNoteResponse> {
    constructor(
        private readonly entityRepository: IEntityRepository,
        private readonly quickNoteRepository: IQuickNoteRepository
    ) { }

    async execute(request: AddQuickNoteRequest): Promise<Result<AddQuickNoteResponse, UseCaseError>> {
        // 1. Validate request
        if (!request.sessionId?.trim()) {
            return Result.fail(UseCaseError.validation('Session ID is required', 'sessionId'));
        }

        if (!request.content?.trim()) {
            return Result.fail(UseCaseError.validation('Note content is required', 'content'));
        }

        // 2. Verify session exists and is of type SESSION
        const sessionId = EntityID.fromString(request.sessionId);
        if (sessionId.isFailure) {
            return Result.fail(UseCaseError.validation('Invalid session ID format', 'sessionId'));
        }

        const sessionResult = await this.entityRepository.findByID(sessionId.value);
        if (sessionResult.isFailure) {
            return Result.fail(UseCaseError.repositoryError('Failed to find session', sessionResult.error));
        }

        const session = sessionResult.value;
        if (!session) {
            return Result.fail(UseCaseError.notFound('Session', request.sessionId));
        }

        if (session.type !== EntityType.SESSION) {
            return Result.fail(UseCaseError.validation('Entity is not a session', 'sessionId'));
        }

        // 3. Create the QuickNote value object
        const noteResult = QuickNote.create(
            request.content,
            request.linkedEntityIds,
            request.visibility
        );

        if (noteResult.isFailure) {
            return Result.fail(UseCaseError.validation(noteResult.error.message));
        }

        const note = noteResult.value;

        // 4. Persist the note
        const saveResult = await this.quickNoteRepository.saveQuickNote(request.sessionId, note);
        if (saveResult.isFailure) {
            return Result.fail(UseCaseError.repositoryError('Failed to save quick note', saveResult.error));
        }

        // 5. Return the DTO
        const noteDTO: QuickNoteDTO = {
            id: note.id,
            content: note.content,
            capturedAt: note.capturedAt.toISOString(),
            linkedEntityIds: [...note.linkedEntityIds],
            visibility: note.visibility
        };

        return Result.ok({ note: noteDTO });
    }
}