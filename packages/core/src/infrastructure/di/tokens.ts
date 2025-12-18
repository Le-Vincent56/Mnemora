export const TOKENS = {
    // Infrastructure
    Database: Symbol('Dataase'),
    DatabaseManager: Symbol('DatabaseManager'),

    // Repositories
    EntityRepository: Symbol('EntityRepository'),
    SearchRepository: Symbol('SearchRepository'),

    // Services
    EventBus: Symbol('EventBus'),
    CommandHistory: Symbol('CommandHistory'),

    // Use Cases
    CreateCharacterUseCase: Symbol('CreateCharacterUseCase'),
    CreateLocationUseCase: Symbol('CreateLocationUseCase'),
    CreateFactionUseCase: Symbol('CreateFactionUseCase'),
    CreateSessionUseCase: Symbol('CreateSessionUseCase'),
    CreateNoteUseCase: Symbol('CreateNoteUseCase'),
    GetEntityUseCase: Symbol('GetEntityUseCase'),
    ListEntitiesUseCase: Symbol('ListEntitiesUseCase'),
    SearchEntitiesUseCase: Symbol('SearchEntitiesUseCase'),
    UpdateEntityUseCase: Symbol('UpdateEntityUseCase'),
    DeleteEntityUseCase: Symbol('DeleteEntityUseCase'),
} as const;