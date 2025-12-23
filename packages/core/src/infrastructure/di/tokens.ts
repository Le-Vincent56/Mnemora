export const TOKENS = {
    // Infrastructure
    Database: Symbol('Dataase'),
    DatabaseManager: Symbol('DatabaseManager'),

    // Repositories
    EntityRepository: Symbol('EntityRepository'),
    SearchRepository: Symbol('SearchRepository'),
    WorldRepository: Symbol('WorldRepository'),
    CampaignRepository: Symbol('CampaignRepository'),
    SafetyToolRepository: Symbol('SafetyToolRepository'),
    QuickNoteRepository: Symbol('QuickNoteRepository'),

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

    CreateWorldUseCase: Symbol('CreateWorldUseCase'),
    UpdateWorldUseCase: Symbol('UpdateWorldUseCase'),
    DeleteWorldUseCase: Symbol('DeleteWorldUseCase'),
    GetWorldUseCase: Symbol('GetWorldUseCase'),
    ListWorldsUseCase: Symbol('ListWorldsUseCase'),

    CreateCampaignUseCase: Symbol('CreateCampaignUseCase'),
    UpdateCampaignUseCase: Symbol('UpdateCampaignUseCase'),
    DeleteCampaignUseCase: Symbol('DeleteCampaignUseCase'),
    GetCampaignUseCase: Symbol('GetCampaignUseCase'),
    ListCampaignsUseCase: Symbol('ListCampaignsUseCase'),

    AddCustomSafetyToolUseCase: Symbol('AddCustomSafetyToolUseCase'),
    RemoveCustomSafetyToolUseCase: Symbol('RemoveCustomSafetyToolUseCase'),
    GetSafetyToolsUseCase: Symbol('GetSafetyToolsUseCase'),
    ConfigureSafetyToolsUseCase: Symbol('ConfigureSafetyToolsUseCase'),

    AddQuickNoteUseCase: Symbol('AddQuickNoteUseCase'),
    RemoveQuickNoteUseCase: Symbol('RemoveQuickNoteUseCase'),
    EndSessionWithSummaryUseCase: Symbol('EndSessionWithSummaryUseCase'),

    // ViewModels
    EntityEditorViewModel: Symbol('EntityEditorViewModel'),
    SearchViewModel: Symbol('SearchViewModel'),
    EntityListViewModel: Symbol('EntityListViewModel'),
    CommandHistoryViewModel: Symbol('CommandHistoryViewModel'),
} as const;