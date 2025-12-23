import { SafetyToolType } from '../value-objects/SafetyToolType';
import { SafetyToolDefinitionProps } from '../value-objects/SafetyToolDefinition';
import { Name } from '../value-objects/Name';

/**
 * Default safety tools provided to every new campaign.
 * All tools are disabled by default — GMs opt-in to what they need.
 */
export const DEFAULT_SAFETY_TOOLS: SafetyToolDefinitionProps[] = [
    {
        type: SafetyToolType.LINES_AND_VEILS,
        name: Name.create('Lines & Veils').value,
        description: 'Define content that should never appear (Lines) or happen off-screen (Veils)',
        isEnabled: false,
        isBuiltIn: true,
        customId: null,
        displayOrder: 0,
        configuration: {
            type: SafetyToolType.LINES_AND_VEILS,
            lines: [],
            veils: []
        }
    },
    {
        type: SafetyToolType.X_CARD,
        name: Name.create('X-Card').value,
        description: 'Any player can "X" a scene to skip or fade-to-black, no questions asked',
        isEnabled: false,
        isBuiltIn: true,
        customId: null,
        displayOrder: 1,
        configuration: {
            type: SafetyToolType.X_CARD
        }
    },
    {
        type: SafetyToolType.STARS_AND_WISHES,
        name: Name.create('Stars & Wishes').value,
        description: 'End-of-session feedback: Stars (what went well) and Wishes (what you want more of)',
        isEnabled: false,
        isBuiltIn: true,
        customId: null,
        displayOrder: 2,
        configuration: {
            type: SafetyToolType.STARS_AND_WISHES,
            collectAtSessionEnd: true
        }
    },
    {
        type: SafetyToolType.OPEN_DOOR,
        name: Name.create('Open Door').value,
        description: 'Players may step away at any time, no questions asked',
        isEnabled: false,
        isBuiltIn: true,
        customId: null,
        displayOrder: 3,
        configuration: {
            type: SafetyToolType.OPEN_DOOR
        }
    },
    {
        type: SafetyToolType.SCRIPT_CHANGE,
        name: Name.create('Script Change').value,
        description: 'Rewind, pause, fast-forward, or "instant replay" scene moments',
        isEnabled: false,
        isBuiltIn: true,
        customId: null,
        displayOrder: 4,
        configuration: {
            type: SafetyToolType.SCRIPT_CHANGE
        }
    }
];