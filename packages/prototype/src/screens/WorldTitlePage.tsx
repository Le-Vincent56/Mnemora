import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Plus } from 'lucide-react';
import {
    World,
    Campaign,
    getWorldsSortedByRecent,
    formatRelativeTime,
} from '@/data/mockWorldData';
import './WorldTitlePage.css';

// Types
type Phase =
    | 'world-select'
    | 'title-reveal'
    | 'campaign-select'
    | 'entering';

interface WorldTitlePageProps {
    onEnterWorkspace: (worldId: string, campaignId?: string) => void;
    onCreateWorld: () => void;
}


// Constellation
const STARS = [
    { x: 50, y: 25, mag: 1 }, { x: 35, y: 40, mag: 2 }, { x: 65, y: 38, mag: 2 },
    { x: 28, y: 55, mag: 3 }, { x: 50, y: 52, mag: 2 }, { x: 72, y: 55, mag: 3 },
    { x: 40, y: 68, mag: 3 }, { x: 60, y: 70, mag: 3 },
];
const LINES: [number, number][] = [[0, 1], [0, 2], [1, 3], [1, 4], [2, 4], [2, 5], [4, 6], [4, 7]];

function Constellation({ visible }: { visible: boolean }) {
    return (
        <div className={`title-constellation ${visible ? 'title-constellation--visible' : ''}`}>
            <svg viewBox="0 0 100 100" className="title-constellation__svg">
                <g className="title-constellation__lines">
                    {LINES.map(([from, to], i) => (
                        <line
                            key={`${from}-${to}`}
                            x1={STARS[from].x} y1={STARS[from].y}
                            x2={STARS[to].x} y2={STARS[to].y}
                            className="title-constellation__line"
                            style={{ animationDelay: `${0.3 + i * 0.1}s` }}
                        />
                    ))}
                </g>
                <g className="title-constellation__stars">
                    {STARS.map((star, i) => (
                        <circle
                            key={i}
                            cx={star.x} cy={star.y}
                            r={star.mag === 1 ? 2.5 : star.mag === 2 ? 1.8 : 1.2}
                            className={`title-constellation__star title-constellation__star--mag${star.mag}`}
                            style={{ animationDelay: `${0.1 + i * 0.08}s` }}
                        />
                    ))}
                </g>
            </svg>
            <div className="title-constellation__glow" />
        </div>
    );
}

// World Card
function WorldCard({ world, onClick, index }: { world: World; onClick: () => void; index: number }) {
    return (
        <button
            className="world-select-card"
            onClick={onClick}
            style={{ animationDelay: `${0.15 + index * 0.08}s` }}
        >
            <h3 className="world-select-card__name">{world.name}</h3>
            {world.tagline && <p className="world-select-card__tagline">{world.tagline}</p>}
            <div className="world-select-card__meta">
                <span>{world.campaigns.length} campaign{world.campaigns.length !== 1 ? 's' : ''}</span>
                <span className="world-select-card__dot">·</span>
                <span>{formatRelativeTime(world.lastOpenedAt)}</span>
            </div>
        </button>
    );
}

// Campaign Card
function CampaignCard({ campaign, onClick, index }: { campaign: Campaign; onClick: () => void; index: number }) {
    return (
        <button
            className="campaign-select-card"
            onClick={onClick}
            style={{ animationDelay: `${0.1 + index * 0.06}s` }}
        >
            <span className="campaign-select-card__name">{campaign.name}</span>
            <span className="campaign-select-card__meta">
                {campaign.sessionCount} sessions · {campaign.entityCount} entities
            </span>
        </button>
    );
}

