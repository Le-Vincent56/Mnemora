import { useState, useCallback, useEffect, useRef } from 'react';
import { Entity, EntityType } from '@/data/mockData';
import { Campaign } from '@/data/mockWorldData';
import { ActiveSession, SessionAccessLog, SessionSummary } from '@/types/session';

/**
 * Recent entity for the session stack display.
 * Reuses the same structure as the old useSessionState.
 */
export interface RecentEntity {
    entity: Entity;
    viewedAt: Date;
}

/**
 * Format seconds as H:MM:SS
 */
export function formatDuration(totalSeconds: number): string {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = (n: number) => n.toString().padStart(2, '0');

    if (hours > 0) {
        return `${hours}:${pad(minutes)}:${pad(seconds)}`;
    }
    return `${minutes}:${pad(seconds)}`;
}

/**
 * Generate markdown session notes from access log.
 */
function generateSessionNotes(
    sessionName: string,
    campaignName: string,
    duration: number,
    accessLog: SessionAccessLog[]
): string {
    const durationStr = formatDuration(duration);

    // Group by entity type
    const byType: Record<EntityType, SessionAccessLog[]> = {
        character: [],
        location: [],
        faction: [],
        session: [],
        note: [],
    };

    accessLog.forEach((entry) => {
        byType[entry.entityType].push(entry);
    });

    let notes = `## Session Notes: ${sessionName}\n\n`;
    notes += `**Campaign:** ${campaignName}\n`;
    notes += `**Duration:** ${durationStr}\n\n`;

    const typeLabels: Record<EntityType, string> = {
        character: 'Characters Referenced',
        location: 'Locations Visited',
        faction: 'Factions Mentioned',
        session: 'Sessions Referenced',
        note: 'Notes Consulted',
    };

    for (const type of ['character', 'location', 'faction', 'note'] as EntityType[]) {
        const entries = byType[type];
        if (entries.length > 0) {
            notes += `### ${typeLabels[type]}\n`;
            entries
                .sort((a, b) => b.accessCount - a.accessCount)
                .forEach((entry) => {
                    notes += `- **${entry.entityName}** (${entry.accessCount}x)\n`;
                });
            notes += '\n';
        }
    }

    return notes;
}

