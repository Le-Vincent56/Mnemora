import { getAllEntities, Entity } from '@/data/mockData';
import { EntityTypeIcon } from '@/components/entity/EntityTypeIcon';
import { SearchPortal } from '@/components/search/SearchPortal';
import { SessionHeader } from '@/components/session/SessionHeader';
import { NoSessionCTA } from '@/components/session/NoSessionCTA';
import { SafetyToolsIconRailItem } from '@/components/session/SafetyToolsIconRailItem';
import { QuickNoteIconRailItem, QuickNote } from '@/components/session/QuickNoteIconRailItem';
import { SafetyTool } from '@/components/session/SafetyToolQuickRef';
import { useSearch } from '@/hooks/useSearch';
import { formatTimeAgo } from '@/hooks/useSessionState';
import { ActiveSession } from '@/types/session';
import { RecentEntity } from '@/hooks/useActiveSession';
import './SessionDashboard.css';

interface SessionDashboardProps {
    activeSession: ActiveSession | null;
    recentEntities: RecentEntity[];
    timerVisible: boolean;
    formattedDuration: string;
    // Session tools
    safetyTools: SafetyTool[];
    quickNotes: QuickNote[];
    onSaveNote: (content: string, timestamp: Date) => void;
    // Actions
    onEntityClick: (entity: Entity, event?: React.MouseEvent) => void;
    onToggleTimerVisibility: () => void;
    onToggleTimer: () => void;
    onResetTimer: () => void;
    onClearRecent: () => void;
    onSwitchSession: (sessionEntity: Entity) => void;
    onEndSession: () => void;
    onGoToPrep: () => void;
}

export function SessionDashboard({
    activeSession,
    recentEntities,
    timerVisible,
    formattedDuration,
    safetyTools,
    quickNotes,
    onSaveNote,
    onEntityClick,
    onToggleTimerVisibility,
    onToggleTimer,
    onResetTimer,
    onClearRecent,
    onSwitchSession,
    onEndSession,
    onGoToPrep,
}: SessionDashboardProps) {
    const { query, setQuery, results, isSearching, clearSearch } = useSearch();

    // If no active session, show the CTA
    if (!activeSession) {
        return (
            <div className="session-dashboard">
                <NoSessionCTA onGoToPrep={onGoToPrep} />
            </div>
        );
    }

    // Get pinned entities from the active session
    const allEntities = getAllEntities();
    const pinnedEntities = allEntities.filter((e) =>
        activeSession.pinnedEntityIDs.has(e.id)
    );

    // Display recent or use defaults if empty
    const displayRecent =
        recentEntities.length > 0
            ? recentEntities
            : allEntities.slice(0, 4).map((entity) => ({
                entity,
                viewedAt: new Date(entity.modifiedAt),
            }));

    // Display pinned or use defaults if empty
    const displayPinned =
        pinnedEntities.length > 0 ? pinnedEntities : allEntities.slice(0, 3);

    return (
        <div className="session-dashboard">
            {/* Session Header */}
            <SessionHeader
                activeSession={activeSession}
                onSwitchSession={onSwitchSession}
                onEndSession={onEndSession}
            />

            {/* Icon Rail — Quick access to session tools */}
            <div className="session-icon-rail">
                <SafetyToolsIconRailItem
                    tools={safetyTools}
                    isSessionActive={!!activeSession}
                />
                <QuickNoteIconRailItem
                    notes={quickNotes}
                    onSaveNote={onSaveNote}
                    isSessionActive={!!activeSession}
                />
            </div>

            {/* Search Portal — The signature interaction */}
            <SearchPortal
                query={query}
                setQuery={setQuery}
                results={results}
                isSearching={isSearching}
                clearSearch={clearSearch}
                onEntityClick={onEntityClick}
                timerVisible={timerVisible}
                onToggleTimer={onToggleTimerVisibility}
                formattedDuration={formattedDuration}
                isTimerRunning={activeSession.isTimerRunning}
                onTogglePause={onToggleTimer}
                onResetTimer={onResetTimer}
            />

            {/* This Session */}
            {!isSearching && (
                <section className="session-section">
                    <div className="session-section__header">
                        <h2 className="session-section__title">This Session</h2>
                        <button className="session-section__action" onClick={onClearRecent}>
                            Clear
                        </button>
                    </div>
                    <div className="session-stack">
                        {displayRecent.map(({ entity, viewedAt }) => (
                            <div
                                key={entity.id}
                                className="session-stack-item entity-interactive"
                                data-type={entity.type}
                                onClick={(e) => onEntityClick(entity, e)}
                            >
                                <EntityTypeIcon
                                    type={entity.type}
                                    size={18}
                                    className="entity-icon"
                                />
                                <span className="session-stack-item__name">{entity.name}</span>
                                <span className="session-stack-item__time">
                                    {formatTimeAgo(viewedAt)}
                                </span>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Pinned */}
            {!isSearching && (
                <section className="session-section">
                    <div className="session-section__header">
                        <h2 className="session-section__title">Pinned for Session</h2>
                        <button className="session-section__action">Edit</button>
                    </div>
                    <div className="pinned-row">
                        {displayPinned.map((entity) => (
                            <div
                                key={entity.id}
                                className="pinned-chip entity-interactive"
                                data-type={entity.type}
                                onClick={(e) => onEntityClick(entity, e)}
                            >
                                <EntityTypeIcon
                                    type={entity.type}
                                    size={16}
                                    className="entity-icon"
                                />
                                <span>{entity.name}</span>
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}