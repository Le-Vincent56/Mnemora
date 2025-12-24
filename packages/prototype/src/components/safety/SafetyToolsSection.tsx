import { useCallback } from 'react';
import { ChevronRight, Plus } from 'lucide-react';
import './SafetyToolsSection.css';

// Types matching the SafetyToolState from CampaignCreationModal
export interface SafetyToolState {
    linesAndVeils: { enabled: boolean; lines: string[]; veils: string[] };
    xCard: { enabled: boolean };
    starsAndWishes: { enabled: boolean };
    openDoor: { enabled: boolean };
    scriptChange: { enabled: boolean };
}

export interface SafetyToolsSectionProps {
    value: SafetyToolState;
    onChange: (value: SafetyToolState) => void;
    onSetupLinesAndVeils?: () => void;
    onAddCustomBoundary?: () => void;
}

// Tool definitions
const SAFETY_TOOLS = [
    {
        key: 'linesAndVeils' as const,
        name: 'Lines & Veils',
        description: 'Hard limits and soft boundaries for content',
        hasSetup: true,
    },
    {
        key: 'xCard' as const,
        name: 'X-Card',
        description: 'Instant "skip this content" signal',
        hasSetup: false,
    },
    {
        key: 'starsAndWishes' as const,
        name: 'Stars & Wishes',
        description: 'End-of-session feedback ritual',
        hasSetup: false,
    },
    {
        key: 'openDoor' as const,
        name: 'Open Door',
        description: 'Permission to step away, no questions',
        hasSetup: false,
    },
    {
        key: 'scriptChange' as const,
        name: 'Script Change',
        description: 'Rewind, pause, or fast-forward scenes',
        hasSetup: false,
    },
] as const;

export const DEFAULT_SAFETY_TOOLS: SafetyToolState = {
    linesAndVeils: { enabled: false, lines: [], veils: [] },
    xCard: { enabled: false },
    starsAndWishes: { enabled: false },
    openDoor: { enabled: false },
    scriptChange: { enabled: false },
};

type ToolKey = typeof SAFETY_TOOLS[number]['key'];

export function SafetyToolsSection({
    value,
    onChange,
    onSetupLinesAndVeils,
    onAddCustomBoundary,
}: SafetyToolsSectionProps) {
    const handleToggle = useCallback((toolKey: ToolKey, enabled: boolean) => {
        onChange({
            ...value,
            [toolKey]: {
                ...value[toolKey],
                enabled,
            },
        });
    }, [value, onChange]);

    return (
        <div className="safety-tools-section">
            <div className="safety-tools-section__list">
                {SAFETY_TOOLS.map((tool) => (
                    <SafetyToolToggle
                        key={tool.key}
                        name={tool.name}
                        description={tool.description}
                        enabled={value[tool.key].enabled}
                        onToggle={(enabled) => handleToggle(tool.key, enabled)}
                        showSetup={tool.hasSetup && value[tool.key].enabled}
                        onSetup={tool.key === 'linesAndVeils' ? onSetupLinesAndVeils : undefined}
                    />
                ))}
            </div>

            <button
                type="button"
                className="safety-tools-section__add-custom"
                onClick={onAddCustomBoundary}
            >
                <Plus size={14} />
                <span>Add Custom Boundary</span>
            </button>
        </div>
    );
}

// Individual toggle component
interface SafetyToolToggleProps {
    name: string;
    description: string;
    enabled: boolean;
    onToggle: (enabled: boolean) => void;
    showSetup?: boolean;
    onSetup?: () => void;
}

export function SafetyToolToggle({
    name,
    description,
    enabled,
    onToggle,
    showSetup,
    onSetup,
}: SafetyToolToggleProps) {
    const toggleId = `toggle-${name.toLowerCase().replace(/\s+/g, '-')}`;

    return (
        <div className={`safety-tool-toggle ${enabled ? 'safety-tool-toggle--enabled' : ''}`}>
            <div className="safety-tool-toggle__content">
                <div className="safety-tool-toggle__header">
                    <label
                        htmlFor={toggleId}
                        className="safety-tool-toggle__name"
                    >
                        {name}
                    </label>

                    {showSetup && onSetup && (
                        <button
                            type="button"
                            className="safety-tool-toggle__setup"
                            onClick={onSetup}
                        >
                            Setup
                            <ChevronRight size={12} />
                        </button>
                    )}
                </div>

                <p className="safety-tool-toggle__description">
                    {description}
                </p>
            </div>

            <button
                type="button"
                id={toggleId}
                role="switch"
                aria-checked={enabled}
                className={`safety-tool-toggle__switch ${enabled ? 'safety-tool-toggle__switch--on' : ''}`}
                onClick={() => onToggle(!enabled)}
            >
                <span className="safety-tool-toggle__switch-thumb" />
                <span className="sr-only">
                    {enabled ? `Disable ${name}` : `Enable ${name}`}
                </span>
            </button>
        </div>
    );
}