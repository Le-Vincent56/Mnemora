import { Result } from '../core/Result';
import { ValidationError } from '../core/errors';
import { EntityID } from '../value-objects/EntityID';
import { Timestamps } from '../value-objects/Timestamps';
import { SafetyToolType } from '../value-objects/SafetyToolType';
import { SafetyToolConfig } from '../value-objects/SafetyToolConfig';
import { SafetyToolDefinition } from '../value-objects/SafetyToolDefinition';
import { DEFAULT_SAFETY_TOOLS } from '../constants/defaultSafetyTools';

/**
 * Props for reconstructing a SafetyToolConfiguration from persistence.
 */
export interface SafetyToolConfigurationProps {
    id: EntityID;
    campaignID: EntityID;
    tools: SafetyToolDefinition[];
    timestamps: Timestamps;
}

/**
 * SafetyToolConfiguration: Aggregate root for a campaign's safety tools.
 * Each campaign has exactly one SafetyToolConfiguration.
 * Contains a collection of SafetyToolDefinition value objects.
 */
export class SafetyToolConfiguration {
    private readonly _id: EntityID;
    private readonly _campaignID: EntityID;
    private _tools: SafetyToolDefinition[];
    private _timestamps: Timestamps;

    /**
     * The unique identifier for this configuration.
     */
    get id(): EntityID {
        return this._id;
    }

    /**
     * The ID of the Campaign this configuration belongs to.
     * Immutable — a configuration cannot be moved between campaigns.
     */
    get campaignID(): EntityID {
        return this._campaignID;
    }

    /**
     * All safety tools in this configuration.
     * Returns a copy to prevent external mutation.
     */
    get tools(): readonly SafetyToolDefinition[] {
        return [...this._tools];
    }

    /**
     * Only the enabled safety tools.
     */
    get enabledTools(): readonly SafetyToolDefinition[] {
        return this._tools.filter(t => t.isEnabled);
    }

    /**
     * The creation and modification timestamps.
     */
    get timestamps(): Timestamps {
        return this._timestamps;
    }

    /**
     * Shorthand for timestamps.createdAt.
     */
    get createdAt(): Date {
        return this._timestamps.createdAt;
    }

    /**
     * Shorthand for timestamps.modifiedAt.
     */
    get modifiedAt(): Date {
        return this._timestamps.modifiedAt;
    }

    private constructor(props: SafetyToolConfigurationProps) {
        this._id = props.id;
        this._campaignID = props.campaignID;
        this._tools = props.tools;
        this._timestamps = props.timestamps;
    }

    /**
     * Creates a new SafetyToolConfiguration for a campaign with default tools.
     */
    static createForCampaign(campaignID: EntityID): SafetyToolConfiguration {
        const tools = DEFAULT_SAFETY_TOOLS.map(props =>
            SafetyToolDefinition.fromProps(props)
        );

        return new SafetyToolConfiguration({
            id: EntityID.generate(),
            campaignID,
            tools,
            timestamps: Timestamps.now()
        });
    }

    /**
     * Reconstructs a SafetyToolConfiguration from persistence data.
     * Use when hydrating from database.
     */
    static fromProps(props: SafetyToolConfigurationProps): SafetyToolConfiguration {
        return new SafetyToolConfiguration(props);
    }

    /**
     * Checks if Stars & Wishes is enabled.
     */
    hasStarsAndWishes(): boolean {
        return this._tools.some(
            t => t.type === SafetyToolType.STARS_AND_WISHES && t.isEnabled
        );
    }

    /**
     * Checks if Lines & Veils is enabled.
     */
    hasLinesAndVeils(): boolean {
        return this._tools.some(
            t => t.type === SafetyToolType.LINES_AND_VEILS && t.isEnabled
        );
    }

    /**
     * Gets a specific tool by type.
     * Returns undefined if not found.
     */
    getTool(type: SafetyToolType): SafetyToolDefinition | undefined {
        return this._tools.find(t => t.type === type);
    }

    /**
     * Gets a custom tool by its customId.
     */
    getCustomTool(customId: string): SafetyToolDefinition | undefined {
        return this._tools.find(t => t.customId === customId);
    }

    /**
     * Enables a tool by type.
     */
    enableTool(type: SafetyToolType): void {
        this._tools = this._tools.map(t =>
            t.type === type ? t.enable() : t
        );
        this.touch();
    }

    /**
     * Disables a tool by type.
     */
    disableTool(type: SafetyToolType): void {
        this._tools = this._tools.map(t =>
            t.type === type ? t.disable() : t
        );
        this.touch();
    }

    /**
     * Updates the configuration for a specific tool.
     */
    updateToolConfig(type: SafetyToolType, config: SafetyToolConfig): void {
        this._tools = this._tools.map(t =>
            t.type === type ? t.updateConfiguration(config) : t
        );
        this.touch();
    }

    /**
     * Adds a custom safety tool.
     */
    addCustomTool(
        name: string,
        description: string,
        quickRefText: string
    ): Result<void, ValidationError> {
        const toolResult = SafetyToolDefinition.create({
            type: SafetyToolType.CUSTOM,
            name,
            description,
            isEnabled: true,
            displayOrder: this._tools.length,
            configuration: {
                type: SafetyToolType.CUSTOM,
                notes: '',
                quickRefText
            }
        });

        if (toolResult.isFailure) {
            return Result.fail(toolResult.error);
        }

        this._tools = [...this._tools, toolResult.value];
        this.touch();
        return Result.okVoid();
    }

    /**
     * Removes a custom tool by its customId.
     * Built-in tools cannot be removed.
     */
    removeCustomTool(customId: string): void {
        this._tools = this._tools.filter(t => t.customId !== customId);
        this.touch();
    }

    /**
     * Updates the modifiedAt timestamp to now.
     */
    private touch(): void {
        this._timestamps = this._timestamps.touch();
    }

    /**
     * Checks equality by ID only.
     */
    equals(other: SafetyToolConfiguration): boolean {
        if (other === null || other === undefined) {
            return false;
        }
        return this._id.equals(other._id);
    }
}