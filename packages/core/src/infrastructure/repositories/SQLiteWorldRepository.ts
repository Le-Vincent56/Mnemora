import Database from 'better-sqlite3';
import { Result } from '../../domain/core/Result';
import { RepositoryError } from '../../domain/core/errors';
import { IWorldRepository } from '../../domain/repositories/IWorldRepository';
import { World } from '../../domain/entities/World';
import { EntityID } from '../../domain/value-objects/EntityID';
import { WorldCampaignMapper, WorldRow } from '../mappers/WorldCampaignMapper';

export class SQLiteWorldRepository implements IWorldRepository {
    constructor(private readonly db: Database.Database) { }

    async findById(id: EntityID): Promise<Result<World | null, RepositoryError>> {
        try {
            const row = this.db.prepare(
                'SELECT * FROM worlds WHERE id = ?'
            ).get(id.toString()) as WorldRow | undefined;

            if (!row) {
                return Result.ok(null);
            }

            return Result.ok(WorldCampaignMapper.worldToDomain(row));
        } catch (error) {
            return Result.fail(new RepositoryError('Failed to find world by ID', error));
        }
    }

    async findAll(): Promise<Result<World[], RepositoryError>> {
        try {
            const rows = this.db.prepare(
                'SELECT * FROM worlds ORDER BY modified_at DESC'
            ).all() as WorldRow[];

            const worlds = rows.map(WorldCampaignMapper.worldToDomain);
            return Result.ok(worlds);
        } catch (error) {
            return Result.fail(new RepositoryError('Failed to find all worlds', error));
        }
    }

    async save(world: World): Promise<Result<void, RepositoryError>> {
        try {
            const row = WorldCampaignMapper.worldToRow(world);

            this.db.prepare(`
                  INSERT INTO worlds (id, name, tagline, created_at, modified_at)
                  VALUES (@id, @name, @tagline, @created_at, @modified_at)
                  ON CONFLICT(id) DO UPDATE SET
                      name = @name,
                      tagline = @tagline,
                      modified_at = @modified_at
              `).run(row);

            return Result.ok(undefined);
        } catch (error) {
            return Result.fail(new RepositoryError('Failed to save world', error));
        }
    }

    async delete(id: EntityID): Promise<Result<void, RepositoryError>> {
        try {
            this.db.prepare('DELETE FROM worlds WHERE id = ?').run(id.toString());
            return Result.ok(undefined);
        } catch (error) {
            return Result.fail(new RepositoryError('Failed to delete world', error));
        }
    }

    async exists(id: EntityID): Promise<Result<boolean, RepositoryError>> {
        try {
            const row = this.db.prepare(
                'SELECT 1 FROM worlds WHERE id = ?'
            ).get(id.toString());

            return Result.ok(row !== undefined);
        } catch (error) {
            return Result.fail(new RepositoryError('Failed to check world existence', error));
        }
    }
}