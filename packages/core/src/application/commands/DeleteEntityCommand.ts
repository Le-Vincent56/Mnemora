import { Result } from '../../domain/core/Result';
import { BaseEntity } from '../../domain/entities/BaseEntity';
import { Character, CharacterProps } from '../../domain/entities/Character';
import { Location, LocationProps } from '../../domain/entities/Location';
import { Faction, FactionProps } from '../../domain/entities/Faction';
import { Session, SessionProps } from '../../domain/entities/Session';
import { Note, NoteProps } from '../../domain/entities/Note';
import { EntityType } from '../../domain/entities/EntityType';
import { EntityID } from '../../domain/value-objects/EntityID';
import { Name } from '../../domain/value-objects/Name';
import { RichText } from '../../domain/value-objects/RichText';
import { TagCollection } from '../../domain/value-objects/TagCollection';
import { Timestamps } from '../../domain/value-objects/Timestamps';
import type { IEntityRepository } from '../../domain/repositories/IEntityRepository';
import type { IEventBus } from '../../domain/events/IEventBus';
import {
    EntityDeletedEvent,
    EntityCreatedEvent,
} from '../../domain/events/entityLifecycleEvents';
import { BaseCommand, CommandError } from './ICommand';

/**
 * Full snapshot of entity for recreation.
 */
interface FullEntitySnapshot {
    id: string;
    type: EntityType;
    name: string;
    tags: string[];
    worldID: string;
    campaignID: string | null;
    forkedFrom: string | null;
    createdAt: string;
    modifiedAt: string;
    // Type-specific
    description?: string;
    secrets?: string;
    content?: string;
    summary?: string;
    notes?: string;
    sessionDate?: string | null;
}

/**
 * Command: Delete an entity.
 * Undo behavior: Recreates the deleted entity from a previous snapshot.
 */
export class DeleteEntityCommand extends BaseCommand {
    private deletedEntitySnapshot: FullEntitySnapshot | null = null;

    constructor(
        private readonly entityID: EntityID,
        private readonly entityRepository: IEntityRepository,
        private readonly eventBus: IEventBus
    ) {
        super(true); // canUndo = true
    }

    async execute(): Promise<Result<void, CommandError>> {
        try {
            // 1. Load entity to capture its state
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

            // 2. Capture full state for undo
            this.deletedEntitySnapshot = this.captureFullSnapshot(entity);

            // 3. Delete
            const deleteResult = await this.entityRepository.delete(this.entityID);
            if (deleteResult.isFailure) {
                return Result.fail(
                    CommandError.executionFailed('Failed to delete entity', deleteResult.error)
                );
            }

            this.markExecuted();

            // 4. Publish event
            await this.eventBus.publish(
                new EntityDeletedEvent(this.entityID, entity.type)
            );

            return Result.okVoid();
        } catch (error) {
            return Result.fail(CommandError.executionFailed('Failed to delete entity', error));
        }
    }

    async undo(): Promise<Result<void, CommandError>> {
        if (!this.deletedEntitySnapshot) {
            return Result.fail(CommandError.noStateToRestore());
        }

        try {
            // 1. Recreate the entity from snapshot
            const entityResult = this.recreateEntity(this.deletedEntitySnapshot);
            if (entityResult.isFailure) {
                return Result.fail(entityResult.error);
            }

            const entity = entityResult.value;

            // 2. Save
            const saveResult = await this.entityRepository.save(entity);
            if (saveResult.isFailure) {
                return Result.fail(
                    CommandError.undoFailed('Failed to recreate entity', saveResult.error)
                );
            }

            // 3. Publish event
            await this.eventBus.publish(
                new EntityCreatedEvent(
                    entity.id,
                    entity.type,
                    EntityID.fromStringOrThrow(this.deletedEntitySnapshot.worldID),
                    this.deletedEntitySnapshot.campaignID
                        ? EntityID.fromStringOrThrow(this.deletedEntitySnapshot.campaignID)
                        : null
                )
            );

            return Result.okVoid();
        } catch (error) {
            return Result.fail(CommandError.undoFailed('Failed to undo entity deletion', error));
        }
    }

    describe(): string {
        const type = this.deletedEntitySnapshot?.type.toLowerCase() ?? 'entity';
        const name = this.deletedEntitySnapshot?.name ?? this.entityID.toString();
        return `Delete ${type} '${name}'`;
    }