// Main Component
export function WorldTitlePage({ onEnterWorkspace, onCreateWorld }: WorldTitlePageProps) {
    const worlds = useMemo(() => getWorldsSortedByRecent(), []);

    const initialPhase: Phase = worlds.length === 0 ? 'title-reveal'
        : worlds.length === 1 ? 'title-reveal' : 'world-select';

    const [phase, setPhase] = useState<Phase>(initialPhase);
    const [selectedWorld, setSelectedWorld] = useState<World | null>(
        worlds.length === 1 ? worlds[0] : null
    );
    const [showConstellation, setShowConstellation] = useState(false);
    const [showTitle, setShowTitle] = useState(false);
    const [showCampaigns, setShowCampaigns] = useState(false);
    const [isExiting, setIsExiting] = useState(false);

    const exitTimeoutRef = useRef<number>();

    // Sequenced Animations 

    // Title reveal sequence
    useEffect(() => {
        if (phase === 'title-reveal' && selectedWorld) {
            const t1 = setTimeout(() => setShowConstellation(true), 100);
            const t2 = setTimeout(() => setShowTitle(true), 700);
            const t3 = setTimeout(() => {
                if (selectedWorld.campaigns.length === 1) {
                    // Single campaign: start auto-enter
                    // (progress bar will trigger the actual enter)
                } else if (selectedWorld.campaigns.length > 1) {
                    setPhase('campaign-select');
                }
            }, 2000);

            return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
        }
    }, [phase, selectedWorld]);

    // Campaign select: show campaign cards after phase change
    useEffect(() => {
        if (phase === 'campaign-select') {
            const timer = setTimeout(() => setShowCampaigns(true), 100);
            return () => clearTimeout(timer);
        } else {
            setShowCampaigns(false);
        }
    }, [phase]);

    // Exit Handling

    const triggerExit = useCallback((worldId: string, campaignId?: string) => {
        // Start exit animation
        setIsExiting(true);

        // Wait for exit animation to complete, then call callback
        exitTimeoutRef.current = window.setTimeout(() => {
            onEnterWorkspace(worldId, campaignId);
        }, 700); // Match CSS exit duration
    }, [onEnterWorkspace]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (exitTimeoutRef.current) clearTimeout(exitTimeoutRef.current);
        };
    }, []);

    // Auto-enter for single campaign
    const handleAutoEnter = useCallback(() => {
        if (selectedWorld && selectedWorld.campaigns.length === 1) {
            triggerExit(selectedWorld.id, selectedWorld.campaigns[0].id);
        }
    }, [selectedWorld, triggerExit]);

    // Handlers

    const handleWorldSelect = useCallback((world: World) => {
        setSelectedWorld(world);
        setShowConstellation(false);
        setShowTitle(false);
        setShowCampaigns(false);

        setTimeout(() => setPhase('title-reveal'), 350);
    }, []);

    const handleCampaignSelect = useCallback((campaign: Campaign) => {
        if (selectedWorld) {
            triggerExit(selectedWorld.id, campaign.id);
        }
    }, [selectedWorld, triggerExit]);

    const handleViewAll = useCallback(() => {
        if (selectedWorld) {
            triggerExit(selectedWorld.id);
        }
    }, [selectedWorld, triggerExit]);

    // Render
    
    // Empty state
    if (worlds.length === 0) {
        return (
            <div className={`world-title-page ${isExiting ? 'world-title-page--exiting' : ''}`}>
                <div className="title-page__empty">
                    <Constellation visible={true} />
                    <p className="title-page__empty-text">Every world begins with a name.</p>
                    <button className="title-page__create-btn" onClick={onCreateWorld}>
                        Create Your World
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={`world-title-page world-title-page--${phase} ${isExiting ? 'world-title-page--exiting' : ''}`}>

            {/* World Selection Phase */}
            {phase === 'world-select' && (
                <div className="title-page__world-select">
                    <p className="title-page__question">Which world calls to you?</p>

                    <div className="title-page__world-grid">
                        {worlds.map((world, i) => (
                            <WorldCard
                                key={world.id}
                                world={world}
                                onClick={() => handleWorldSelect(world)}
                                index={i}
                            />
                        ))}
                    </div>

                    <button className="title-page__new-world" onClick={onCreateWorld}>
                        <Plus size={14} />
                        <span>Create new world</span>
                    </button>
                </div>
            )}

            {/* Title Reveal and Campaign Selection */}
            {(phase === 'title-reveal' || phase === 'campaign-select') && selectedWorld && (
                <div className="title-page__reveal">
                    {/* Upper section: constellation + title (NEVER moves) */}
                    <div className="title-page__title-section">
                        <Constellation visible={showConstellation} />

                        <h1 className={`title-page__world-name ${showTitle ? 'title-page__world-name--visible' : ''}`}>
                            {selectedWorld.name}
                        </h1>

                        {selectedWorld.tagline && (
                            <p className={`title-page__tagline ${showTitle ? 'title-page__tagline--visible' : ''}`}>
                                {selectedWorld.tagline}
                            </p>
                        )}

                        {/* Auto-enter progress (single campaign) */}
                        {phase === 'title-reveal' && selectedWorld.campaigns.length === 1 && showTitle && (
                            <div className="title-page__auto-enter">
                                <span className="title-page__auto-enter-label">
                                    {selectedWorld.campaigns[0].name}
                                </span>
                                <div className="title-page__auto-enter-bar">
                                    <div
                                        className="title-page__auto-enter-fill"
                                        onAnimationEnd={handleAutoEnter}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Lower section: campaign cards (slides up from below) */}
                    <div className={`title-page__campaign-section ${showCampaigns ? 'title-page__campaign-section--visible' : ''}`}>
                        <p className="title-page__campaign-prompt">Choose your campaign</p>

                        <div className="title-page__campaign-grid">
                            {selectedWorld.campaigns.map((campaign, i) => (
                                <CampaignCard
                                    key={campaign.id}
                                    campaign={campaign}
                                    onClick={() => handleCampaignSelect(campaign)}
                                    index={i}
                                />
                            ))}
                        </div>

                        <button className="title-page__view-all" onClick={handleViewAll}>
                            View all campaigns
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}