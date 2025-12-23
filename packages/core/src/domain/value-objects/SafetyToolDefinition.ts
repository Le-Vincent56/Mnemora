import { Result } from '../core/Result';
import { ValidationError } from '../core/errors';
import { Name } from './Name';
import { SafetyToolType } from './SafetyToolType';
import { SafetyToolConfig, createDefaultConfig } from './SafetyToolConfig';

/**
 * Maximum length for safety tool description.
 */
const MAX_DESCRIPTION_LENGTH = 500;

/**
 * Props for creating a new SafetyToolDefinition.
 */
export interface CreateSafetyToolDefinitionProps {
    type: SafetyToolType;
    name: string;
    description: string;
    isEnabled?: boolean;
    displayOrder?: number;
    configuration?: SafetyToolConfig;
    customId?: string;
}

/**
 * Props for reconstructing a SafetyToolDefinition from persistence.
 */
export interface SafetyToolDefinitionProps {
    readonly type: SafetyToolType;
    readonly name: Name;
    readonly description: string;
    readonly isEnabled: boolean;
    readonly isBuiltIn: boolean;
    readonly customId: string | null;
    readonly displayOrder: number;
    readonly configuration: SafetyToolConfig;
}

/**
 * SafetyToolDefinition: Value Object representing a single safety tool.
 * Immutable - all modification methods return new instances.
 */
export class SafetyToolDefinition {
    private readonly props: SafetyToolDefinitionProps;

    private constructor(props: SafetyToolDefinitionProps) {
        this.props = props;
        Object.freeze(this);
    }

    /**
     * Creates a new SafetyToolDefinition with validation.
     */
    static create(props: CreateSafetyToolDefinitionProps): Result<SafetyToolDefinition, ValidationError> {
        // Validate name
        const nameResult = Name.create(props.name);
        if (nameResult.isFailure) {
            return Result.fail(nameResult.error);
        }

        // Validate description length
        if (props.description.length > MAX_DESCRIPTION_LENGTH) {
            return Result.fail(
                ValidationError.tooLong('Description', MAX_DESCRIPTION_LENGTH)
            );
        }

        const isBuiltIn = props.type !== SafetyToolType.CUSTOM;
        const customId = props.type === SafetyToolType.CUSTOM
            ? (props.customId ?? crypto.randomUUID())
            : null;

        return Result.ok(new SafetyToolDefinition({
            type: props.type,
            name: nameResult.value,
            description: props.description,
            isEnabled: props.isEnabled ?? false,
            isBuiltIn,
            customId,
            displayOrder: props.displayOrder ?? 0,
            configuration: props.configuration ?? createDefaultConfig(props.type)
        }));
    }

    /**
     * Reconstructs a SafetyToolDefinition from persistence data.
     * Use when hydrating from database — assumes data is already valid.
     */
    static fromProps(props: SafetyToolDefinitionProps): SafetyToolDefinition {
        return new SafetyToolDefinition(props);
    }

    // Getters
    get type(): SafetyToolType { return this.props.type; }
    get name(): Name { return this.props.name; }
    get description(): string { return this.props.description; }
    get isEnabled(): boolean { return this.props.isEnabled; }
    get isBuiltIn(): boolean { return this.props.isBuiltIn; }
    get customId(): string | null { return this.props.customId; }
    get displayOrder(): number { return this.props.displayOrder; }
    get configuration(): SafetyToolConfig { return this.props.configuration; }

    /**
     * Returns a new SafetyToolDefinition with isEnabled set to true.
     */
    enable(): SafetyToolDefinition {
        return new SafetyToolDefinition({ ...this.props, isEnabled: true });
    }

    /**
     * Returns a new SafetyToolDefinition with isEnabled set to false.
     */
    disable(): SafetyToolDefinition {
        return new SafetyToolDefinition({ ...this.props, isEnabled: false });
    }

    /**
     * Returns a new SafetyToolDefinition with updated configuration.
     */
    updateConfiguration(config: SafetyToolConfig): SafetyToolDefinition {
        return new SafetyToolDefinition({ ...this.props, configuration: config });
    }

    /**
     * Returns a new SafetyToolDefinition with updated display order.
     */
    withDisplayOrder(order: number): SafetyToolDefinition {
        return new SafetyToolDefinition({ ...this.props, displayOrder: order });
    }

    /**
     * Checks equality with another SafetyToolDefinition.
     * For built-in tools, compares by type.
     * For custom tools, compares by customId.
     */
    equals(other: SafetyToolDefinition): boolean {
        if (this.isBuiltIn && other.isBuiltIn) {
            return this.type === other.type;
        }
        return this.customId === other.customId;
    }
}