    private captureFullSnapshot(entity: BaseEntity): FullEntitySnapshot {
        const base: FullEntitySnapshot = {
            id: entity.id.toString(),
            type: entity.type,
            name: (entity as any).name.toString(),
            tags: (entity as any).tags.toArray(),
            worldID: (entity as any).worldID.toString(),
            campaignID: (entity as any).campaignID?.toString() ?? null,
            forkedFrom: (entity as any).forkedFrom?.toString() ?? null,
            createdAt: entity.createdAt.toISOString(),
            modifiedAt: entity.modifiedAt.toISOString(),
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

    private recreateEntity(
        snapshot: FullEntitySnapshot
    ): Result<BaseEntity, CommandError> {
        try {
            const id = EntityID.fromStringOrThrow(snapshot.id);
            const name = Name.create(snapshot.name);
            if (name.isFailure) {
                return Result.fail(CommandError.undoFailed(`Invalid name: ${name.error.message}`));
            }

            const tags = TagCollection.fromArray(snapshot.tags);
            if (tags.isFailure) {
                return Result.fail(CommandError.undoFailed(`Invalid tags: ${tags.error.message}`));
            }

            const timestamps = Timestamps.fromStrings(snapshot.createdAt, snapshot.modifiedAt);
            if (timestamps.isFailure) {
                return Result.fail(CommandError.undoFailed(`Invalid timestamps: ${timestamps.error.message}`));
            }

            const worldID = EntityID.fromStringOrThrow(snapshot.worldID);
            const campaignID = snapshot.campaignID
                ? EntityID.fromStringOrThrow(snapshot.campaignID)
                : null;
            const forkedFrom = snapshot.forkedFrom
                ? EntityID.fromStringOrThrow(snapshot.forkedFrom)
                : null;

            switch (snapshot.type) {
                case EntityType.CHARACTER: {
                    const props: CharacterProps = {
                        id,
                        name: name.value,
                        description: RichText.fromString(snapshot.description ?? ''),
                        secrets: RichText.fromString(snapshot.secrets ?? ''),
                        tags: tags.value,
                        worldID,
                        campaignID,
                        forkedFrom,
                        timestamps: timestamps.value,
                    };
                    return Result.ok(Character.fromProps(props));
                }
                case EntityType.LOCATION: {
                    const props: LocationProps = {
                        id,
                        name: name.value,
                        description: RichText.fromString(snapshot.description ?? ''),
                        secrets: RichText.fromString(snapshot.secrets ?? ''),
                        tags: tags.value,
                        worldID,
                        campaignID,
                        forkedFrom,
                        timestamps: timestamps.value,
                    };
                    return Result.ok(Location.fromProps(props));
                }
                case EntityType.FACTION: {
                    const props: FactionProps = {
                        id,
                        name: name.value,
                        description: RichText.fromString(snapshot.description ?? ''),
                        secrets: RichText.fromString(snapshot.secrets ?? ''),
                        tags: tags.value,
                        worldID,
                        campaignID,
                        forkedFrom,
                        timestamps: timestamps.value,
                    };
                    return Result.ok(Faction.fromProps(props));
                }
                case EntityType.SESSION: {
                    const props: SessionProps = {
                        id,
                        name: name.value,
                        summary: RichText.fromString(snapshot.summary ?? ''),
                        notes: RichText.fromString(snapshot.notes ?? ''),
                        secrets: RichText.fromString(snapshot.secrets ?? ''),
                        tags: tags.value,
                        worldID,
                        campaignID: campaignID!, // Sessions always have campaignID
                        sessionDate: snapshot.sessionDate ? new Date(snapshot.sessionDate) : null,
                        timestamps: timestamps.value,
                        quickNotes: [],
                        starsAndWishes: null,
                        duration: null,
                    };
                    return Result.ok(Session.fromProps(props));
                }
                case EntityType.NOTE: {
                    const props: NoteProps = {
                        id,
                        name: name.value,
                        content: RichText.fromString(snapshot.content ?? ''),
                        tags: tags.value,
                        worldID,
                        campaignID: campaignID!, // Notes always have campaignID
                        timestamps: timestamps.value,
                    };
                    return Result.ok(Note.fromProps(props));
                }
                default:
                    return Result.fail(
                        CommandError.undoFailed(`Unknown entity type: ${snapshot.type}`)
                    );
            }
        } catch (error) {
            return Result.fail(CommandError.undoFailed('Failed to recreate entity', error));
        }
    }
}