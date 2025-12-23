import Database from 'better-sqlite3';
import { Result } from '../../domain/core/Result';
import { RepositoryError } from '../../domain/core/errors';
import { ISafetyToolRepository } from '../../domain/repositories/ISafetyToolRepository';
import { SafetyToolConfiguration } from '../../domain/entities/SafetyToolConfiguration';
import { EntityID } from '../../domain/value-objects/EntityID';
import {
    SafetyToolMapper,
    SafetyToolConfigurationRow,
    SafetyToolRow
} from '../mappers/SafetyToolMapper';

export class SQLiteSafetyToolRepository implements ISafetyToolRepository {
    constructor(private readonly db: Database.Database) { }

    async findById(id: EntityID): Promise<Result<SafetyToolConfiguration | null, RepositoryError>> {
        try {
            const configRow = this.db.prepare(
                'SELECT * FROM safety_tool_configurations WHERE id = ?'
            ).get(id.toString()) as SafetyToolConfigurationRow | undefined;

            if (!configRow) {
                return Result.ok(null);
            }

            const toolRows = this.db.prepare(
                'SELECT * FROM safety_tools WHERE configuration_id = ? ORDER BY display_order'
            ).all(configRow.id) as SafetyToolRow[];

            return Result.ok(SafetyToolMapper.configToDomain(configRow, toolRows));
        } catch (error) {
            return Result.fail(new RepositoryError('Failed to find safety tool configuration by ID', error));
        }
    }

    async findByCampaignId(campaignId: EntityID): Promise<Result<SafetyToolConfiguration | null, RepositoryError>> {
        try {
            const configRow = this.db.prepare(
                'SELECT * FROM safety_tool_configurations WHERE campaign_id = ?'
            ).get(campaignId.toString()) as SafetyToolConfigurationRow | undefined;

            if (!configRow) {
                return Result.ok(null);
            }

            const toolRows = this.db.prepare(
                'SELECT * FROM safety_tools WHERE configuration_id = ? ORDER BY display_order'
            ).all(configRow.id) as SafetyToolRow[];

            return Result.ok(SafetyToolMapper.configToDomain(configRow, toolRows));
        } catch (error) {
            return Result.fail(new RepositoryError('Failed to find safety tool configuration by campaign ID', error));
        }
    }

    async save(config: SafetyToolConfiguration): Promise<Result<void, RepositoryError>> {
        try {
            const configRow = SafetyToolMapper.configToRow(config);

            // Use a transaction to ensure atomicity
            this.db.transaction(() => {
                // Upsert the configuration
                this.db.prepare(`
                      INSERT INTO safety_tool_configurations (id, campaign_id, created_at, modified_at)
                      VALUES (@id, @campaign_id, @created_at, @modified_at)
                      ON CONFLICT(id) DO UPDATE SET
                          modified_at = @modified_at
                  `).run(configRow);

                // Delete existing tools and re-insert
                // This simplifies handling adds/removes/updates
                this.db.prepare(
                    'DELETE FROM safety_tools WHERE configuration_id = ?'
                ).run(config.id.toString());

                // Insert all tools
                const insertTool = this.db.prepare(`
                      INSERT INTO safety_tools (
                          id, configuration_id, type, name, description,
                          is_enabled, is_built_in, custom_id, display_order,
                          config_json, created_at, modified_at
                      ) VALUES (
                          @id, @configuration_id, @type, @name, @description,
                          @is_enabled, @is_built_in, @custom_id, @display_order,
                          @config_json, @created_at, @modified_at
                      )
                  `);

                for (const tool of config.tools) {
                    const toolRow = SafetyToolMapper.toolToRow(tool, config.id.toString());
                    insertTool.run(toolRow);
                }
            })();

            return Result.ok(undefined);
        } catch (error) {
            return Result.fail(new RepositoryError('Failed to save safety tool configuration', error));
        }
    }

    async delete(id: EntityID): Promise<Result<void, RepositoryError>> {
        try {
            // Tools are cascade-deleted via foreign key
            this.db.prepare(
                'DELETE FROM safety_tool_configurations WHERE id = ?'
            ).run(id.toString());

            return Result.ok(undefined);
        } catch (error) {
            return Result.fail(new RepositoryError('Failed to delete safety tool configuration', error));
        }
    }

    async deleteByCampaignId(campaignId: EntityID): Promise<Result<void, RepositoryError>> {
        try {
            // Tools are cascade-deleted via foreign key
            this.db.prepare(
                'DELETE FROM safety_tool_configurations WHERE campaign_id = ?'
            ).run(campaignId.toString());

            return Result.ok(undefined);
        } catch (error) {
            return Result.fail(new RepositoryError('Failed to delete safety tool configuration by campaign ID', error));
        }
    }

    async existsForCampaign(campaignId: EntityID): Promise<Result<boolean, RepositoryError>> {
        try {
            const row = this.db.prepare(
                'SELECT 1 FROM safety_tool_configurations WHERE campaign_id = ?'
            ).get(campaignId.toString());

            return Result.ok(row !== undefined);
        } catch (error) {
            return Result.fail(new RepositoryError('Failed to check if safety tool configuration exists', error));
        }
    }
}