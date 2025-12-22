import { Entity, EntityType } from '@/data/mockData';
import { Campaign } from '@/data/mockWorldData';

/**
 * Log entry tracking when an entity was accessed during a session.
 */
export interface SessionAccessLog {
    entityID: string;
    entityName: string;
    entityType: EntityType;
    firstAccessedAt: Date;
    lastAccessedAt: Date;
    accessCount: number;
}

/**
 * Runtime state for an active session.
 * NOT the session entity itself - this is the context wrapper that tracks
 * timer, accessed entities, and session-scoped pins.
 */
export interface ActiveSession {
    sessionID: string;
    sessionEntity: Entity;                  // The session entity (for display)
    campaign: Campaign;                     // Campaign this session belongs to
    startedAt: Date;                        // When the session was activated (for timer)
    isTimerRunning: boolean;                // Whether the session timer is running
    accessedEntities: SessionAccessLog[];   // Entities accessed during this session
    pinnedEntityIDs: Set<string>;           // Session-scoped pinned entity IDs
}

/**
 * Generated when a session ends.
 * Contains summary data and auto-generated notes in markdown format.
 */
export interface SessionSummary {
    sessionID: string;
    sessionName: string;
    campaignName: string;
    startedAt: Date;
    endedAt: Date;
    totalDuration: number;                  // In seconds
    entitiesAccessed: SessionAccessLog[];
    generatedNotes: string;                 // Auto-generated markdown notes from the session
}