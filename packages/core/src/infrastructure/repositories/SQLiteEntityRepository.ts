import Database from 'better-sqlite3';
import { Result } from '../../domain/core/Result';
import { RepositoryError } from '../../domain/core/errors';
import {
    IEntityRepository,
    EntityFilter,
    PaginationOptions,
    PaginatedResult
} from '../../domain/repositories/IEntityRepository';
import { BaseEntity } from '../../domain/entities/BaseEntity';
import { EntityID } from '../../domain/value-objects/EntityID';
import { EntityType } from '../../domain/entities/EntityType';
import { DatabaseMapper } from '../mappers/DatabaseMapper';
import { EntityRow } from '../database/types';

export class SQLiteEntityRepository implements IEntityRepository {
    constructor(private readonly db: Database.Database) { }

    async findByID(id: EntityID): Promise<Result<BaseEntity | null, RepositoryError>> {
        try {
            const row = this.db.prepare('SELECT * FROM entities WHERE id = ?')
                .get(id.toString()) as EntityRow | undefined;

            if (!row) {
                return Result.ok(null);
            }

            return Result.ok(DatabaseMapper.toDomain(row));
        } catch (error) {
            return Result.fail(new RepositoryError('Failed to find entity by ID', error));
        }
    }

    async findByWorld(
        worldID: EntityID,
        options?: PaginationOptions
    ): Promise<Result<PaginatedResult<BaseEntity>, RepositoryError>> {
        try {
            const limit = options?.limit ?? 50;
            const offset = options?.offset ?? 0;

            // Get total count
            const countRow = this.db.prepare(
                'SELECT COUNT(*) as count FROM entities WHERE world_id = ?'
            ).get(worldID.toString()) as { count: number };

            const rows = this.db.prepare(`
                SELECT * FROM entities
                WHERE world_id = ?
                ORDER BY modified_at DESC
                LIMIT ? OFFSET ?
            `).all(worldID.toString(), limit, offset) as EntityRow[];

            const entities = rows.map(DatabaseMapper.toDomain);

            return Result.ok({
                items: entities,
                total: countRow.count,
                hasMore: offset + entities.length < countRow.count
            });
        } catch (error) {
            return Result.fail(new RepositoryError('Failed to find entities by world', error));
        }
    }

    async findByCampaign(
        campaignID: EntityID,
        options?: PaginationOptions
    ): Promise<Result<PaginatedResult<BaseEntity>, RepositoryError>> {
        try {
            const limit = options?.limit ?? 50;
            const offset = options?.offset ?? 0;

            const countRow = this.db.prepare(
                'SELECT COUNT(*) as count FROM entities WHERE campaign_id = ?'
            ).get(campaignID.toString()) as { count: number };

            const rows = this.db.prepare(`
                SELECT * FROM entities
                WHERE campaign_id = ?
                ORDER BY modified_at DESC
                LIMIT ? OFFSET ?
            `).all(campaignID.toString(), limit, offset) as EntityRow[];

            const entities = rows.map(DatabaseMapper.toDomain);

            return Result.ok({
                items: entities,
                total: countRow.count,
                hasMore: offset + entities.length < countRow.count,
            });
        } catch (error) {
            return Result.fail(new RepositoryError('Failed to find entities by campaign', error));
        }
    }

    async findByFilter(
        filter: EntityFilter,
        options?: PaginationOptions
    ): Promise<Result<PaginatedResult<BaseEntity>, RepositoryError>> {
        try {
            const limit = options?.limit ?? 50;
            const offset = options?.offset ?? 0;

            const { whereClause, params } = this.buildWhereClause(filter);

            const countRow = this.db.prepare(
                `SELECT COUNT(*) as count FROM entities ${whereClause}`
            ).get(...params) as { count: number };

            const rows = this.db.prepare(`
            SELECT * FROM entities ${whereClause}
            ORDER BY modified_at DESC
            LIMIT ? OFFSET ?
        `).all(...params, limit, offset) as EntityRow[];

            const entities = rows.map(DatabaseMapper.toDomain);

            return Result.ok({
                items: entities,
                total: countRow.count,
                hasMore: offset + entities.length < countRow.count,
            });
        } catch (error) {
            return Result.fail(new RepositoryError('Failed to find entities by filter', error));
        }
    }

    async findByType(
        worldID: EntityID,
        type: EntityType,
        options?: PaginationOptions
    ): Promise<Result<PaginatedResult<BaseEntity>, RepositoryError>> {
        return this.findByFilter({ worldID, types: [type] }, options);
    }

