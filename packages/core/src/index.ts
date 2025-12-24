// @mnemora/core - Shared business logic
// This will export the public API

export const VERSION = '0.0.1';

// ==============================
//          DOMAIN LAYER
// ==============================

// Domain Core
export { Result } from './domain/core/Result';
export {
    DomainError,
    ValidationError,
    NotFoundError,
    ConflictError,
    InvariantError,
    RepositoryError
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

export {
    Location,
    type CreateLocationProps,
    type LocationProps
} from './domain/entities/Location';

export {
    Faction,
    type CreateFactionProps,
    type FactionProps
} from './domain/entities/Faction';

export {
    Session,
    type CreateSessionProps,
    type SessionProps
} from './domain/entities/Session';

export {
    Note,
    type CreateNoteProps,
    type NoteProps
} from './domain/entities/Note';

// Repository Interfaces
export type {
    IEntityRepository,
    EntityFilter,
    PaginationOptions,
    PaginatedResult
} from './domain/repositories/IEntityRepository';

export {
    SearchMode,
    type ISearchRepository,
    type SearchQuery,
    type SearchHighlight,
    type SearchResult,
    type SearchResponse as DomainSearchResponse
} from './domain/repositories/ISearchRepository';

// Domain Events
export {
    DomainEvent,
    type DomainEventType,
    type DomainEventTypeName
} from './domain/events/DomainEvent';

export {
    EntityCreatedEvent,
    EntityUpdatedEvent,
    EntityDeletedEvent,
    EntityForkedEvent
} from './domain/events/entityLifecycleEvents';

export {
    EntityIndexedEvent,
    EntityRemovedFromIndexEvent
} from './domain/events/searchEvents';

export type {
    IEventBus,
    EventHandler,
    Unsubscribe
} from './domain/events/IEventBus';

// Type-specific fields
export {
    TYPE_SPECIFIC_FIELD_NAMES,
    TypeSpecificFieldsWrapper,
    type CharacterFields,
    type LocationFields,
    type FactionFields,
    type NoteFields,
    type SessionFields,
    type TypeSpecificFields,
} from './domain/value-objects/TypeSpecificFields';

// Primer prompts
export {
    PRIMER_PROMPTS,
    getRandomPrimerPrompt,
    getPrimerPrompt,
    getAllPrimerPrompts,
    getPrimerPromptCount,
    getPrimerPromptsForType,
} from './domain/constants/primerPrompts';

// ==============================
//      APPLICATION LAYER
// ==============================

// Event Bus
export { EventBus } from './application/services/EventBus';

// DTOs - Entity
export type {
    BaseEntityDTO,
    CharacterDTO,
    LocationDTO,
    FactionDTO,
    SessionDTO,
    NoteDTO,
    EntityDTO
} from './application/dtos/EntityDTOs';

export {
    isCharacterDTO,
    isLocationDTO,
    isFactionDTO,
    isSessionDTO,
    isNoteDTO
} from './application/dtos/EntityDTOs';

// DTOs - Request
export type {
    CreateCharacterRequest,
    CreateLocationRequest,
    CreateFactionRequest,
    CreateSessionRequest,
    CreateNoteRequest,
    UpdateEntityRequest,
    DeleteEntityRequest,
    ForkEntityRequest,
    SearchEntitiesRequest,
    GetEntityRequest,
    ListEntitiesRequest,
} from './application/dtos/RequestDTOs';

// DTOs - Response
export type {
    EntityResponse,
    EntityListResponse,
    SearchResultDTO,
    SearchHighlightDTO,
    SearchResponse,
    DeleteResponse,
    ForkResponse,
    BatchResponse,
    BatchFailure,
} from './application/dtos/ResponseDTOs';

// Commands
export type { ICommand } from './application/commands/ICommand';
export { BaseCommand, CommandError } from './application/commands/ICommand';
export type { CommandSnapshot, CommandHistoryOptions } from './application/commands/CommandHistory';
export { CommandHistory } from './application/commands/CommandHistory';
export { CreateEntityCommand } from './application/commands/CreateEntityCommand';
export { UpdateEntityCommand } from './application/commands/UpdateEntityCommand';
export { DeleteEntityCommand } from './application/commands/DeleteEntityCommand';

// Use Cases
export type { IUseCase } from './application/use-cases/IUseCase';
export { UseCaseError } from './application/use-cases/UseCaseError';

// Use Cases - Create
export { CreateCharacterUseCase } from './application/use-cases/CreateCharacterUseCase';
export { CreateLocationUseCase } from './application/use-cases/CreateLocationUseCase';
export { CreateFactionUseCase } from './application/use-cases/CreateFactionUseCase';
export { CreateSessionUseCase } from './application/use-cases/CreateSessionUseCase';
export { CreateNoteUseCase } from './application/use-cases/CreateNoteUseCase';

// Use Cases - Read
export { GetEntityUseCase } from './application/use-cases/GetEntityUseCase';
export { ListEntitiesUseCase } from './application/use-cases/ListEntitiesUseCase';
export { SearchEntitiesUseCase } from './application/use-cases/SearchEntitiesUseCase';

// Use Cases - Update
export { UpdateEntityUseCase } from './application/use-cases/UpdateEntityUseCase';

// Use Cases - Delete
export { DeleteEntityUseCase } from './application/use-cases/DeleteEntityUseCase';

// Mappers
export { EntityMapper } from './application/mappers/EntityMapper';

// ==============================
//      INFRASTRUCTURE LAYER
// ==============================

// Database
export {
    DatabaseManager,
    type DatabaseConfig
} from './infrastructure/database/DatabaseManager';

export type {
    EntityRow,
    SearchResultRow
} from './infrastructure/database/types';

// Repositories
export { SQLiteEntityRepository } from './infrastructure/repositories/SQLiteEntityRepository';
export { SQLiteSearchRepository } from './infrastructure/repositories/SQLiteSearchRepository';

// Mappers
export { DatabaseMapper } from './infrastructure/mappers/DatabaseMapper';

// DI Container
export { Container } from './infrastructure/di/Container';
export { TOKENS } from './infrastructure/di/tokens';
export { createContainer } from './infrastructure/di/setup';

// ==============================
//       PRESENTATION LAYER
// ==============================

// Animations
export {
    TIMING,
    EASING,
    ANIMATION_PRESETS,
} from './presentation/animations';

export type {
    TimingKey,
    EasingKey,
    AnimationPresetKey,
} from './presentation/animations';

// ViewModel Types
export type {
    LoadingState,
    AsyncState,
    IDisposable,
    IViewModel,
} from './presentation/view-models/types';

export {
    ViewModelError,
    createAsyncState,
    loadingState,
    successState,
    errorState,
} from './presentation/view-models/types';

// ViewModels
export { EntityEditorViewModel } from './presentation/view-models/EntityEditorViewModel';
export type { EntityEditorViewModelOptions } from './presentation/view-models/EntityEditorViewModel';
export { SearchViewModel } from './presentation/view-models/SearchViewModel';
export type { SearchViewModelOptions } from './presentation/view-models/SearchViewModel';
export { EntityListViewModel } from './presentation/view-models/EntityListViewModel';
export type { EntityListViewModelOptions } from './presentation/view-models/EntityListViewModel';
export { CommandHistoryViewModel } from './presentation/view-models/CommandHistoryViewModel';