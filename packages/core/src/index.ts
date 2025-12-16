// @mnemora/core - Shared business logic
// This will export the public API

export const VERSION = '0.0.1';

// Domain Core
export { Result } from './domain/core/Result';
export {
    DomainError, 
    ValidationError, 
    NotFoundError, 
    ConflictError, 
    InvariantError
} from './domain/core/errors';

// Value Objects
export { EntityID } from './domain/value-objects/EntityID';
export { Name } from './domain/value-objects/Name';
export { RichText } from './domain/value-objects/RichText';
export { TagCollection } from './domain/value-objects/TagCollection';
export { Timestamps } from './domain/value-objects/Timestamps';

// Entities
export {
    EntityType,
    isEntityType,
    toEntityType
} from './domain/entities/EntityType';
export { BaseEntity } from './domain/entities/BaseEntity';
export {
    Character,
    type CreateCharacterProps,
    type CharacterProps
} from './domain/entities/Character';