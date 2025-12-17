import { Result } from '../../domain/core/Result';
import { BaseEntity } from '../../domain/entities/BaseEntity';
import { Character } from '../../domain/entities/Character';
import { Location } from '../../domain/entities/Location';
import { Faction } from '../../domain/entities/Faction';
import { Session } from '../../domain/entities/Session';
import { Note } from '../../domain/entities/Note';
import { EntityType } from '../../domain/entities/EntityType';
import { EntityID } from '../../domain/value-objects/EntityID';
import type { IEntityRepository } from '../../domain/repositories/IEntityRepository';
import { EntityUpdatedEvent } from '../../domain/events/entityLifecycleEvents';
import type { IEventBus } from '../../domain/events/IEventBus';
import type { IUseCase } from './IUseCase';
import { UseCaseError } from './UseCaseError';
import type { UpdateEntityRequest } from '../dtos/RequestDTOs';
import type { EntityDTO } from '../dtos/EntityDTOs';
import { EntityMapper } from '../mappers/EntityMapper';

/**
 * Update an existing entity.
 * This is a generic use case that handles all entity types.
 * It determines the entity type at runtime and applies the appropriate updates.
 */
export class UpdateEntityUseCase implements IUseCase<UpdateEntityRequest, EntityDTO> {
    constructor(
        private readonly entityRepository: IEntityRepository,
        private readonly eventBus: IEventBus
    ) { }

    async execute(
        request: UpdateEntityRequest
    ): Promise<Result<EntityDTO, UseCaseError>> {
        // 1. Validate request
        if (!request.id?.trim()) {
            return Result.fail(UseCaseError.validation('Entity ID is required', 'id'));
        }

        // 2. Parse ID
        const entityIDResult = EntityID.fromString(request.id);
        if (entityIDResult.isFailure) {
            return Result.fail(UseCaseError.validation('Invalid entity ID', 'id'));
        }

        // 3. Load existing entity
        const findResult = await this.entityRepository.findByID(entityIDResult.value);

        if (findResult.isFailure) {
            return Result.fail(UseCaseError.repositoryError('Failed to load entity', findResult.error));
        }

        const entity = findResult.value;
        if (!entity) {
            return Result.fail(UseCaseError.notFound('Entity', request.id));
        }

        // 4. Apply updates based on entity type
        const updateResult = this.applyUpdates(entity, request);
        if (updateResult.isFailure) {
            return Result.fail(updateResult.error);
        }

        const changedFields = updateResult.value;

        // 5. Only persist if something changed
        if (changedFields.length === 0) {
            // No changes - just return the current state
            return Result.ok(EntityMapper.toDTO(entity));
        }

        // 6. Persist
        const saveResult = await this.entityRepository.save(entity);

        if (saveResult.isFailure) {
            return Result.fail(
                UseCaseError.repositoryError('Failed to save entity', saveResult.error)
            );
        }

        // 7. Publish event
        await this.eventBus.publish(
            new EntityUpdatedEvent(entity.id, entity.type, changedFields)
        );

        // 8. Return updated DTO
        return Result.ok(EntityMapper.toDTO(entity));
    }

    /**
     * Apply updates to the entity based on its type.
     * Returns the list of field names that were changed.
     */
    private applyUpdates(
        entity: BaseEntity,
        request: UpdateEntityRequest
    ): Result<string[], UseCaseError> {
        switch (entity.type) {
            case EntityType.CHARACTER:
                return this.updateCharacter(entity as Character, request);
            case EntityType.LOCATION:
                return this.updateLocation(entity as Location, request);
            case EntityType.FACTION:
                return this.updateFaction(entity as Faction, request);
            case EntityType.SESSION:
                return this.updateSession(entity as Session, request);
            case EntityType.NOTE:
                return this.updateNote(entity as Note, request);
            default:
                return Result.fail(
                    UseCaseError.invalidOperation(`Unknown entity type: ${entity.type}`)
                );
        }
    }

    private updateCharacter(
        character: Character,
        request: UpdateEntityRequest
    ): Result<string[], UseCaseError> {
        const changedFields: string[] = [];

        // Name
        if (request.name !== undefined) {
            const renameResult = character.rename(request.name);
            if (renameResult.isFailure) {
                return Result.fail(
                    UseCaseError.validation(renameResult.error.message, 'name')
                );
            }
            changedFields.push('name');
        }

        // Description
        if (request.description !== undefined) {
            character.updateDescription(request.description);
            changedFields.push('description');
        }

        // Secrets
        if (request.secrets !== undefined) {
            character.updateSecrets(request.secrets);
            changedFields.push('secrets');
        }

        // Tags
        if (request.tags !== undefined) {
            const tagsResult = character.setTags(request.tags as string[]);
            if (tagsResult.isFailure) {
                return Result.fail(
                    UseCaseError.validation(tagsResult.error.message, 'tags')
                );
            }
            changedFields.push('tags');
        }

        return Result.ok(changedFields);
    }

