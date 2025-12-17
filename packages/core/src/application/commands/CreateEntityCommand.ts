import { Result } from '../../domain/core/Result';
import { BaseEntity } from '../../domain/entities/BaseEntity';
import { EntityID } from '../../domain/value-objects/EntityID';
import type { IEntityRepository } from '../../domain/repositories/IEntityRepository';
import type { IEventBus } from '../../domain/events/IEventBus';
import { EntityCreatedEvent } from '../../domain/events/entityLifecycleEvents';
import { EntityDeletedEvent } from '../../domain/events/entityLifecycleEvents';
import { BaseCommand, CommandError } from './ICommand';

export class CreateEntityCommand extends BaseCommand {
    /** The ID of the created entity (set after execute) */
    private createdEntityID: EntityID | null = null;

    constructor(
        private readonly entity: BaseEntity,
        private readonly entityRepository: IEntityRepository,
        private readonly eventBus: IEventBus
    ) {
        super(true); // canUndo = true
    }

    async execute(): Promise<Result<void, CommandError>> {
        try {
            // Save the entity
            const saveResult = await this.entityRepository.save(this.entity);
            if (saveResult.isFailure) {
                return Result.fail(
                    CommandError.executionFailed('Failed to create entity', saveResult.error)
                );
            }

            // Store the ID for undo
            this.createdEntityID = this.entity.id;
            this.markExecuted();

            // Publish event
            await this.eventBus.publish(
                new EntityCreatedEvent(
                    this.entity.id,
                    this.entity.type,
                    this.getWorldID(),
                    this.getCampaignID()
                )
            );

            return Result.okVoid();
        } catch (error) {
            return Result.fail(CommandError.executionFailed('Failed to create entity', error));
        }
    }

    async undo(): Promise<Result<void, CommandError>> {
        if (!this.createdEntityID) {
            return Result.fail(CommandError.noStateToRestore());
        }

        try {
            // Delete the created entity
            const deleteResult = await this.entityRepository.delete(this.createdEntityID);
            if (deleteResult.isFailure) {
                return Result.fail(
                    CommandError.undoFailed('Failed to delete entity during undo', deleteResult.error)
                );
            }

            // Publish delete event
            await this.eventBus.publish(
                new EntityDeletedEvent(this.createdEntityID, this.entity.type)
            );

            return Result.okVoid();
        } catch (error) {
            return Result.fail(CommandError.undoFailed('Failed to undo entity creation', error));
        }
    }

    describe(): string {
        return `Create ${this.entity.type.toLowerCase()} '${this.getEntityName()}'`;
    }

    /** Get the created entity's ID (available after execute) */
    getCreatedEntityID(): EntityID | null {
        return this.createdEntityID;
    }

    // Helper methods to access entity properties safely
    private getEntityName(): string {
        // All entities have a 'name' property
        return (this.entity as any).name?.toString() ?? 'unnamed';
    }

    private getWorldID(): EntityID {
        return (this.entity as any).worldID;
    }

    private getCampaignID(): EntityID | null {
        return (this.entity as any).campaignID ?? null;
    }
}