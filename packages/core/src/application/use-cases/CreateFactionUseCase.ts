import { Result } from '../../domain/core/Result';
import { Faction, CreateFactionProps } from '../../domain/entities/Faction';
import { EntityID } from '../../domain/value-objects/EntityID';
import type { IEntityRepository } from '../../domain/repositories/IEntityRepository';
import { EntityCreatedEvent } from '../../domain/events/entityLifecycleEvents';
import { EntityType } from '../../domain/entities/EntityType';
import type { IEventBus } from '../../domain/events/IEventBus';
import type { IUseCase } from './IUseCase';
import { UseCaseError } from './UseCaseError';
import type { CreateFactionRequest } from '../dtos/RequestDTOs';
import type { FactionDTO } from '../dtos/EntityDTOs';
import { EntityMapper } from '../mappers/EntityMapper';

/**
 * Use case: Create a new Faction.
 * Factions default to World-level (shared across campaigns).
 */
export class CreateFactionUseCase
    implements IUseCase<CreateFactionRequest, FactionDTO> {
    constructor(
        private readonly entityRepository: IEntityRepository,
        private readonly eventBus: IEventBus
    ) { }

    async execute(
        request: CreateFactionRequest
    ): Promise<Result<FactionDTO, UseCaseError>> {
        // 1. Validate request
        if (!request.name?.trim()) {
            return Result.fail(UseCaseError.validation('Name is required', 'name'));
        }
        if (!request.worldID?.trim()) {
            return Result.fail(UseCaseError.validation('World ID is required', 'worldId'));
        }

        // 2. Parse IDs
        const worldIDResult = EntityID.fromString(request.worldID);
        if (worldIDResult.isFailure) {
            return Result.fail(UseCaseError.validation('Invalid world ID', 'worldId'));
        }

        // 3. Build create props
        const createProps: CreateFactionProps = {
            name: request.name,
            worldID: worldIDResult.value,
        };

        if (request.campaignID) {
            const campaignIDResult = EntityID.fromString(request.campaignID);
            if (campaignIDResult.isFailure) {
                return Result.fail(UseCaseError.validation('Invalid campaign ID', 'campaignId'));
            }
            createProps.campaignID = campaignIDResult.value;
        }

        // 4. Create domain entity
        const factionResult = Faction.create(createProps);
        if (factionResult.isFailure) {
            return Result.fail(UseCaseError.validation(factionResult.error.message));
        }

        const faction = factionResult.value;

        // 5. Apply optional fields
        if (request.description) {
            faction.updateDescription(request.description);
        }
        if (request.secrets) {
            faction.updateSecrets(request.secrets);
        }
        if (request.tags && request.tags.length > 0) {
            const tagsResult = faction.setTags(request.tags as string[]);
            if (tagsResult.isFailure) {
                return Result.fail(UseCaseError.validation(tagsResult.error.message, 'tags'));
            }
        }

        // 6. Persist
        const saveResult = await this.entityRepository.save(faction);
        if (saveResult.isFailure) {
            return Result.fail(UseCaseError.repositoryError('Failed to save faction', saveResult.error));
        }

        // 7. Publish event
        await this.eventBus.publish(
            new EntityCreatedEvent(faction.id, EntityType.FACTION, faction.worldID, faction.campaignID)
        );

        // 8. Return DTO
        return Result.ok(EntityMapper.factionToDTO(faction));
    }
}