    private updateLocation(
        location: Location,
        request: UpdateEntityRequest
    ): Result<string[], UseCaseError> {
        const changedFields: string[] = [];

        if (request.name !== undefined) {
            const renameResult = location.rename(request.name);
            if (renameResult.isFailure) {
                return Result.fail(
                    UseCaseError.validation(renameResult.error.message, 'name')
                );
            }
            changedFields.push('name');
        }

        if (request.description !== undefined) {
            location.updateDescription(request.description);
            changedFields.push('description');
        }

        if (request.secrets !== undefined) {
            location.updateSecrets(request.secrets);
            changedFields.push('secrets');
        }

        if (request.tags !== undefined) {
            const tagsResult = location.setTags(request.tags as string[]);
            if (tagsResult.isFailure) {
                return Result.fail(
                    UseCaseError.validation(tagsResult.error.message, 'tags')
                );
            }
            changedFields.push('tags');
        }

        return Result.ok(changedFields);
    }

    private updateFaction(
        faction: Faction,
        request: UpdateEntityRequest
    ): Result<string[], UseCaseError> {
        const changedFields: string[] = [];

        if (request.name !== undefined) {
            const renameResult = faction.rename(request.name);
            if (renameResult.isFailure) {
                return Result.fail(
                    UseCaseError.validation(renameResult.error.message, 'name')
                );
            }
            changedFields.push('name');
        }

        if (request.description !== undefined) {
            faction.updateDescription(request.description);
            changedFields.push('description');
        }

        if (request.secrets !== undefined) {
            faction.updateSecrets(request.secrets);
            changedFields.push('secrets');
        }

        if (request.tags !== undefined) {
            const tagsResult = faction.setTags(request.tags as string[]);
            if (tagsResult.isFailure) {
                return Result.fail(
                    UseCaseError.validation(tagsResult.error.message, 'tags')
                );
            }
            changedFields.push('tags');
        }

        return Result.ok(changedFields);
    }

    private updateSession(
        session: Session,
        request: UpdateEntityRequest
    ): Result<string[], UseCaseError> {
        const changedFields: string[] = [];

        if (request.name !== undefined) {
            const renameResult = session.rename(request.name);
            if (renameResult.isFailure) {
                return Result.fail(
                    UseCaseError.validation(renameResult.error.message, 'name')
                );
            }
            changedFields.push('name');
        }

        // Session-specific: summary
        if (request.summary !== undefined) {
            session.updateSummary(request.summary);
            changedFields.push('summary');
        }

        // Session-specific: notes (prep notes)
        if (request.notes !== undefined) {
            session.updateNotes(request.notes);
            changedFields.push('notes');
        }

        if (request.secrets !== undefined) {
            session.updateSecrets(request.secrets);
            changedFields.push('secrets');
        }

        // Session-specific: sessionDate (can be null to clear)
        if (request.sessionDate !== undefined) {
            if (request.sessionDate === null) {
                session.setSessionDate(null);
            } else {
                const date = new Date(request.sessionDate);
                if (isNaN(date.getTime())) {
                    return Result.fail(
                        UseCaseError.validation('Invalid session date', 'sessionDate')
                    );
                }
                session.setSessionDate(date);
            }
            changedFields.push('sessionDate');
        }

        if (request.tags !== undefined) {
            const tagsResult = session.setTags(request.tags as string[]);
            if (tagsResult.isFailure) {
                return Result.fail(
                    UseCaseError.validation(tagsResult.error.message, 'tags')
                );
            }
            changedFields.push('tags');
        }

        return Result.ok(changedFields);
    }

    private updateNote(
        note: Note,
        request: UpdateEntityRequest
    ): Result<string[], UseCaseError> {
        const changedFields: string[] = [];

        if (request.name !== undefined) {
            const renameResult = note.rename(request.name);
            if (renameResult.isFailure) {
                return Result.fail(
                    UseCaseError.validation(renameResult.error.message, 'name')
                );
            }
            changedFields.push('name');
        }

        // Note-specific: content
        if (request.content !== undefined) {
            note.updateContent(request.content);
            changedFields.push('content');
        }

        if (request.tags !== undefined) {
            const tagsResult = note.setTags(request.tags as string[]);
            if (tagsResult.isFailure) {
                return Result.fail(
                    UseCaseError.validation(tagsResult.error.message, 'tags')
                );
            }
            changedFields.push('tags');
        }

        return Result.ok(changedFields);
    }
}