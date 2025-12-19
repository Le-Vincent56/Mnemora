import { Container } from './Container';
import { TOKENS } from './tokens';
import { DatabaseManager, DatabaseConfig } from '../database/DatabaseManager';
import { SQLiteEntityRepository } from '../repositories/SQLiteEntityRepository';
import { SQLiteSearchRepository } from '../repositories/SQLiteSearchRepository';
import { EventBus } from '../../application/services/EventBus';
import { CommandHistory } from '../../application/commands/CommandHistory';
import {
    CreateCharacterUseCase,
    CreateLocationUseCase,
    CreateFactionUseCase,
    CreateSessionUseCase,
    CreateNoteUseCase,
    GetEntityUseCase,
    ListEntitiesUseCase,
    UpdateEntityUseCase,
    DeleteEntityUseCase,
    SearchEntitiesUseCase
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

    // Services (singletons)
    container.register(TOKENS.EventBus, () => new EventBus(), true);
    container.register(TOKENS.CommandHistory, () => new CommandHistory(), true);

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
            container.resolve(TOKENS.EventBus)
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