import { SafetyToolType } from '../../domain/value-objects/SafetyToolType';
import { SafetyToolConfig } from '../../domain/value-objects/SafetyToolConfig';

/**
 * DTO for a single safety tool definition.
 */
export interface SafetyToolDefinitionDTO {
    readonly type: SafetyToolType;
    readonly name: string;
    readonly description: string;
    readonly isEnabled: boolean;
    readonly isBuiltIn: boolean;
    readonly customId: string | null;
    readonly displayOrder: number;
    readonly configuration: SafetyToolConfig;
}

/**
 * DTO for a campaign's safety tool configuration.
 */
export interface SafetyToolConfigurationDTO {
    readonly id: string;
    readonly campaignId: string;
    readonly tools: readonly SafetyToolDefinitionDTO[];
    readonly createdAt: string;   // ISO date string
    readonly modifiedAt: string;  // ISO date string
}

/**
 * Request DTO for getting safety tools by campaign ID.
 */
export interface GetSafetyToolsRequest {
    readonly campaignId: string;
}

/**
 * Request DTO for configuring safety tools.
 */
export interface ConfigureSafetyToolsRequest {
    readonly campaignId: string;
    readonly tools: readonly SafetyToolUpdateDTO[];
}

/**
 * DTO for updating a single tool's state.
 */
export interface SafetyToolUpdateDTO {
    readonly type: SafetyToolType;
    readonly isEnabled: boolean;
    readonly configuration?: SafetyToolConfig;
}

/**
 * Request DTO for adding a custom safety tool.
 */
export interface AddCustomSafetyToolRequest {
    readonly campaignId: string;
    readonly name: string;
    readonly description: string;
    readonly quickRefText: string;
}

/**
 * Request DTO for removing a custom safety tool.
 */
export interface RemoveCustomSafetyToolRequest {
    readonly campaignId: string;
    readonly customId: string;
}