    async save(entity: BaseEntity): Promise<Result<void, RepositoryError>> {
        try {
            const row = DatabaseMapper.toRow(entity);

            // Upsert: insert or replace
            const stmt = this.db.prepare(`
                INSERT INTO entities (
                    id, type, name, description, secrets, content, summary, notes,
                    tags, world_id, campaign_id, forked_from, session_date,
                    created_at, modified_at
                ) VALUES (
                    @id, @type, @name, @description, @secrets, @content, @summary, @notes,
                    @tags, @world_id, @campaign_id, @forked_from, @session_date,
                    @created_at, @modified_at
                )
                ON CONFLICT(id) DO UPDATE SET
                    name = @name,
                    description = @description,
                    secrets = @secrets,
                    content = @content,
                    summary = @summary,
                    notes = @notes,
                    tags = @tags,
                    modified_at = @modified_at
            `);

            stmt.run(row);
            return Result.ok(undefined);
        } catch (error) {
            return Result.fail(new RepositoryError('Failed to save entity', error));
        }
    }

    async saveMany(entities: BaseEntity[]): Promise<Result<void, RepositoryError>> {
        try {
            const transaction = this.db.transaction((ents: BaseEntity[]) => {
                for (const entity of ents) {
                    const row = DatabaseMapper.toRow(entity);
                    this.db.prepare(`
                        INSERT INTO entities (
                            id, type, name, description, secrets, content, summary, notes,
                            tags, world_id, campaign_id, forked_from, session_date,
                            created_at, modified_at
                        ) VALUES (
                            @id, @type, @name, @description, @secrets, @content, @summary, @notes,
                            @tags, @world_id, @campaign_id, @forked_from, @session_date,
                            @created_at, @modified_at
                        )
                        ON CONFLICT(id) DO UPDATE SET
                            name = @name,
                            description = @description,
                            secrets = @secrets,
                            content = @content,
                            summary = @summary,
                            notes = @notes,
                            tags = @tags,
                            modified_at = @modified_at
                    `).run(row);
                }
            });

            transaction(entities);
            return Result.ok(undefined);
        } catch (error) {
            return Result.fail(new RepositoryError('Failed to save entities', error));
        }
    }

    async delete(id: EntityID): Promise<Result<void, RepositoryError>> {
        try {
            this.db.prepare('DELETE FROM entities WHERE id = ?').run(id.toString());
            return Result.ok(undefined);
        } catch (error) {
            return Result.fail(new RepositoryError('Failed to delete entity', error));
        }
    }

    async deleteMany(ids: EntityID[]): Promise<Result<void, RepositoryError>> {
        try {
            const transaction = this.db.transaction((entityIds: EntityID[]) => {
                const stmt = this.db.prepare('DELETE FROM entities WHERE id = ?');
                for (const id of entityIds) {
                    stmt.run(id.toString());
                }
            });

            transaction(ids);
            return Result.ok(undefined);
        } catch (error) {
            return Result.fail(new RepositoryError('Failed to delete entities', error));
        }
    }

    async exists(id: EntityID): Promise<Result<boolean, RepositoryError>> {
        try {
            const row = this.db.prepare(
                'SELECT 1 FROM entities WHERE id = ?'
            ).get(id.toString());

            return Result.ok(row !== undefined);
        } catch (error) {
            return Result.fail(new RepositoryError('Failed to check entity existence', error));
        }
    }

    async count(filter: EntityFilter): Promise<Result<number, RepositoryError>> {
        try {
            const { whereClause, params } = this.buildWhereClause(filter);

            const row = this.db.prepare(
                `SELECT COUNT(*) as count FROM entities ${whereClause}`
            ).get(...params) as { count: number };

            return Result.ok(row.count);
        } catch (error) {
            return Result.fail(new RepositoryError('Failed to count entities', error));
        }
    }

    private buildWhereClause(filter: EntityFilter): { whereClause: string; params: unknown[] } {
        const conditions: string[] = [];
        const params: unknown[] = [];

        if (filter.worldID) {
            conditions.push('world_id = ?');
            params.push(filter.worldID.toString());
        }

        if (filter.campaignID !== undefined) {
            if (filter.campaignID === null) {
                conditions.push('campaign_id IS NULL');
            } else {
                conditions.push('campaign_id = ?');
                params.push(filter.campaignID.toString());
            }
        }

        if (filter.types && filter.types.length > 0) {
            const placeholders = filter.types.map(() => '?').join(', ');
            conditions.push(`type IN (${placeholders})`);
            params.push(...filter.types);
        }

        if (filter.tags && filter.tags.length > 0) {
            // Match entities that have ALL specified tags
            for (const tag of filter.tags) {
                conditions.push("tags LIKE ?");
                params.push(`%"${tag}"%`);  // JSON array contains tag
            }
        }

        if (filter.includeForked === false) {
            conditions.push('forked_from IS NULL');
        }

        const whereClause = conditions.length > 0
            ? 'WHERE ' + conditions.join(' AND ')
            : '';

        return { whereClause, params };
    }
}