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
export { CreateContinuityUseCase } from './CreateContinuityUseCase';
export { CreateEventUseCase } from './CreateEventUseCase';

// Read use cases
export { GetEntityUseCase } from './GetEntityUseCase';
export { ListEntitiesUseCase } from './ListEntitiesUseCase';
export { SearchEntitiesUseCase } from './SearchEntitiesUseCase';
export { GetWorldUseCase } from './GetWorldUseCase';
export { GetCampaignUseCase } from './GetCampaignUseCase';
export { GetContinuityUseCase } from './GetContinuityUseCase';
export { ListWorldsUseCase } from './ListWorldsUseCase';
export { ListCampaignsUseCase } from './ListCampaignsUseCase';
export { ListContinuitiesUseCase } from './ListContinuitiesUseCase';
export { GetSafetyToolsUseCase } from './GetSafetyToolsUseCase';

// Update use cases
export { UpdateEntityUseCase } from './UpdateEntityUseCase';
export { UpdateWorldUseCase } from './UpdateWorldUseCase';
export { UpdateCampaignUseCase } from './UpdateCampaignUseCase';
export { UpdateContinuityUseCase } from './UpdateContinuityUseCase';
export { ConfigureSafetyToolsUseCase } from './ConfigureSafetyToolsUseCase';
export { AddCustomSafetyToolUseCase } from './AddCustomSafetyToolUseCase';
export { RemoveCustomSafetyToolUseCase } from './RemoveCustomSafetyToolUseCase';

// Delete use cases
export { DeleteEntityUseCase } from './DeleteEntityUseCase';
export { DeleteWorldUseCase } from './DeleteWorldUseCase';
export { DeleteCampaignUseCase } from './DeleteCampaignUseCase';
export { DeleteContinuityUseCase } from './DeleteContinuityUseCase';

// Session notes use cases
export { AddQuickNoteUseCase } from './AddQuickNoteUseCase';
export { RemoveQuickNoteUseCase } from './RemoveQuickNoteUseCase';
export { EndSessionWithSummaryUseCase } from './EndSessionWithSummaryUseCase';

// Mentions use case
export { ResolveMentionUseCase } from './ResolveMentionUseCase';