import { Container } from './Container';
import { TOKENS } from './tokens';
import { DatabaseManager, DatabaseConfig } from '../database/DatabaseManager';
import { SQLiteEntityRepository } from '../repositories/SQLiteEntityRepository';
import { SQLiteSearchRepository } from '../repositories/SQLiteSearchRepository';
import { SQLiteWorldRepository } from '../repositories/SQLiteWorldRepository';
import { SQLiteCampaignRepository } from '../repositories/SQLiteCampaignRepository';
import { SQLiteSafetyToolRepository } from '../repositories/SQLiteSafetyToolRepository';
import { SQLiteQuickNoteRepository } from '../repositories/SQLiteQuickNoteRepository';
import { SQLiteContinuityRepository } from '../repositories/SQLiteContinuityRepository';
import { SQLiteDriftRepository } from '../repositories/SQLiteDriftRepository';
import { EventBus } from '../../application/services/EventBus';
import { CommandHistory } from '../../application/commands/CommandHistory';
import { EventStatePropagator } from '../../domain/services/EventStatePropagator';
import { DriftDetector } from '../../domain/services/DriftDetector';
import {
    CreateCharacterUseCase,
    CreateLocationUseCase,
    CreateFactionUseCase,
    CreateSessionUseCase,
    CreateNoteUseCase,
    CreateWorldUseCase,
    CreateCampaignUseCase,
    GetEntityUseCase,
    GetWorldUseCase,
    GetCampaignUseCase,
    ListEntitiesUseCase,
    ListWorldsUseCase,
    ListCampaignsUseCase,
    UpdateEntityUseCase,
    UpdateWorldUseCase,
    UpdateCampaignUseCase,
    DeleteEntityUseCase,
    DeleteWorldUseCase,
    DeleteCampaignUseCase,
    SearchEntitiesUseCase,
    AddCustomSafetyToolUseCase,
    RemoveCustomSafetyToolUseCase,
    GetSafetyToolsUseCase,
    ConfigureSafetyToolsUseCase,
    AddQuickNoteUseCase,
    RemoveQuickNoteUseCase,
    EndSessionWithSummaryUseCase,
    ResolveMentionUseCase,
    CreateContinuityUseCase,
    GetContinuityUseCase,
    ListContinuitiesUseCase,
    CreateEventUseCase,
    UpdateContinuityUseCase,
    DeleteContinuityUseCase,
    BranchContinuityUseCase,
    ListDriftsUseCase,
    ResolveDriftUseCase,
} from '../../application/use-cases';
import { EntityEditorViewModel } from '../../presentation';
import { SearchViewModel } from '../../presentation';
import { EntityListViewModel } from '../../presentation';
import { CommandHistoryViewModel } from '../../presentation';

