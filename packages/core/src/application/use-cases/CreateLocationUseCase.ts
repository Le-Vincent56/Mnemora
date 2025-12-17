import { Result } from '../../domain/core/Result';
import { Location, CreateLocationProps } from '../../domain/entities/Location';
import { EntityID } from '../../domain/value-objects/EntityID';
import type { IEntityRepository } from '../../domain/repositories/IEntityRepository';
import { EntityCreatedEvent } from '../../domain/events/entityLifecycleEvents';
import { EntityType } from '../../domain/entities/EntityType';
import type { IEventBus } from '../../domain/events/IEventBus';
import type { IUseCase } from './IUseCase';
import { UseCaseError } from './UseCaseError';
import type { CreateLocationRequest } from '../dtos/RequestDTOs';
import type { LocationDTO } from '../dtos';
import { EntityMapper } from '../mappers/EntityMapper';

/**
 * Use case: Create a new Faction.
 * Factions default to World-level (shared across campaigns).
 */
export class CreateLocationUseCase
    implements IUseCase<CreateLocationRequest, LocationDTO> {
    constructor(
        private readonly entityRepository: IEntityRepository,
        private readonly eventBus: IEventBus
    ) { }

    async execute(
        request: CreateLocationRequest
    ): Promise<Result<LocationDTO, UseCaseError>> {
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
        const createProps: CreateLocationProps = {
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
        const locationResult = Location.create(createProps);
        if (locationResult.isFailure) {
            return Result.fail(UseCaseError.validation(locationResult.error.message));
        }

        const location = locationResult.value;

        // 5. Apply optional fields
        if (request.description) {
            location.updateDescription(request.description);
        }
        if (request.secrets) {
            location.updateSecrets(request.secrets);
        }

        if (request.tags && request.tags.length > 0) {
            const tagsResult = location.setTags(request.tags as string[]);
            if (tagsResult.isFailure) {
                return Result.fail(UseCaseError.validation(tagsResult.error.message, 'tags'));
            }
        }

        // 6. Persist
        const saveResult = await this.entityRepository.save(location);
        if (saveResult.isFailure) {
            return Result.fail(UseCaseError.repositoryError('Failed to save location', saveResult.error));
        }

        // 7. Publish event
        await this.eventBus.publish(
            new EntityCreatedEvent(location.id, EntityType.LOCATION, location.worldID, location.campaignID)
        );

        // 8. Return DTO
        return Result.ok(EntityMapper.locationToDTO(location));
    }
}