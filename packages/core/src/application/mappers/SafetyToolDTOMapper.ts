import { SafetyToolConfiguration } from '../../domain/entities/SafetyToolConfiguration';
import { SafetyToolDefinition } from '../../domain/value-objects/SafetyToolDefinition';
import { SafetyToolConfigurationDTO, SafetyToolDefinitionDTO } from '../dtos/SafetyToolDTOs';

/**
 * Mapper for converting safety tool domain objects to DTOs.
 */
export class SafetyToolDTOMapper {
    /**
     * Converts a SafetyToolDefinition to its DTO representation.
     */
    static toolToDTO(tool: SafetyToolDefinition): SafetyToolDefinitionDTO {
        return {
            type: tool.type,
            name: tool.name.toString(),
            description: tool.description,
            isEnabled: tool.isEnabled,
            isBuiltIn: tool.isBuiltIn,
            customId: tool.customId,
            displayOrder: tool.displayOrder,
            configuration: tool.configuration
        };
    }

    /**
     * Converts a SafetyToolConfiguration to its DTO representation.
     */
    static configToDTO(config: SafetyToolConfiguration): SafetyToolConfigurationDTO {
        return {
            id: config.id.toString(),
            campaignId: config.campaignID.toString(),
            tools: config.tools.map(SafetyToolDTOMapper.toolToDTO),
            createdAt: config.createdAt.toISOString(),
            modifiedAt: config.modifiedAt.toISOString()
        };
    }
}