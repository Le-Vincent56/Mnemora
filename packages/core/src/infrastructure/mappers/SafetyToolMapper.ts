import { SafetyToolConfiguration, SafetyToolConfigurationProps } from '../../domain/entities/SafetyToolConfiguration';
import { SafetyToolDefinition, SafetyToolDefinitionProps } from '../../domain/value-objects/SafetyToolDefinition';
import { SafetyToolType, isSafetyToolType } from '../../domain/value-objects/SafetyToolType';
import { SafetyToolConfig } from '../../domain/value-objects/SafetyToolConfig';
import { EntityID } from '../../domain/value-objects/EntityID';
import { Name } from '../../domain/value-objects/Name';
import { Timestamps } from '../../domain/value-objects/Timestamps';

/**
 * Database row type for safety_tool_configurations table.
 */
export interface SafetyToolConfigurationRow {
    id: string;
    campaign_id: string;
    created_at: string;
    modified_at: string;
}

/**
 * Database row type for safety_tools table.
 */
export interface SafetyToolRow {
    id: string;
    configuration_id: string;
    type: string;
    name: string;
    description: string;
    is_enabled: number;  // SQLite uses 0/1 for boolean
    is_built_in: number;
    custom_id: string | null;
    display_order: number;
    config_json: string;
    created_at: string;
    modified_at: string;
}

/**
 * Mapper for SafetyToolConfiguration and SafetyToolDefinition entities.
 * Converts between database rows and domain entities.
 */
export class SafetyToolMapper {
    /**
     * Converts a database row to a SafetyToolDefinition value object.
     */
    static toolToDomain(row: SafetyToolRow): SafetyToolDefinition {
        const type = isSafetyToolType(row.type)
            ? row.type as SafetyToolType
            : SafetyToolType.CUSTOM;

        const props: SafetyToolDefinitionProps = {
            type,
            name: Name.create(row.name).value,
            description: row.description,
            isEnabled: row.is_enabled === 1,
            isBuiltIn: row.is_built_in === 1,
            customId: row.custom_id,
            displayOrder: row.display_order,
            configuration: JSON.parse(row.config_json) as SafetyToolConfig
        };

        return SafetyToolDefinition.fromProps(props);
    }

    /**
     * Converts a SafetyToolDefinition to a database row.
     * Requires the configuration_id since tools are stored in a separate table.
     */
    static toolToRow(
        tool: SafetyToolDefinition,
        configurationId: string
    ): Omit<SafetyToolRow, 'id' | 'created_at' | 'modified_at'> & { id: string; created_at: string; modified_at: string } {
        const now = new Date().toISOString();
        const id = tool.customId ?? `${configurationId}_${tool.type}`;

        return {
            id,
            configuration_id: configurationId,
            type: tool.type,
            name: tool.name.toString(),
            description: tool.description,
            is_enabled: tool.isEnabled ? 1 : 0,
            is_built_in: tool.isBuiltIn ? 1 : 0,
            custom_id: tool.customId,
            display_order: tool.displayOrder,
            config_json: JSON.stringify(tool.configuration),
            created_at: now,
            modified_at: now
        };
    }

    /**
     * Converts database rows to a SafetyToolConfiguration domain entity.
     * Requires both the configuration row and all its tool rows.
     */
    static configToDomain(
        configRow: SafetyToolConfigurationRow,
        toolRows: SafetyToolRow[]
    ): SafetyToolConfiguration {
        const tools = toolRows
            .sort((a, b) => a.display_order - b.display_order)
            .map(SafetyToolMapper.toolToDomain);

        const props: SafetyToolConfigurationProps = {
            id: EntityID.fromStringOrThrow(configRow.id),
            campaignID: EntityID.fromStringOrThrow(configRow.campaign_id),
            tools,
            timestamps: Timestamps.fromStringsOrThrow(
                configRow.created_at,
                configRow.modified_at
            )
        };

        return SafetyToolConfiguration.fromProps(props);
    }

    /**
     * Converts a SafetyToolConfiguration to a database row.
     * Note: Tools are stored separately and need their own insert statements.
     */
    static configToRow(config: SafetyToolConfiguration): SafetyToolConfigurationRow {
        return {
            id: config.id.toString(),
            campaign_id: config.campaignID.toString(),
            created_at: config.createdAt.toISOString(),
            modified_at: config.modifiedAt.toISOString()
        };
    }
}