import { Result } from '../../domain/core/Result';
import { EntityID } from '../../domain/value-objects/EntityID';
import { EntityType } from '../../domain/entities/EntityType';
import { BaseEntity } from '../../domain/entities/BaseEntity';
import { Character } from '../../domain/entities/Character';
import { Location } from '../../domain/entities/Location';
import { Faction } from '../../domain/entities/Faction';
import { Session } from '../../domain/entities/Session';
import { Note } from '../../domain/entities/Note';
import type { IEntityRepository } from '../../domain/repositories/IEntityRepository';
import type { IUseCase } from './IUseCase';
import { UseCaseError } from './UseCaseError';

/**
 * Request to resolve a @mention to an entity.
 */
export interface ResolveMentionRequest {
    readonly mentionText: string;
    readonly worldID: string;
    readonly campaignID: string;
}

/**
 * Result of resolving a @mention.
 */
export interface MentionResolution {
    readonly entityId: string | null;
    readonly entityName: string;
    readonly entityType: EntityType | null;
    readonly found: boolean;
}

/**
 * Helper to extract name from any entity type.
 */
function getEntityName(entity: BaseEntity): string {
    switch (entity.type) {
        case EntityType.CHARACTER:
            return (entity as Character).name.toString();
        case EntityType.LOCATION:
            return (entity as Location).name.toString();
        case EntityType.FACTION:
            return (entity as Faction).name.toString();
        case EntityType.SESSION:
            return (entity as Session).name.toString();
        case EntityType.NOTE:
            return (entity as Note).name.toString();
        default:
            return '';
    }
}

/**
 * Resolves @mentions in text to entity links.
 *
 * Supports two syntaxes:
 * - @EntityName (single word)
 * - @"Entity Name With Spaces" (quoted)
 *
 * Resolution rules:
 * 1. Prefer exact name match
 * 2. If multiple matches, use most recently modified
 * 3. If no match, return found: false with parsed name
 */
export class ResolveMentionUseCase implements IUseCase<ResolveMentionRequest, MentionResolution> {
    constructor(
        private readonly entityRepository: IEntityRepository
    ) { }

    async execute(
        request: ResolveMentionRequest
    ): Promise<Result<MentionResolution, UseCaseError>> {
        // 1. Parse the mention text
        const parsedName = this.parseMentionName(request.mentionText);
        if (!parsedName) {
            return Result.fail(
                UseCaseError.validation('Invalid mention format', 'mentionText')
            );
        }

        // 2. Parse IDs
        const worldIDResult = EntityID.fromString(request.worldID);
        if (worldIDResult.isFailure) {
            return Result.fail(UseCaseError.validation('Invalid world ID', 'worldID'));
        }

        const campaignIDResult = EntityID.fromString(request.campaignID);
        if (campaignIDResult.isFailure) {
            return Result.fail(UseCaseError.validation('Invalid campaign ID', 'campaignID'));
        }

        // 3. Search for entities with matching name
        // First try campaign-scoped entities, then world-scoped
        const filterResult = await this.entityRepository.findByFilter({
            worldID: worldIDResult.value,
            campaignID: campaignIDResult.value,
        });

        if (filterResult.isFailure) {
            return Result.fail(
                UseCaseError.repositoryError('Failed to search entities', filterResult.error)
            );
        }

        // 4. Find exact name matches (case-insensitive)
        const normalizedSearch = parsedName.toLowerCase().trim();
        const matches = filterResult.value.items.filter(entity => {
            const entityName = getEntityName(entity);
            return entityName.toLowerCase().trim() === normalizedSearch;
        });

        // 5. If no matches in campaign, also check world-level
        if (matches.length === 0) {
            const worldFilterResult = await this.entityRepository.findByFilter({
                worldID: worldIDResult.value,
                campaignID: null,  // World-level only
            });

            if (worldFilterResult.isSuccess) {
                const worldMatches = worldFilterResult.value.items.filter(entity => {
                    const entityName = getEntityName(entity);
                    return entityName.toLowerCase().trim() === normalizedSearch;
                });
                matches.push(...worldMatches);
            }
        }

        // 6. No matches found
        if (matches.length === 0) {
            return Result.ok({
                entityId: null,
                entityName: parsedName,
                entityType: null,
                found: false,
            });
        }

        // 7. If multiple matches, sort by most recently modified
        if (matches.length > 1) {
            matches.sort((a, b) => b.modifiedAt.getTime() - a.modifiedAt.getTime());
        }

        // 8. Return the best match (guaranteed to exist after length check)
        const bestMatch = matches[0]!;
        const entityName = getEntityName(bestMatch);

        return Result.ok({
            entityId: bestMatch.id.toString(),
            entityName: entityName,
            entityType: bestMatch.type,
            found: true,
        });
    }

    /**
     * Parses the entity name from mention text.
     * Supports: @Name or @"Name With Spaces"
     */
    private parseMentionName(mentionText: string): string | null {
        const trimmed = mentionText.trim();

        // Must start with @
        if (!trimmed.startsWith('@')) {
            return null;
        }

        const afterAt = trimmed.slice(1);

        // Check for quoted format: @"Name With Spaces"
        if (afterAt.startsWith('"')) {
            const endQuote = afterAt.indexOf('"', 1);
            if (endQuote === -1) {
                // Unclosed quote - take everything after the opening quote
                return afterAt.slice(1).trim() || null;
            }
            const name = afterAt.slice(1, endQuote).trim();
            return name || null;
        }

        // Unquoted format: @SingleWord
        // Take characters until whitespace or end
        const match = afterAt.match(/^(\S+)/);
        if (!match || !match[1]) {
            return null;
        }

        return match[1].trim() || null;
    }
}