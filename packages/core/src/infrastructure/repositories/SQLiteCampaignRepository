import Database from 'better-sqlite3';
import { Result } from '../../domain/core/Result';
import { RepositoryError } from '../../domain/core/errors';
import { ICampaignRepository } from '../../domain/repositories/ICampaignRepository';
import { Campaign } from '../../domain/entities/Campaign';
import { EntityID } from '../../domain/value-objects/EntityID';
import { WorldCampaignMapper, CampaignRow } from '../mappers/WorldCampaignMapper';

export class SQLiteCampaignRepository implements ICampaignRepository {
    constructor(private readonly db: Database.Database) { }

    async findById(id: EntityID): Promise<Result<Campaign | null, RepositoryError>> {
        try {
            const row = this.db.prepare(
                'SELECT * FROM campaigns WHERE id = ?'
            ).get(id.toString()) as CampaignRow | undefined;

            if (!row) {
                return Result.ok(null);
            }

            return Result.ok(WorldCampaignMapper.campaignToDomain(row));
        } catch (error) {
            return Result.fail(new RepositoryError('Failed to find campaign by ID', error));
        }
    }

    async findByWorld(worldID: EntityID): Promise<Result<Campaign[], RepositoryError>> {
        try {
            const rows = this.db.prepare(
                'SELECT * FROM campaigns WHERE world_id = ? ORDER BY modified_at DESC'
            ).all(worldID.toString()) as CampaignRow[];

            const campaigns = rows.map(WorldCampaignMapper.campaignToDomain);
            return Result.ok(campaigns);
        } catch (error) {
            return Result.fail(new RepositoryError('Failed to find campaigns by world', error));
        }
    }

    async findAll(): Promise<Result<Campaign[], RepositoryError>> {
        try {
            const rows = this.db.prepare(
                'SELECT * FROM campaigns ORDER BY modified_at DESC'
            ).all() as CampaignRow[];

            const campaigns = rows.map(WorldCampaignMapper.campaignToDomain);
            return Result.ok(campaigns);
        } catch (error) {
            return Result.fail(new RepositoryError('Failed to find all campaigns', error));
        }
    }

    async save(campaign: Campaign): Promise<Result<void, RepositoryError>> {
        try {
            const row = WorldCampaignMapper.campaignToRow(campaign);

            this.db.prepare(`
                  INSERT INTO campaigns (id, world_id, name, description, created_at, modified_at)
                  VALUES (@id, @world_id, @name, @description, @created_at, @modified_at)
                  ON CONFLICT(id) DO UPDATE SET
                      name = @name,
                      description = @description,
                      modified_at = @modified_at
              `).run(row);

            return Result.ok(undefined);
        } catch (error) {
            return Result.fail(new RepositoryError('Failed to save campaign', error));
        }
    }

    async delete(id: EntityID): Promise<Result<void, RepositoryError>> {
        try {
            this.db.prepare('DELETE FROM campaigns WHERE id = ?').run(id.toString());
            return Result.ok(undefined);
        } catch (error) {
            return Result.fail(new RepositoryError('Failed to delete campaign', error));
        }
    }

    async countByWorld(worldID: EntityID): Promise<Result<number, RepositoryError>> {
        try {
            const row = this.db.prepare(
                'SELECT COUNT(*) as count FROM campaigns WHERE world_id = ?'
            ).get(worldID.toString()) as { count: number };

            return Result.ok(row.count);
        } catch (error) {
            return Result.fail(new RepositoryError('Failed to count campaigns', error));
        }
    }

    async exists(id: EntityID): Promise<Result<boolean, RepositoryError>> {
        try {
            const row = this.db.prepare(
                'SELECT 1 FROM campaigns WHERE id = ?'
            ).get(id.toString());

            return Result.ok(row !== undefined);
        } catch (error) {
            return Result.fail(new RepositoryError('Failed to check campaign existence', error));
        }
    }
}