/**
 * World/Campaign data types and mock data for the World Title Page.
 * These types mirror the domain entities but are simplified for the prototype.
 */

export interface Campaign {
    id: string;
    name: string;
    description?: string;
    sessionCount: number;
    entityCount: number;
    lastOpenedAt: Date;
}

export interface World {
    id: string;
    name: string;
    tagline?: string; // e.g., "A World of Fractured Realms"
    campaigns: Campaign[];
    entityCount: number; // Total across all campaigns
    createdAt: Date;
    lastOpenedAt: Date;
}

export interface UserContext {
    lastWorldId?: string;
    lastCampaignId?: string;
    lastOpenedAt?: Date;
}

// Mock Data
const now = new Date();
const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

export const MOCK_CAMPAIGNS: Record<string, Campaign[]> = {
    aethermoor: [
        {
            id: 'camp-iron-war',
            name: 'The Iron War',
            description: 'A brutal conflict reshapes the realm',
            sessionCount: 12,
            entityCount: 47,
            lastOpenedAt: daysAgo(2),
        },
        {
            id: 'camp-shattered-isles',
            name: 'Shattered Isles',
            description: 'Exploring the archipelago of lost civilizations',
            sessionCount: 8,
            entityCount: 31,
            lastOpenedAt: daysAgo(14),
        },
    ],
    starhollow: [
        {
            id: 'camp-whispers',
            name: 'Whispers in the Fog',
            description: 'Something stirs in the old manor',
            sessionCount: 6,
            entityCount: 23,
            lastOpenedAt: daysAgo(21),
        },
    ],
    ironvale: [
        {
            id: 'camp-revolution',
            name: 'The Gearwright Revolution',
            sessionCount: 15,
            entityCount: 62,
            lastOpenedAt: daysAgo(1),
        },
        {
            id: 'camp-undercity',
            name: 'Secrets of the Undercity',
            sessionCount: 4,
            entityCount: 18,
            lastOpenedAt: daysAgo(45),
        },
        {
            id: 'camp-sky-pirates',
            name: 'The Sky Pirates',
            sessionCount: 9,
            entityCount: 34,
            lastOpenedAt: daysAgo(7),
        },
    ],
    dusklands: [
        {
            id: 'camp-last-light',
            name: 'The Last Light',
            sessionCount: 3,
            entityCount: 12,
            lastOpenedAt: daysAgo(60),
        },
    ],
};

export const MOCK_WORLDS: World[] = [
    {
        id: 'world-aethermoor',
        name: 'Aethermoor',
        tagline: 'A World of Fractured Realms',
        campaigns: MOCK_CAMPAIGNS.aethermoor,
        entityCount: 78,
        createdAt: daysAgo(180),
        lastOpenedAt: daysAgo(0), // Today
    },
    {
        id: 'world-starhollow',
        name: 'Starhollow',
        tagline: 'Victorian Horror & Dark Mysteries',
        campaigns: MOCK_CAMPAIGNS.starhollow,
        entityCount: 23,
        createdAt: daysAgo(90),
        lastOpenedAt: daysAgo(21),
    },
    {
        id: 'world-ironvale',
        name: 'Ironvale',
        tagline: 'Industrial Fantasy & Airship Adventures',
        campaigns: MOCK_CAMPAIGNS.ironvale,
        entityCount: 114,
        createdAt: daysAgo(365),
        lastOpenedAt: daysAgo(1),
    },
    {
        id: 'world-dusklands',
        name: 'Dusklands',
        tagline: 'Post-Apocalyptic Survival',
        campaigns: MOCK_CAMPAIGNS.dusklands,
        entityCount: 12,
        createdAt: daysAgo(60),
        lastOpenedAt: daysAgo(60),
    },
];

// Helper Functions
export function getWorldById(id: string): World | undefined {
    return MOCK_WORLDS.find((w) => w.id === id);
}

export function getCampaignById(worldId: string, campaignId: string): Campaign | undefined {
    const world = getWorldById(worldId);
    return world?.campaigns.find((c) => c.id === campaignId);
}

export function formatRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 14) return '1 week ago';
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 60) return '1 month ago';
    return `${Math.floor(diffDays / 30)} months ago`;
}

/**
 * Simulates retrieving the user's last session context.
 * In production, this would come from localStorage or a database.
 */
export function getMockUserContext(): UserContext {
    // OPTION 1: Return empty to see multi-world selection
    return {};
    
    // OPTION 2: Simulate a returning user who was last in Aethermoor > The Iron War
    return {
        lastWorldId: 'world-aethermoor',
        lastCampaignId: 'camp-iron-war',
        lastOpenedAt: daysAgo(1),
    };
}

/**
 * Returns worlds sorted by last opened (most recent first)
 */
export function getWorldsSortedByRecent(): World[] {
    return [...MOCK_WORLDS].sort(
        (a, b) => b.lastOpenedAt.getTime() - a.lastOpenedAt.getTime()
    );
}