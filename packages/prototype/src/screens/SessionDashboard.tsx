import { mockEntities, Entity } from '@/data/mockData';
import { EntityTypeIcon } from '@/components/entity/EntityTypeIcon';
import { SearchPortal } from '@/components/search/SearchPortal';
import { useSearch } from '@/hooks/useSearch';
import { formatTimeAgo } from '@/hooks/useSessionState';
import './SessionDashboard.css';

interface SessionDashboardProps {
    sessionState: {
        recentEntities: Array<{ entity: Entity; viewedAt: Date }>;
        clearRecent: () => void;
        pinnedIds: Set<string>;
        togglePin: (id: string) => void;
        timerVisible: boolean;
        toggleTimer: () => void;
    };
    onEntityClick: (entity: Entity, event?: React.MouseEvent) => void;
}

export function SessionDashboard({ sessionState, onEntityClick }: SessionDashboardProps) {
    const { query, setQuery, results, isSearching, clearSearch } = useSearch();
    const { recentEntities, clearRecent, pinnedIds, timerVisible, toggleTimer } = sessionState;

    // Get pinned entities
    const pinnedEntities = mockEntities.filter((e) => pinnedIds.has(e.id));

    // Display recent or use defaults if empty
    const displayRecent =
        recentEntities.length > 0
            ? recentEntities
            : mockEntities.slice(0, 4).map((entity) => ({
                entity,
                viewedAt: new Date(entity.modifiedAt),
            }));

    // Display pinned or use defaults if empty
    const displayPinned = pinnedEntities.length > 0 ? pinnedEntities : mockEntities.slice(0, 3);

    return (
        <div className="session-dashboard">
            {/* Search Portal — The signature interaction */}
            <SearchPortal
                query={query}
                setQuery={setQuery}
                results={results}
                isSearching={isSearching}
                clearSearch={clearSearch}
                onEntityClick={onEntityClick}
                timerVisible={timerVisible}
                onToggleTimer={toggleTimer}
            />

            {/* This Session */}
            {!isSearching && (
                <section className="session-section">
                    <div className="session-section__header">
                        <h2 className="session-section__title">This Session</h2>
                        <button className="session-section__action" onClick={clearRecent}>
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
                                <EntityTypeIcon type={entity.type} size={18} className="entity-icon" />
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
                                <EntityTypeIcon type={entity.type} size={16} className="entity-icon" />
                                <span>{entity.name}</span>
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}