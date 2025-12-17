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
import type { IEventBus } from '../../domain/events/IEventBus';
import { EntityUpdatedEvent } from '../../domain/events/entityLifecycleEvents';
import { BaseCommand, CommandError } from './ICommand';
import type { UpdateEntityRequest } from '../dtos/RequestDTOs';

/**
 * Snapshot of entity state for restoration.
 * Stores all mutable fields as primitives.
 */
interface EntitySnapshot {
    id: string;
    type: EntityType;
    name: string;
    description?: string;
    secrets?: string;
    content?: string;
    summary?: string;
    notes?: string;
    sessionDate?: string | null;
    tags: string[];
}

/**
 * Command: Update an entity.
 * Undo behavior: Restores the entity to its previous state.
 */
export class UpdateEntityCommand extends BaseCommand {
    private previousState: EntitySnapshot | null = null;
    private changedFields: string[] = [];

    constructor(
        private readonly entityID: EntityID,
        private readonly changes: UpdateEntityRequest,
        private readonly entityRepository: IEntityRepository,
        private readonly eventBus: IEventBus
    ) {
        super(true); // canUndo = true
    }

    async execute(): Promise<Result<void, CommandError>> {
        try {
            // 1. Load current entity
            const findResult = await this.entityRepository.findByID(this.entityID);
            if (findResult.isFailure) {
                return Result.fail(
                    CommandError.executionFailed('Failed to load entity', findResult.error)
                );
            }

            const entity = findResult.value;
            if (!entity) {
                return Result.fail(
                    CommandError.executionFailed(`Entity not found: ${this.entityID.toString()}`)
                );
            }

            // 2. Capture current state for undo
            this.previousState = this.captureSnapshot(entity);

            // 3. Apply changes
            const applyResult = this.applyChanges(entity);
            if (applyResult.isFailure) {
                return Result.fail(applyResult.error);
            }

            this.changedFields = applyResult.value;

            // 4. Save if anything changed
            if (this.changedFields.length > 0) {
                const saveResult = await this.entityRepository.save(entity);
                if (saveResult.isFailure) {
                    return Result.fail(
                        CommandError.executionFailed('Failed to save entity', saveResult.error)
                    );
                }

                // Publish event
                await this.eventBus.publish(
                    new EntityUpdatedEvent(entity.id, entity.type, this.changedFields)
                );
            }

            this.markExecuted();
            return Result.okVoid();
        } catch (error) {
            return Result.fail(CommandError.executionFailed('Failed to update entity', error));
        }
    }

    async undo(): Promise<Result<void, CommandError>> {
        if (!this.previousState) {
            return Result.fail(CommandError.noStateToRestore());
        }

        try {
            // 1. Load current entity
            const findResult = await this.entityRepository.findByID(this.entityID);
            if (findResult.isFailure) {
                return Result.fail(
                    CommandError.undoFailed('Failed to load entity', findResult.error)
                );
            }

            const entity = findResult.value;
            if (!entity) {
                return Result.fail(
                    CommandError.undoFailed(`Entity not found: ${this.entityID.toString()}`)
                );
            }

            // 2. Restore previous state
            const restoreResult = this.restoreSnapshot(entity, this.previousState);
            if (restoreResult.isFailure) {
                return Result.fail(restoreResult.error);
            }

            // 3. Save
            const saveResult = await this.entityRepository.save(entity);
            if (saveResult.isFailure) {
                return Result.fail(
                    CommandError.undoFailed('Failed to save entity', saveResult.error)
                );
            }

            // 4. Publish event
            await this.eventBus.publish(
                new EntityUpdatedEvent(entity.id, entity.type, this.changedFields)
            );

            return Result.okVoid();
        } catch (error) {
            return Result.fail(CommandError.undoFailed('Failed to undo entity update', error));
        }
    }

    describe(): string {
        const fields = this.changedFields.length > 0
            ? ` (${this.changedFields.join(', ')})`
            : '';
        return `Update entity '${this.entityID.toString()}'${fields}`;
    }

    private captureSnapshot(entity: BaseEntity): EntitySnapshot {
        const base: EntitySnapshot = {
            id: entity.id.toString(),
            type: entity.type,
            name: (entity as any).name.toString(),
            tags: (entity as any).tags.toArray(),
        };

        switch (entity.type) {
            case EntityType.CHARACTER:
            case EntityType.LOCATION:
            case EntityType.FACTION: {
                const e = entity as Character | Location | Faction;
                return {
                    ...base,
                    description: e.description.value,
                    secrets: e.secrets.value,
                };
            }
            case EntityType.SESSION: {
                const s = entity as Session;
                return {
                    ...base,
                    summary: s.summary.value,
                    notes: s.notes.value,
                    secrets: s.secrets.value,
                    sessionDate: s.sessionDate?.toISOString() ?? null,
                };
            }
            case EntityType.NOTE: {
                const n = entity as Note;
                return {
                    ...base,
                    content: n.content.value,
                };
            }
            default:
                return base;
        }
    }

