import Database from 'better-sqlite3';
import { Result } from '../../domain/core/Result';
import { RepositoryError } from '../../domain/core/errors';
import { IDriftRepository } from '../../domain/repositories/IDriftRepository';
import { Drift } from '../../domain/types/Drift';
import { EntityID } from '../../domain/value-objects/EntityID';

interface DriftRow {
    id: string;
    entity_id: string;
    continuity_id: string;
    field: string;
    event_derived_value: string;
    current_value: string;
    detected_at: string;
    resolved_at: string | null;
}

export class SQLiteDriftRepository implements IDriftRepository {
    constructor(private readonly db: Database.Database) { }

    async save(drift: Drift): Promise<Result<void, RepositoryError>> {
        try {
            this.db.prepare(`
                  INSERT INTO entity_drifts (
                      id, entity_id, continuity_id, field,
                      event_derived_value, current_value, detected_at, resolved_at
                  ) VALUES (
                      @id, @entity_id, @continuity_id, @field,
                      @event_derived_value, @current_value, @detected_at, @resolved_at
                  )
                  ON CONFLICT(entity_id, continuity_id, field) DO UPDATE SET
                      event_derived_value = @event_derived_value,
                      current_value = @current_value,
                      detected_at = @detected_at,
                      resolved_at = NULL
              `).run({
                id: drift.id.toString(),
                entity_id: drift.entityID.toString(),
                continuity_id: drift.continuityID.toString(),
                field: drift.field,
                event_derived_value: drift.eventDerivedValue,
                current_value: drift.currentValue,
                detected_at: drift.detectedAt.toISOString(),
                resolved_at: drift.resolvedAt?.toISOString() ?? null,
            });

            return Result.ok(undefined);
        } catch (error) {
            return Result.fail(new RepositoryError('Failed to save drift', error));
        }
    }

    async findByEntity(entityID: EntityID): Promise<Result<Drift[], RepositoryError>> {
        try {
            const rows = this.db.prepare(
                'SELECT * FROM entity_drifts WHERE entity_id = ? ORDER BY detected_at DESC'
            ).all(entityID.toString()) as DriftRow[];

            return Result.ok(rows.map(r => this.toDomain(r)));
        } catch (error) {
            return Result.fail(new RepositoryError('Failed to find drifts by entity', error));
        }
    }

    async findByContinuity(continuityID: EntityID): Promise<Result<Drift[], RepositoryError>> {
        try {
            const rows = this.db.prepare(
                'SELECT * FROM entity_drifts WHERE continuity_id = ? ORDER BY detected_at DESC'
            ).all(continuityID.toString()) as DriftRow[];

            return Result.ok(rows.map(r => this.toDomain(r)));
        } catch (error) {
            return Result.fail(new RepositoryError('Failed to find drifts by continuity', error));
        }
    }

    async findUnresolved(filter?: {
        entityID?: EntityID;
        continuityID?: EntityID;
    }): Promise<Result<Drift[], RepositoryError>> {
        try {
            const conditions: string[] = ['resolved_at IS NULL'];
            const params: unknown[] = [];

            if (filter?.entityID) {
                conditions.push('entity_id = ?');
                params.push(filter.entityID.toString());
            }

            if (filter?.continuityID) {
                conditions.push('continuity_id = ?');
                params.push(filter.continuityID.toString());
            }

            const whereClause = 'WHERE ' + conditions.join(' AND ');

            const rows = this.db.prepare(
                `SELECT * FROM entity_drifts ${whereClause} ORDER BY detected_at DESC`
            ).all(...params) as DriftRow[];

            return Result.ok(rows.map(r => this.toDomain(r)));
        } catch (error) {
            return Result.fail(new RepositoryError('Failed to find unresolved drifts', error));
        }
    }

    async resolve(driftID: EntityID): Promise<Result<void, RepositoryError>> {
        try {
            this.db.prepare(
                'UPDATE entity_drifts SET resolved_at = ? WHERE id = ?'
            ).run(new Date().toISOString(), driftID.toString());

            return Result.ok(undefined);
        } catch (error) {
            return Result.fail(new RepositoryError('Failed to resolve drift', error));
        }
    }

    async resolveByMatch(
        entityID: EntityID,
        continuityID: EntityID,
        field: string
    ): Promise<Result<void, RepositoryError>> {
        try {
            this.db.prepare(
                'UPDATE entity_drifts SET resolved_at = ? WHERE entity_id = ? AND continuity_id = ? AND field = ? AND resolved_at IS NULL'
            ).run(new Date().toISOString(), entityID.toString(), continuityID.toString(), field);

            return Result.ok(undefined);
        } catch (error) {
            return Result.fail(new RepositoryError('Failed to resolve drift by match', error));
        }
    }

    async deleteByEntity(entityID: EntityID): Promise<Result<void, RepositoryError>> {
        try {
            this.db.prepare(
                'DELETE FROM entity_drifts WHERE entity_id = ?'
            ).run(entityID.toString());

            return Result.ok(undefined);
        } catch (error) {
            return Result.fail(new RepositoryError('Failed to delete drifts by entity', error));
        }
    }

    private toDomain(row: DriftRow): Drift {
        return {
            id: EntityID.fromStringOrThrow(row.id),
            entityID: EntityID.fromStringOrThrow(row.entity_id),
            continuityID: EntityID.fromStringOrThrow(row.continuity_id),
            field: row.field,
            eventDerivedValue: row.event_derived_value,
            currentValue: row.current_value,
            detectedAt: new Date(row.detected_at),
            resolvedAt: row.resolved_at ? new Date(row.resolved_at) : null,
        };
    }
}