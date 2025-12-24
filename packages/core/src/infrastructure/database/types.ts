/**
 * Raw database row for entities table.
 * All fields are primitive types as stored in SQLite.
 */
export interface EntityRow {
    id: string;
    type: string;
    name: string;
    description: string | null;     // Null for Note
    secrets: string | null;         // Null for Note
    content: string | null;         // Only for Note
    summary: string | null;        // Only for Session
    notes: string | null;           // Only for Session
    tags: string;                   // JSON array string
    world_id: string;
    campaign_id: string | null;
    forked_from: string | null;
    session_date: string | null;    // ISO string, only for Session
    created_at: string;             // ISO string
    modified_at: string;            // ISO string
    duration?: number | null;
    type_specific_fields?: string | null;
}

/**
 * Row from the FTS5 search results with ranking..
 */
export interface SearchResultRow {
    id: string;
    rank: number;                       // BM25 score (negative, closer to 0 = better)
    snippet_name: string | null;        // Highlighted snippet from name
    snippet_content: string | null;     // Highlighted snippet from content
}