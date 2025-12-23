/**
 * Use case exports.
 */

// Base
export type { IUseCase } from './IUseCase';
export { UseCaseError } from './UseCaseError';

// Create use cases
export { CreateCharacterUseCase } from './CreateCharacterUseCase';
export { CreateLocationUseCase } from './CreateLocationUseCase';
export { CreateFactionUseCase } from './CreateFactionUseCase';
export { CreateSessionUseCase } from './CreateSessionUseCase';
export { CreateNoteUseCase } from './CreateNoteUseCase';
export { CreateWorldUseCase } from './CreateWorldUseCase';
export { CreateCampaignUseCase } from './CreateCampaignUseCase';

// Read use cases
export { GetEntityUseCase } from './GetEntityUseCase';
export { ListEntitiesUseCase } from './ListEntitiesUseCase';
export { SearchEntitiesUseCase } from './SearchEntitiesUseCase';
export { GetWorldUseCase } from './GetWorldUseCase';
export { GetCampaignUseCase } from './GetCampaignUseCase';
export { ListWorldsUseCase } from './ListWorldsUseCase';
export { ListCampaignsUseCase } from './ListCampaignsUseCase';
export { GetSafetyToolsUseCase } from './GetSafetyToolsUseCase';

// Update use case
export { UpdateEntityUseCase } from './UpdateEntityUseCase';
export { UpdateWorldUseCase } from './UpdateWorldUseCase';
export { UpdateCampaignUseCase } from './UpdateCampaignUseCase';
export { ConfigureSafetyToolsUseCase } from './ConfigureSafetyToolsUseCase';

// Delete use cases
export { DeleteEntityUseCase } from './DeleteEntityUseCase';
export { DeleteWorldUseCase } from './DeleteWorldUseCase';
export { DeleteCampaignUseCase } from './DeleteCampaignUseCase';

// Session notes use cases
export { AddQuickNoteUseCase } from './AddQuickNoteCase';
export { RemoveQuickNoteUseCase } from './RemoveQuickNoteUseCase';
export { EndSessionWithSummaryUseCase } from './EndSessionWithSummaryUseCase';
