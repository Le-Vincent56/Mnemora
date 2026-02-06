import Database from 'better-sqlite3';
import { Result } from '../../domain/core/Result';
import { RepositoryError } from '../../domain/core/errors';
import { IContinuityRepository } from '../../domain/repositories/IContinuityRepository';
import { Continuity, ContinuityProps } from '../../domain/entities/Continuity';
import { EntityID } from '../../domain/value-objects/EntityID';
import { Name } from '../../domain/value-objects/Name';
import { RichText } from '../../domain/value-objects/RichText';
import { Timestamps } from '../../domain/value-objects/Timestamps';

interface ContinuityRow {
    id: string;
    world_id: string;
    name: string;
    description: string | null;
    branched_from_id: string | null;
    branch_point_event_id: string | null;
    created_at: string;
    modified_at: string;
}

export class SQLiteContinuityRepository implements IContinuityRepository {
    constructor(private readonly db: Database.Database) { }

    async findById(id: EntityID): Promise<Result<Continuity | null, RepositoryError>> {
        try {
            const row = this.db.prepare(
                'SELECT * FROM continuities WHERE id = ?'
            ).get(id.toString()) as ContinuityRow | undefined;

            if (!row) return Result.ok(null);
            return Result.ok(this.toDomain(row));
        } catch (error) {
            return Result.fail(new RepositoryError('Failed to find continuity by ID', error));
        }
    }

    async findByWorld(worldID: EntityID): Promise<Result<Continuity[], RepositoryError>> {
        try {
            const rows = this.db.prepare(
                'SELECT * FROM continuities WHERE world_id = ? ORDER BY modified_at DESC'
            ).all(worldID.toString()) as ContinuityRow[];

            return Result.ok(rows.map(r => this.toDomain(r)));
        } catch (error) {
            return Result.fail(new RepositoryError('Failed to find continuities by world', error));
        }
    }

    async save(continuity: Continuity): Promise<Result<void, RepositoryError>> {
        try {
            const row = this.toRow(continuity);
            this.db.prepare(`
                  INSERT INTO continuities (id, world_id, name, description, branched_from_id, branch_point_event_id, created_at,
  modified_at)
                  VALUES (@id, @world_id, @name, @description, @branched_from_id, @branch_point_event_id, @created_at,
  @modified_at)
                  ON CONFLICT(id) DO UPDATE SET
                      name = @name,
                      description = @description,
                      modified_at = @modified_at
              `).run(row);

            return Result.ok(undefined);
        } catch (error) {
            return Result.fail(new RepositoryError('Failed to save continuity', error));
        }
    }

    async delete(id: EntityID): Promise<Result<void, RepositoryError>> {
        try {
            this.db.prepare('DELETE FROM continuities WHERE id = ?').run(id.toString());
            return Result.ok(undefined);
        } catch (error) {
            return Result.fail(new RepositoryError('Failed to delete continuity', error));
        }
    }

    async exists(id: EntityID): Promise<Result<boolean, RepositoryError>> {
        try {
            const row = this.db.prepare(
                'SELECT 1 FROM continuities WHERE id = ?'
            ).get(id.toString());
            return Result.ok(row !== undefined);
        } catch (error) {
            return Result.fail(new RepositoryError('Failed to check continuity existence', error));
        }
    }

    private toDomain(row: ContinuityRow): Continuity {
        const props: ContinuityProps = {
            id: EntityID.fromStringOrThrow(row.id),
            name: Name.create(row.name).value,
            description: RichText.fromString(row.description ?? ''),
            worldID: EntityID.fromStringOrThrow(row.world_id),
            branchedFromID: row.branched_from_id ? EntityID.fromStringOrThrow(row.branched_from_id) : null,
            branchPointEventID: row.branch_point_event_id ? EntityID.fromStringOrThrow(row.branch_point_event_id) : null,
            timestamps: Timestamps.fromStringsOrThrow(row.created_at, row.modified_at),
        };
        return Continuity.fromProps(props);
    }

    private toRow(continuity: Continuity): ContinuityRow {
        return {
            id: continuity.id.toString(),
            world_id: continuity.worldID.toString(),
            name: continuity.name.toString(),
            description: continuity.description.toString() || null,
            branched_from_id: continuity.branchedFromID?.toString() ?? null,
            branch_point_event_id: continuity.branchPointEventID?.toString() ?? null,
            created_at: continuity.createdAt.toISOString(),
            modified_at: continuity.modifiedAt.toISOString(),
        };
    }
}