import { Result } from '../../domain/core/Result';
import type { IQuickNoteRepository } from '../../domain/repositories/IQuickNoteRepository';
import type { IUseCase } from './IUseCase';
import { UseCaseError } from './UseCaseError';
import type { RemoveQuickNoteRequest } from '../dtos/SessionNotesDTOs';

export class RemoveQuickNoteUseCase implements IUseCase<RemoveQuickNoteRequest, void> {
    constructor(
        private readonly quickNoteRepository: IQuickNoteRepository
    ) { }

    async execute(request: RemoveQuickNoteRequest): Promise<Result<void, UseCaseError>> {
        // 1. Validate request
        if (!request.sessionId?.trim()) {
            return Result.fail(UseCaseError.validation('Session ID is required', 'sessionId'));
        }

        if (!request.noteId?.trim()) {
            return Result.fail(UseCaseError.validation('Note ID is required', 'noteId'));
        }

        // 2. Delete the note (idempotent - succeeds even if note doesn't exist)
        const deleteResult = await this.quickNoteRepository.deleteQuickNote(request.noteId);
        if (deleteResult.isFailure) {
            return Result.fail(UseCaseError.repositoryError('Failed to delete quick note', deleteResult.error));
        }

        return Result.ok(undefined);
    }
}