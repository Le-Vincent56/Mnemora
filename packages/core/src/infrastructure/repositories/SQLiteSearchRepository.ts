import Database from 'better-sqlite3';
import { Result } from '../../domain/core/Result';
import { RepositoryError } from '../../domain/core/errors';
import {
    ISearchRepository,
    SearchQuery,
    SearchResponse,
    SearchResult,
    SearchHighlight,
    SearchMode
} from '../../domain/repositories/ISearchRepository';
import { BaseEntity } from '../../domain/entities/BaseEntity';
import { EntityID } from '../../domain/value-objects/EntityID';
import { DatabaseMapper } from '../mappers/DatabaseMapper';
import { EntityRow } from '../database/types';

export class SQLiteSearchRepository implements ISearchRepository {
    constructor(private readonly db: Database.Database) { }

    async search(query: SearchQuery): Promise<Result<SearchResponse, RepositoryError>> {
        try {
            const startTime = performance.now();

            // Build FTS query based on mode
            const ftsQuery = this.buildFTSQuery(query);

            // Build WHERE clause for additional filters
            const { filterClause, filterParams } = this.buildFilterClause(query);

            // Count total matches
            const countSql = `
                SELECT COUNT(*) as count
                FROM entities_fts
                JOIN entities ON entities.rowid = entities_fts.rowid
                WHERE entities_fts MATCH ?
                ${filterClause}
            `;
            const countRow = this.db.prepare(countSql).get(ftsQuery, ...filterParams) as { count: number };

            // Get paginated results with ranking
            const searchSql = `
                SELECT
                    entities.*,
                    bm25(entities_fts) as rank,
                    snippet(entities_fts, 0, '<mark>', '</mark>', '...', 32) as snippet_name,
                    snippet(entities_fts, 1, '<mark>', '</mark>', '...', 64) as snippet_description
                FROM entities_fts
                JOIN entities ON entities.rowid = entities_fts.rowid
                WHERE entities_fts MATCH ?
                ${filterClause}
                ORDER BY rank
                LIMIT ? OFFSET ?
            `;

            const rows = this.db.prepare(searchSql).all(
                ftsQuery,
                ...filterParams,
                query.limit,
                query.offset
            ) as (EntityRow & { rank: number; snippet_name: string; snippet_description: string })[];

            const results: SearchResult[] = rows.map(row => ({
                entity: DatabaseMapper.toDomain(row),
                score: Math.abs(row.rank),  // BM25 returns negative scores
                highlights: this.extractHighlights(row),
            }));

            const queryTimeMs = performance.now() - startTime;

            return Result.ok({
                results,
                total: countRow.count,
                hasMore: query.offset + results.length < countRow.count,
                queryTimeMs,
            });
        } catch (error) {
            return Result.fail(new RepositoryError('Search failed', error));
        }
    }

    async index(_entity: BaseEntity): Promise<Result<void, RepositoryError>> {
        // FTS is automatically updated via triggers when main table changes
        // This method exists for explicit re-indexing if needed
        return Result.ok(undefined);
    }

    async removeFromIndex(_id: EntityID): Promise<Result<void, RepositoryError>> {
        // FTS is automatically updated via triggers when main table changes
        return Result.ok(undefined);
    }

    async rebuildIndex(_worldID: EntityID): Promise<Result<void, RepositoryError>> {
        try {
            // Rebuild the FTS index for a specific world
            this.db.exec(`
                INSERT INTO entities_fts(entities_fts) VALUES('rebuild');
            `);

            return Result.ok(undefined);
        } catch (error) {
            return Result.fail(new RepositoryError('Failed to rebuild search index', error));
        }
    }

    private buildFTSQuery(query: SearchQuery): string {
        const raw = query.raw.trim();

        switch (query.mode) {
            case SearchMode.NATURAL:
                // Natural search: tokenize and add wildcards for fuzzy matching
                const tokens = raw.split(/\s+/).filter(t => t.length > 0);
                return tokens.map(t => `"${t}"*`).join(' OR ');

            case SearchMode.BOOLEAN:
                // Convert && || ! to FTS5 AND OR NOT
                return raw
                    .replace(/&&/g, ' AND ')
                    .replace(/\|\|/g, ' OR ')
                    .replace(/!/g, ' NOT ');

            case SearchMode.FILTER:
                // Filter mode: extract search terms after stripping type:/tag: prefixes
                const filterRegex = /(type|tag):\S+/g;
                const searchTerms = raw.replace(filterRegex, '').trim();
                if (!searchTerms) return '*';  // Match all if only filters
                const terms = searchTerms.split(/\s+/).filter(t => t.length > 0);
                return terms.map(t => `"${t}"*`).join(' OR ');

            default:
                return raw;
        }
    }

    private buildFilterClause(query: SearchQuery): { filterClause: string; filterParams: unknown[] } {
        const conditions: string[] = [];
        const params: unknown[] = [];

        // Always filter by world
        conditions.push('entities.world_id = ?');
        params.push(query.worldID.toString());

        // Optionally filter by campaign
        if (query.campaignID) {
            conditions.push('(entities.campaign_id = ? OR entities.campaign_id IS NULL)');
            params.push(query.campaignID.toString());
        }

        // Filter by types
        if (query.types && query.types.length > 0) {
            const placeholders = query.types.map(() => '?').join(', ');
            conditions.push(`entities.type IN (${placeholders})`);
            params.push(...query.types);
        }

        // Filter by tags
        if (query.tags && query.tags.length > 0) {
            for (const tag of query.tags) {
                conditions.push("entities.tags LIKE ?");
                params.push(`%"${tag}"%`);
            }
        }

        return {
            filterClause: conditions.length > 0 ? 'AND ' + conditions.join(' AND ') : '',
            filterParams: params,
        };
    }

    private extractHighlights(row: { snippet_name: string; snippet_description: string }): SearchHighlight[] {
        const highlights: SearchHighlight[] = [];

        if (row.snippet_name && row.snippet_name.includes('<mark>')) {
            highlights.push({ field: 'name', snippet: row.snippet_name });
        }

        if (row.snippet_description && row.snippet_description.includes('<mark>')) {
            highlights.push({ field: 'description', snippet: row.snippet_description });
        }

        return highlights;
    }
}