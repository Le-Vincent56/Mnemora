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

// Read use cases
export { GetEntityUseCase } from './GetEntityUseCase';
export { ListEntitiesUseCase } from './ListEntitiesUseCase';
export { SearchEntitiesUseCase } from './SearchEntitiesUseCase';

// Update use case
export { UpdateEntityUseCase } from './UpdateEntityUseCase';

// Delete use cases
export { DeleteEntityUseCase } from './DeleteEntityUseCase';
