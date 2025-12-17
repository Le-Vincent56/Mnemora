/**
 * DTO exports - all data transfer objects for the application layer.
 */

export type {
    BaseEntityDTO,
    CharacterDTO,
    LocationDTO,
    FactionDTO,
    SessionDTO,
    NoteDTO,
    EntityDTO,
} from './EntityDTOs';

export {
    isCharacterDTO,
    isLocationDTO,
    isFactionDTO,
    isSessionDTO,
    isNoteDTO
} from './EntityDTOs';

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
} from './RequestDTOs';

// Response DTOs
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
} from './ResponseDTOs';