    private restoreSnapshot(
        entity: BaseEntity,
        snapshot: EntitySnapshot
    ): Result<void, CommandError> {
        try {
            // Restore name
            const renameResult = (entity as any).rename(snapshot.name);
            if (renameResult.isFailure) {
                return Result.fail(
                    CommandError.undoFailed(`Failed to restore name: ${renameResult.error.message}`)
                );
            }

            // Restore tags
            const tagsResult = (entity as any).setTags(snapshot.tags);
            if (tagsResult.isFailure) {
                return Result.fail(
                    CommandError.undoFailed(`Failed to restore tags: ${tagsResult.error.message}`)
                );
            }

            // Restore type-specific fields
            switch (entity.type) {
                case EntityType.CHARACTER:
                case EntityType.LOCATION:
                case EntityType.FACTION: {
                    const e = entity as Character | Location | Faction;
                    e.updateDescription(snapshot.description ?? '');
                    e.updateSecrets(snapshot.secrets ?? '');
                    break;
                }
                case EntityType.SESSION: {
                    const s = entity as Session;
                    s.updateSummary(snapshot.summary ?? '');
                    s.updateNotes(snapshot.notes ?? '');
                    s.updateSecrets(snapshot.secrets ?? '');
                    s.setSessionDate(
                        snapshot.sessionDate ? new Date(snapshot.sessionDate) : null
                    );
                    break;
                }
                case EntityType.NOTE: {
                    const n = entity as Note;
                    n.updateContent(snapshot.content ?? '');
                    break;
                }
            }

            return Result.okVoid();
        } catch (error) {
            return Result.fail(CommandError.undoFailed('Failed to restore entity state', error));
        }
    }

    private applyChanges(entity: BaseEntity): Result<string[], CommandError> {
        const changedFields: string[] = [];

        try {
            // Name (all entities)
            if (this.changes.name !== undefined) {
                const result = (entity as any).rename(this.changes.name);
                if (result.isFailure) {
                    return Result.fail(
                        CommandError.executionFailed(`Invalid name: ${result.error.message}`)
                    );
                }
                changedFields.push('name');
            }

            // Tags (all entities)
            if (this.changes.tags !== undefined) {
                const result = (entity as any).setTags(this.changes.tags as string[]);
                if (result.isFailure) {
                    return Result.fail(
                        CommandError.executionFailed(`Invalid tags: ${result.error.message}`)
                    );
                }
                changedFields.push('tags');
            }

            // Type-specific fields
            switch (entity.type) {
                case EntityType.CHARACTER:
                case EntityType.LOCATION:
                case EntityType.FACTION: {
                    const e = entity as Character | Location | Faction;
                    if (this.changes.description !== undefined) {
                        e.updateDescription(this.changes.description);
                        changedFields.push('description');
                    }
                    if (this.changes.secrets !== undefined) {
                        e.updateSecrets(this.changes.secrets);
                        changedFields.push('secrets');
                    }
                    break;
                }
                case EntityType.SESSION: {
                    const s = entity as Session;
                    if (this.changes.summary !== undefined) {
                        s.updateSummary(this.changes.summary);
                        changedFields.push('summary');
                    }
                    if (this.changes.notes !== undefined) {
                        s.updateNotes(this.changes.notes);
                        changedFields.push('notes');
                    }
                    if (this.changes.secrets !== undefined) {
                        s.updateSecrets(this.changes.secrets);
                        changedFields.push('secrets');
                    }
                    if (this.changes.sessionDate !== undefined) {
                        const date = this.changes.sessionDate
                            ? new Date(this.changes.sessionDate)
                            : null;
                        if (this.changes.sessionDate && date && isNaN(date.getTime())) {
                            return Result.fail(
                                CommandError.executionFailed('Invalid session date')
                            );
                        }
                        s.setSessionDate(date);
                        changedFields.push('sessionDate');
                    }
                    break;
                }
                case EntityType.NOTE: {
                    const n = entity as Note;
                    if (this.changes.content !== undefined) {
                        n.updateContent(this.changes.content);
                        changedFields.push('content');
                    }
                    break;
                }
            }

            return Result.ok(changedFields);
        } catch (error) {
            return Result.fail(CommandError.executionFailed('Failed to apply changes', error));
        }
    }
}