export function createContainer(config: DatabaseConfig): Container {
    const container = new Container();

    // Database (singleton)
    const dbManager = new DatabaseManager(config);
    dbManager.initialize();
    container.register(TOKENS.DatabaseManager, () => dbManager, true);
    container.register(TOKENS.Database, () => dbManager.getDatabase(), true);

    // Repositories
    container.register(TOKENS.EntityRepository, () =>
        new SQLiteEntityRepository(container.resolve(TOKENS.Database)), true
    );
    container.register(TOKENS.SearchRepository, () =>
        new SQLiteSearchRepository(container.resolve(TOKENS.Database)), true
    );
    container.register(TOKENS.WorldRepository, () =>
        new SQLiteWorldRepository(container.resolve(TOKENS.Database)), true
    );
    container.register(TOKENS.CampaignRepository, () =>
        new SQLiteCampaignRepository(container.resolve(TOKENS.Database)), true
    );
    container.register(TOKENS.SafetyToolRepository, () =>
        new SQLiteSafetyToolRepository(container.resolve(TOKENS.Database)), true
    );
    container.register(TOKENS.QuickNoteRepository, () =>
        new SQLiteQuickNoteRepository(container.resolve(TOKENS.Database)), true
    );
    container.register(TOKENS.ContinuityRepository, () =>
        new SQLiteContinuityRepository(container.resolve(TOKENS.Database)), true
    );
    container.register(TOKENS.DriftRepository, () =>
        new SQLiteDriftRepository(container.resolve(TOKENS.Database)), true
    );

    // Services (singletons)
    container.register(TOKENS.EventBus, () => new EventBus(), true);
    container.register(TOKENS.CommandHistory, () => new CommandHistory(), true);

    // Domain Services
    container.register(TOKENS.EventStatePropagator, () =>
        new EventStatePropagator(container.resolve(TOKENS.EntityRepository)), true
    );
    container.register(TOKENS.DriftDetector, () =>
        new DriftDetector(
            container.resolve(TOKENS.EntityRepository),
            container.resolve(TOKENS.DriftRepository)
        ), true
    );

    // Use Cases (transient - new instance each time)
    container.register(TOKENS.CreateCharacterUseCase, () =>
        new CreateCharacterUseCase(
            container.resolve(TOKENS.EntityRepository),
            container.resolve(TOKENS.EventBus)
        )
    );
    container.register(TOKENS.CreateLocationUseCase, () =>
        new CreateLocationUseCase(
            container.resolve(TOKENS.EntityRepository),
            container.resolve(TOKENS.EventBus)
        )
    );
    container.register(TOKENS.CreateFactionUseCase, () =>
        new CreateFactionUseCase(
            container.resolve(TOKENS.EntityRepository),
            container.resolve(TOKENS.EventBus)
        )
    );
    container.register(TOKENS.CreateSessionUseCase, () =>
        new CreateSessionUseCase(
            container.resolve(TOKENS.EntityRepository),
            container.resolve(TOKENS.EventBus)
        )
    );
    container.register(TOKENS.CreateNoteUseCase, () =>
        new CreateNoteUseCase(
            container.resolve(TOKENS.EntityRepository),
            container.resolve(TOKENS.EventBus)
        )
    );
    container.register(TOKENS.GetEntityUseCase, () =>
        new GetEntityUseCase(
            container.resolve(TOKENS.EntityRepository)
        )
    );
    container.register(TOKENS.ListEntitiesUseCase, () =>
        new ListEntitiesUseCase(
            container.resolve(TOKENS.EntityRepository)
        )
    );
    container.register(TOKENS.UpdateEntityUseCase, () =>
        new UpdateEntityUseCase(
            container.resolve(TOKENS.EntityRepository),
            container.resolve(TOKENS.EventBus),
            container.resolve(TOKENS.EventStatePropagator),
            container.resolve(TOKENS.DriftDetector)
        )
    );
    container.register(TOKENS.DeleteEntityUseCase, () =>
        new DeleteEntityUseCase(
            container.resolve(TOKENS.EntityRepository),
            container.resolve(TOKENS.EventBus)
        )
    );
    container.register(TOKENS.SearchEntitiesUseCase, () =>
        new SearchEntitiesUseCase(
            container.resolve(TOKENS.EntityRepository),
        )
    );

    // World use cases
    container.register(TOKENS.CreateWorldUseCase, () =>
        new CreateWorldUseCase(container.resolve(TOKENS.WorldRepository),
            container.resolve(TOKENS.EventBus)
        )
    );
    container.register(TOKENS.UpdateWorldUseCase, () =>
        new UpdateWorldUseCase(
            container.resolve(TOKENS.WorldRepository),
            container.resolve(TOKENS.EventBus)
        )
    );
    container.register(TOKENS.DeleteWorldUseCase, () =>
        new DeleteWorldUseCase(
            container.resolve(TOKENS.WorldRepository),
            container.resolve(TOKENS.EventBus)
        )
    );
    container.register(TOKENS.GetWorldUseCase, () =>
        new GetWorldUseCase(container.resolve(TOKENS.WorldRepository))
    );
    container.register(TOKENS.ListWorldsUseCase, () =>
        new ListWorldsUseCase(container.resolve(TOKENS.WorldRepository))
    );

    // Campaign use cases
    container.register(TOKENS.CreateCampaignUseCase, () =>
        new CreateCampaignUseCase(
            container.resolve(TOKENS.CampaignRepository),
            container.resolve(TOKENS.ContinuityRepository),
            container.resolve(TOKENS.WorldRepository),
            container.resolve(TOKENS.EventBus)
        )
    )
    container.register(TOKENS.UpdateCampaignUseCase, () =>
        new UpdateCampaignUseCase(container.resolve(TOKENS.CampaignRepository),
            container.resolve(TOKENS.EventBus))
    );
    container.register(TOKENS.DeleteCampaignUseCase, () =>
        new DeleteCampaignUseCase(container.resolve(TOKENS.CampaignRepository),
            container.resolve(TOKENS.EventBus))
    );
    container.register(TOKENS.GetCampaignUseCase, () =>
        new GetCampaignUseCase(container.resolve(TOKENS.CampaignRepository))
    );
    container.register(TOKENS.ListCampaignsUseCase, () =>
        new ListCampaignsUseCase(container.resolve(TOKENS.CampaignRepository))
    );

    // Safety tool use cases
    container.register(TOKENS.AddCustomSafetyToolUseCase, () =>
        new AddCustomSafetyToolUseCase(
            container.resolve(TOKENS.SafetyToolRepository),
            container.resolve(TOKENS.CampaignRepository)
        )
    );
    container.register(TOKENS.RemoveCustomSafetyToolUseCase, () =>
        new RemoveCustomSafetyToolUseCase(
            container.resolve(TOKENS.SafetyToolRepository),
            container.resolve(TOKENS.CampaignRepository)
        )
    );
    container.register(TOKENS.GetSafetyToolsUseCase, () =>
        new GetSafetyToolsUseCase(
            container.resolve(TOKENS.SafetyToolRepository),
            container.resolve(TOKENS.CampaignRepository)
        )
    );
    container.register(TOKENS.ConfigureSafetyToolsUseCase, () =>
        new ConfigureSafetyToolsUseCase(
            container.resolve(TOKENS.SafetyToolRepository),
            container.resolve(TOKENS.CampaignRepository),
        )
    );

    // Session notes use cases
    container.register(TOKENS.AddQuickNoteUseCase, () =>
        new AddQuickNoteUseCase(
            container.resolve(TOKENS.EntityRepository),
            container.resolve(TOKENS.QuickNoteRepository)
        )
    );
    container.register(TOKENS.RemoveQuickNoteUseCase, () =>
        new RemoveQuickNoteUseCase(container.resolve(TOKENS.QuickNoteRepository))
    );
    container.register(TOKENS.EndSessionWithSummaryUseCase, () =>
        new EndSessionWithSummaryUseCase(
            container.resolve(TOKENS.EntityRepository),
            container.resolve(TOKENS.QuickNoteRepository)
        )
    );

    container.register(TOKENS.ResolveMentionUseCase, () =>
        new ResolveMentionUseCase(
            container.resolve(TOKENS.EntityRepository)
        )
    );

    // Continuity use cases
    container.register(TOKENS.CreateContinuityUseCase, () =>
        new CreateContinuityUseCase(
            container.resolve(TOKENS.ContinuityRepository),
            container.resolve(TOKENS.WorldRepository),
            container.resolve(TOKENS.EventBus)
        )
    );
    container.register(TOKENS.GetContinuityUseCase, () =>
        new GetContinuityUseCase(container.resolve(TOKENS.ContinuityRepository))
    );
    container.register(TOKENS.ListContinuitiesUseCase, () =>
        new ListContinuitiesUseCase(container.resolve(TOKENS.ContinuityRepository))
    );
    container.register(TOKENS.CreateEventUseCase, () =>
        new CreateEventUseCase(
            container.resolve(TOKENS.EntityRepository),
            container.resolve(TOKENS.ContinuityRepository),
            container.resolve(TOKENS.EventBus),
            container.resolve(TOKENS.EventStatePropagator)
        )
    );
    container.register(TOKENS.UpdateContinuityUseCase, () =>
        new UpdateContinuityUseCase(
            container.resolve(TOKENS.ContinuityRepository),
            container.resolve(TOKENS.EventBus)
        )
    );
    container.register(TOKENS.DeleteContinuityUseCase, () =>
        new DeleteContinuityUseCase(
            container.resolve(TOKENS.ContinuityRepository),
            container.resolve(TOKENS.CampaignRepository),
            container.resolve(TOKENS.EntityRepository),
            container.resolve(TOKENS.EventBus)
        )
    );
    container.register(TOKENS.BranchContinuityUseCase, () =>
        new BranchContinuityUseCase(
            container.resolve(TOKENS.ContinuityRepository),
            container.resolve(TOKENS.EntityRepository),
            container.resolve(TOKENS.EventBus)
        )
    );

    // Drift use cases
    container.register(TOKENS.ListDriftsUseCase, () =>
        new ListDriftsUseCase(container.resolve(TOKENS.DriftRepository))
    );
    container.register(TOKENS.ResolveDriftUseCase, () =>
        new ResolveDriftUseCase(container.resolve(TOKENS.DriftRepository))
    );

    // ViewModels (transient)
    container.register(TOKENS.EntityEditorViewModel, () =>
        new EntityEditorViewModel(
            container.resolve(TOKENS.GetEntityUseCase),
            container.resolve(TOKENS.UpdateEntityUseCase),
            container.resolve(TOKENS.EventBus)
        )
    );
    container.register(TOKENS.SearchViewModel, () =>
        new SearchViewModel(
            container.resolve(TOKENS.SearchEntitiesUseCase)
        )
    );
    container.register(TOKENS.EntityListViewModel, () =>
        new EntityListViewModel(
            container.resolve(TOKENS.ListEntitiesUseCase)
        )
    );
    container.register(TOKENS.CommandHistoryViewModel, () =>
        new CommandHistoryViewModel(
            container.resolve(TOKENS.CommandHistory)
        )
    );

    return container;
}