export function useActiveSession() {
    // === State ===
    const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
    const [recentEntities, setRecentEntities] = useState<RecentEntity[]>([]);
    const [timerVisible, setTimerVisible] = useState(false);
    const [totalSeconds, setTotalSeconds] = useState(0);

    // Timer interval ref
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // === Timer Effect ===
    useEffect(() => {
        // Clear any existing interval
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }

        // Start interval if timer should be running
        if (activeSession?.isTimerRunning) {
            timerRef.current = setInterval(() => {
                setTotalSeconds((prev) => prev + 1);
            }, 1000);
        }

        // Cleanup on unmount or when dependencies change
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        };
    }, [activeSession?.isTimerRunning]);

    // === Session Lifecycle ===

    const startSession = useCallback((sessionEntity: Entity, campaign: Campaign) => {
        // Create new active session
        const newSession: ActiveSession = {
            sessionID: sessionEntity.id,
            sessionEntity,
            campaign,
            startedAt: new Date(),
            isTimerRunning: true,
            accessedEntities: [],
            pinnedEntityIDs: new Set(),
        };

        setActiveSession(newSession);
        setRecentEntities([]);
        setTotalSeconds(0);
        setTimerVisible(true);
    }, []);

    const endSession = useCallback((generateLog: boolean = true): SessionSummary | null => {
        if (!activeSession) return null;

        const endedAt = new Date();
        const summary: SessionSummary = {
            sessionID: activeSession.sessionID,
            sessionName: activeSession.sessionEntity.name,
            campaignName: activeSession.campaign.name,
            startedAt: activeSession.startedAt,
            endedAt,
            totalDuration: totalSeconds,
            entitiesAccessed: [...activeSession.accessedEntities],
            generatedNotes: generateLog
                ? generateSessionNotes(
                    activeSession.sessionEntity.name,
                    activeSession.campaign.name,
                    totalSeconds,
                    activeSession.accessedEntities
                )
                : '',
        };

        // Clear state
        setActiveSession(null);
        setRecentEntities([]);
        setTotalSeconds(0);
        setTimerVisible(false);

        return summary;
    }, [activeSession, totalSeconds]);

    const switchSession = useCallback(
        (sessionEntity: Entity, campaign: Campaign) => {
            // End current session silently (no summary modal)
            if (activeSession) {
                endSession(false);
            }
            // Start new session
            startSession(sessionEntity, campaign);
        },
        [activeSession, endSession, startSession]
    );

    // === Timer Controls ===

    const toggleTimer = useCallback(() => {
        if (!activeSession) return;

        setActiveSession((prev) => {
            if (!prev) return prev;
            return {
                ...prev,
                isTimerRunning: !prev.isTimerRunning,
            };
        });
    }, [activeSession]);

    const toggleTimerVisibility = useCallback(() => {
        setTimerVisible((prev) => !prev);
    }, []);

    const resetTimer = useCallback(() => {
        setTotalSeconds(0);
    }, []);

    // === Entity Access Tracking ===

    const recordEntityAccess = useCallback((entity: Entity) => {
        // Add to recent entities (same logic as old hook)
        setRecentEntities((prev) => {
            const filtered = prev.filter((r) => r.entity.id !== entity.id);
            return [{ entity, viewedAt: new Date() }, ...filtered].slice(0, 10);
        });

        // Update access log in active session
        setActiveSession((prev) => {
            if (!prev) return prev;

            const existingIndex = prev.accessedEntities.findIndex(
                (e) => e.entityID === entity.id
            );

            let updatedAccessLog: SessionAccessLog[];

            if (existingIndex >= 0) {
                // Update existing entry
                updatedAccessLog = [...prev.accessedEntities];
                updatedAccessLog[existingIndex] = {
                    ...updatedAccessLog[existingIndex],
                    lastAccessedAt: new Date(),
                    accessCount: updatedAccessLog[existingIndex].accessCount + 1,
                };
            } else {
                // Add new entry
                const newEntry: SessionAccessLog = {
                    entityID: entity.id,
                    entityName: entity.name,
                    entityType: entity.type,
                    firstAccessedAt: new Date(),
                    lastAccessedAt: new Date(),
                    accessCount: 1,
                };
                updatedAccessLog = [...prev.accessedEntities, newEntry];
            }

            return {
                ...prev,
                accessedEntities: updatedAccessLog,
            };
        });
    }, []);

    // === Pin Management ===

    const togglePin = useCallback((entityId: string) => {
        setActiveSession((prev) => {
            if (!prev) return prev;

            const newPinned = new Set(prev.pinnedEntityIDs);
            if (newPinned.has(entityId)) {
                newPinned.delete(entityId);
            } else {
                newPinned.add(entityId);
            }

            return {
                ...prev,
                pinnedEntityIDs: newPinned,
            };
        });
    }, []);

    const isPinned = useCallback(
        (entityId: string): boolean => {
            return activeSession?.pinnedEntityIDs.has(entityId) ?? false;
        },
        [activeSession?.pinnedEntityIDs]
    );

    // === Recent Entities ===

    const clearRecent = useCallback(() => {
        setRecentEntities([]);
    }, []);

    // === Return ===

    return {
        // State
        activeSession,
        recentEntities,
        timerVisible,
        formattedDuration: formatDuration(totalSeconds),
        totalSeconds,

        // Session lifecycle
        startSession,
        endSession,
        switchSession,

        // Timer controls
        toggleTimer,
        toggleTimerVisibility,
        resetTimer,

        // Entity tracking
        recordEntityAccess,
        togglePin,
        isPinned,
        clearRecent,
    };
}