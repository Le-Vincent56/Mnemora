import { Result } from '../../domain/core/Result';
import { Note } from '../../domain/entities/Note';
import { EntityID } from '../../domain/value-objects/EntityID';
import type { IEntityRepository } from '../../domain/repositories/IEntityRepository';
import { EntityCreatedEvent } from '../../domain/events/entityLifecycleEvents';
import { EntityType } from '../../domain/entities/EntityType';
import type { IEventBus } from '../../domain/events/IEventBus';
import type { IUseCase } from './IUseCase';
import { UseCaseError } from './UseCaseError';
import type { CreateNoteRequest } from '../dtos/RequestDTOs';
import type { NoteDTO } from '../dtos/EntityDTOs';
import { EntityMapper } from '../mappers/EntityMapper';

/**
 * Use case: Create a new Note.
 * Notes are always campaign-scoped (campaign ID is required).
 */
export class CreateNoteUseCase
    implements IUseCase<CreateNoteRequest, NoteDTO> {
    constructor(
        private readonly entityRepository: IEntityRepository,
        private readonly eventBus: IEventBus
    ) { }

    async execute(
        request: CreateNoteRequest
    ): Promise<Result<NoteDTO, UseCaseError>> {
        // 1. Validate request (campaignId is REQUIRED for notes)
        if (!request.name?.trim()) {
            return Result.fail(UseCaseError.validation('Name is required', 'name'));
        }
        if (!request.worldID?.trim()) {
            return Result.fail(UseCaseError.validation('World ID is required', 'worldId'));
        }
        if (!request.campaignID?.trim()) {
            return Result.fail(UseCaseError.validation('Campaign ID is required for notes', 'campaignId'));
        }

        // 2. Parse IDs
        const worldIDResult = EntityID.fromString(request.worldID);
        if (worldIDResult.isFailure) {
            return Result.fail(UseCaseError.validation('Invalid world ID', 'worldId'));
        }

        const campaignIDResult = EntityID.fromString(request.campaignID);
        if (campaignIDResult.isFailure) {
            return Result.fail(UseCaseError.validation('Invalid campaign ID', 'campaignId'));
        }

        // 3. Create domain entity
        const noteResult = Note.create({
            name: request.name,
            worldID: worldIDResult.value,
            campaignID: campaignIDResult.value,
        });

        if (noteResult.isFailure) {
            return Result.fail(UseCaseError.validation(noteResult.error.message));
        }

        const note = noteResult.value;

        // 4. Apply optional fields
        if (request.content) {
            note.updateContent(request.content);
        }
        if (request.tags && request.tags.length > 0) {
            const tagsResult = note.setTags(request.tags as string[]);
            if (tagsResult.isFailure) {
                return Result.fail(UseCaseError.validation(tagsResult.error.message, 'tags'));
            }
        }

        // 5. Persist
        const saveResult = await this.entityRepository.save(note);
        if (saveResult.isFailure) {
            return Result.fail(UseCaseError.repositoryError('Failed to save note', saveResult.error));
        }

        // 6. Publish event
        await this.eventBus.publish(
            new EntityCreatedEvent(note.id, EntityType.NOTE, note.worldID, note.campaignID)
        );

        // 7. Return DTO
        return Result.ok(EntityMapper.noteToDTO(note));
    }
}