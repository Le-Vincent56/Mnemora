import { Result } from "../../domain/core/Result";
import { Character, CreateCharacterProps } from "../../domain/entities/Character";
import { EntityID } from "../../domain/value-objects/EntityID";
import type { IEntityRepository } from "../../domain/repositories/IEntityRepository";
import { EntityCreatedEvent } from "../../domain/events/entityLifecycleEvents";
import { EntityType } from "../../domain/entities/EntityType";
import type { IEventBus } from "../../domain/events/IEventBus";
import type { IUseCase } from "./IUseCase";
import { UseCaseError } from "./UseCaseError";
import type { CreateCharacterRequest } from "../dtos";
import type { CharacterDTO } from "../dtos";
import { EntityMapper } from "../mappers/EntityMapper";

/**
 * Use case: Create a new Character.
 */
export class CreateCharacterUseCase implements IUseCase<CreateCharacterRequest, CharacterDTO> {
    constructor (
        private readonly entityRepository: IEntityRepository,
        private readonly eventBus: IEventBus
    ) { }
    
    async execute(request: CreateCharacterRequest): Promise<Result<CharacterDTO, UseCaseError>> {
        // 1. Validate the request
        const validationError = this.validate(request);
        if(validationError) {
            return Result.fail(validationError);
        }

        // 2. Parse IDs
        const worldIDResult = EntityID.fromString(request.worldID);
        if(worldIDResult.isFailure) {
            return Result.fail(UseCaseError.validation('Invalid world ID', 'worldID'));
        }

        // 3. Build create props (conditionally include campaignID)
        const createProps: CreateCharacterProps = {
            name: request.name,
            worldID: worldIDResult.value,
        };

        if(request.campaignID) {
            const campaignIDResult = EntityID.fromString(request.campaignID);
            if(campaignIDResult.isFailure) {
                return Result.fail(UseCaseError.validation('Invalid campaign ID', 'campaignID'));
            }
            createProps.campaignID = campaignIDResult.value;
        }

        // 4. Create domain entity
        const characterResult = Character.create(createProps);

        if(characterResult.isFailure) {
            return Result.fail(UseCaseError.validation(characterResult.error.message));
        }

        const character = characterResult.value;

        // 5. Apply optional fields
        if(request.description) {
            character.updateDescription(request.description);
        }

        if(request.secrets) {
            character.updateSecrets(request.secrets);
        }

        // 6. Apply tags
        if(request.tags && request.tags.length > 0) {
            const tagsResult = character.setTags(request.tags as string[]);
            if(tagsResult.isFailure) {
                return Result.fail(UseCaseError.validation(tagsResult.error.message, 'tags'));
            }
        }

        // 7. Persist
        const saveResult = await this.entityRepository.save(character);
        if(saveResult.isFailure) {
            return Result.fail(UseCaseError.repositoryError('Failed to save character', saveResult.error));
        }

        // 8. Publish domain event
        await this.eventBus.publish(
            new EntityCreatedEvent(
                character.id,
                EntityType.CHARACTER,
                character.worldID,
                character.campaignID
            )
        );

        // 9. Return DTO
        return Result.ok(EntityMapper.characterToDTO(character));
    }

    /**
     * Validate the request by ensuring it has a Name and World ID
     */
    private validate(request: CreateCharacterRequest): UseCaseError | null {
        if(!request.name?.trim()) {
            return UseCaseError.validation('Name is required', 'name');
        }

        if(!request.worldID?.trim()) {
            return UseCaseError.validation('World ID is required', 'worldiD');
        }

        return null;
    }
}