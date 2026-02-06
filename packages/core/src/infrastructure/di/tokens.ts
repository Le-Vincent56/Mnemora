export const TOKENS = {
    // Infrastructure
    Database: Symbol('Database'),
    DatabaseManager: Symbol('DatabaseManager'),

    // Repositories
    EntityRepository: Symbol('EntityRepository'),
    SearchRepository: Symbol('SearchRepository'),
    WorldRepository: Symbol('WorldRepository'),
    CampaignRepository: Symbol('CampaignRepository'),
    SafetyToolRepository: Symbol('SafetyToolRepository'),
    QuickNoteRepository: Symbol('QuickNoteRepository'),
    ContinuityRepository: Symbol('ContinuityRepository'),
    DriftRepository: Symbol('DriftRepository'),

    // Services
    EventBus: Symbol('EventBus'),
    CommandHistory: Symbol('CommandHistory'),
    EventStatePropagator: Symbol('EventStatePropagator'),
    DriftDetector: Symbol('DriftDetector'),

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

    CreateContinuityUseCase: Symbol('CreateContinuityUseCase'),
    GetContinuityUseCase: Symbol('GetContinuityUseCase'),
    ListContinuitiesUseCase: Symbol('ListContinuitiesUseCase'),
    CreateEventUseCase: Symbol('CreateEventUseCase'),
    UpdateContinuityUseCase: Symbol('UpdateContinuityUseCase'),
    DeleteContinuityUseCase: Symbol('DeleteContinuityUseCase'),
    BranchContinuityUseCase: Symbol('BranchContinuityUseCase'),

    ListDriftsUseCase: Symbol('ListDriftsUseCase'),
    ResolveDriftUseCase: Symbol('ResolveDriftUseCase'),

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

    ResolveMentionUseCase: Symbol('ResolveMentionUseCase'),

    // ViewModels
    EntityEditorViewModel: Symbol('EntityEditorViewModel'),
    SearchViewModel: Symbol('SearchViewModel'),
    EntityListViewModel: Symbol('EntityListViewModel'),
    CommandHistoryViewModel: Symbol('CommandHistoryViewModel'),
} as const;