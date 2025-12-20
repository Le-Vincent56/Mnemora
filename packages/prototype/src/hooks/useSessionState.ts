import { useState, useCallback } from 'react';
import { Entity } from '@/data/mockData';

interface RecentEntity {
    entity: Entity;
    viewedAt: Date;
}

export function useSessionState() {
    const [recentEntities, setRecentEntities] = useState<RecentEntity[]>([]);
    const [pinnedIds, setPinnedIds] = useState<Set<string>>(new Set());
    const [timerVisible, setTimerVisible] = useState(false);

    const addToRecent = useCallback((entity: Entity) => {
        setRecentEntities((prev) => {
            // Remove if already exists
            const filtered = prev.filter((r) => r.entity.id !== entity.id);
            // Add to front
            return [{ entity, viewedAt: new Date() }, ...filtered].slice(0, 10);
        });
    }, []);

    const clearRecent = useCallback(() => {
        setRecentEntities([]);
    }, []);

    const togglePin = useCallback((entityId: string) => {
        setPinnedIds((prev) => {
            const next = new Set(prev);
            if (next.has(entityId)) {
                next.delete(entityId);
            } else {
                next.add(entityId);
            }
            return next;
        });
    }, []);

    const isPinned = useCallback((entityId: string) => {
        return pinnedIds.has(entityId);
    }, [pinnedIds]);

    const toggleTimer = useCallback(() => {
        setTimerVisible((prev) => !prev);
    }, []);

    return {
        recentEntities,
        addToRecent,
        clearRecent,
        pinnedIds,
        togglePin,
        isPinned,
        timerVisible,
        toggleTimer,
    };
}

export function formatTimeAgo(date: Date): string {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}