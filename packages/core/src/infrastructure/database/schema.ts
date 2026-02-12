export const SCHEMA_VERSION = 8;

export const CREATE_ENTITIES_TABLE = `
    CREATE TABLE IF NOT EXISTS entities (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL CHECK(type IN ('character', 'location', 'faction', 'session', 'note')),
        name TEXT NOT NULL,
        description TEXT,
        secrets TEXT,
        content TEXT,
        summary TEXT,
        notes TEXT,
        tags TEXT NOT NULL DEFAULT '[]',
        world_id TEXT NOT NULL,
        campaign_id TEXT,
        forked_from TEXT,
        session_date TEXT,
        created_at TEXT NOT NULL,
        modified_at TEXT NOT NULL,

        FOREIGN KEY (forked_from) REFERENCES entities(id) ON DELETE SET NULL
    );
`;

export const CREATE_ENTITIES_INDEXES = `
    CREATE INDEX IF NOT EXISTS idx_entities_world ON entities(world_id);
    CREATE INDEX IF NOT EXISTS idx_entities_campaign ON entities(campaign_id);
    CREATE INDEX IF NOT EXISTS idx_entities_type ON entities(type);
    CREATE INDEX IF NOT EXISTS idx_entities_forked_from ON entities(forked_from);
    CREATE INDEX IF NOT EXISTS idx_entities_modified ON entities(modified_at DESC);
`;

export const CREATE_FTS_TABLE = `
    CREATE VIRTUAL TABLE IF NOT EXISTS entities_fts USING fts5(
        name,
        description,
        secrets,
        content,
        summary,
        notes,
        tags,
        content='entities',
        content_rowid='rowid'
    );
`;

// Triggers to keep FTS in sync with main table
export const CREATE_FTS_TRIGGERS = `
    CREATE TRIGGER IF NOT EXISTS entities_ai AFTER INSERT ON entities BEGIN
        INSERT INTO entities_fts(rowid, name, description, secrets, content, summary, notes, tags)
        VALUES (NEW.rowid, NEW.name, NEW.description, NEW.secrets, NEW.content, NEW.summary, NEW.notes, NEW.tags);
    END;

    CREATE TRIGGER IF NOT EXISTS entities_ad AFTER DELETE ON entities BEGIN
        INSERT INTO entities_fts(entities_fts, rowid, name, description, secrets, content, summary, notes, tags)
        VALUES ('delete', OLD.rowid, OLD.name, OLD.description, OLD.secrets, OLD.content, OLD.summary, OLD.notes, OLD.tags);
    END;

    CREATE TRIGGER IF NOT EXISTS entities_au AFTER UPDATE ON entities BEGIN
        INSERT INTO entities_fts(entities_fts, rowid, name, description, secrets, content, summary, notes, tags)
        VALUES ('delete', OLD.rowid, OLD.name, OLD.description, OLD.secrets, OLD.content, OLD.summary, OLD.notes, OLD.tags);
        INSERT INTO entities_fts(rowid, name, description, secrets, content, summary, notes, tags)
        VALUES (NEW.rowid, NEW.name, NEW.description, NEW.secrets, NEW.content, NEW.summary, NEW.notes, NEW.tags);
    END;
`;

export const CREATE_SCHEMA_VERSION_TABLE = `
    CREATE TABLE IF NOT EXISTS schema_version (
        version INTEGER PRIMARY KEY
    );
`;

// ============================================================================
// Schema Version 2: World and Campaign tables
// ============================================================================

export const CREATE_WORLDS_TABLE = `
    CREATE TABLE IF NOT EXISTS worlds (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        tagline TEXT,
        created_at TEXT NOT NULL,
        modified_at TEXT NOT NULL
    );
`;

export const CREATE_WORLDS_INDEXES = `
    CREATE INDEX IF NOT EXISTS idx_worlds_modified ON worlds(modified_at DESC);
`;

export const CREATE_CAMPAIGNS_TABLE = `
    CREATE TABLE IF NOT EXISTS campaigns (
        id TEXT PRIMARY KEY,
        world_id TEXT NOT NULL REFERENCES worlds(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT,
        created_at TEXT NOT NULL,
        modified_at TEXT NOT NULL
    );
`;

export const CREATE_CAMPAIGNS_INDEXES = `
    CREATE INDEX IF NOT EXISTS idx_campaigns_world ON campaigns(world_id);
    CREATE INDEX IF NOT EXISTS idx_campaigns_modified ON campaigns(modified_at DESC);
`;

// ============================================================================
// Schema Version 3: Safety Tool tables
// ============================================================================

export const CREATE_SAFETY_TOOL_CONFIGURATIONS_TABLE = `
    CREATE TABLE IF NOT EXISTS safety_tool_configurations (
        id TEXT PRIMARY KEY,
        campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
        created_at TEXT NOT NULL,
        modified_at TEXT NOT NULL,
        UNIQUE(campaign_id)
    );
`;

export const CREATE_SAFETY_TOOL_CONFIGURATIONS_INDEXES = `
    CREATE INDEX IF NOT EXISTS idx_safety_tool_configs_campaign
        ON safety_tool_configurations(campaign_id);
`;

export const CREATE_SAFETY_TOOLS_TABLE = `
    CREATE TABLE IF NOT EXISTS safety_tools (
        id TEXT PRIMARY KEY,
        configuration_id TEXT NOT NULL REFERENCES safety_tool_configurations(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        is_enabled INTEGER NOT NULL DEFAULT 0,
        is_built_in INTEGER NOT NULL DEFAULT 1,
        custom_id TEXT,
        display_order INTEGER NOT NULL DEFAULT 0,
        config_json TEXT NOT NULL DEFAULT '{}',
        created_at TEXT NOT NULL,
        modified_at TEXT NOT NULL
    );
`;

export const CREATE_SAFETY_TOOLS_INDEXES = `
    CREATE INDEX IF NOT EXISTS idx_safety_tools_config
        ON safety_tools(configuration_id);
    CREATE INDEX IF NOT EXISTS idx_safety_tools_type
        ON safety_tools(type);
`;

// ============================================================================
// Schema Version 4: Quick Notes and Session Feedback tables
// ============================================================================

export const CREATE_QUICK_NOTES_TABLE = `
    CREATE TABLE IF NOT EXISTS quick_notes (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        content TEXT NOT NULL,
        captured_at TEXT NOT NULL,
        linked_entity_ids TEXT NOT NULL DEFAULT '[]',
        visibility TEXT NOT NULL DEFAULT 'gm_only' CHECK(visibility IN ('gm_only', 'players')),
        FOREIGN KEY (session_id) REFERENCES entities(id) ON DELETE CASCADE
    );
`;

export const CREATE_QUICK_NOTES_INDEXES = `
    CREATE INDEX IF NOT EXISTS idx_quick_notes_session ON quick_notes(session_id);
    CREATE INDEX IF NOT EXISTS idx_quick_notes_captured ON quick_notes(captured_at);
`;

export const CREATE_SESSION_FEEDBACK_TABLE = `
    CREATE TABLE IF NOT EXISTS session_feedback (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        feedback_type TEXT NOT NULL CHECK(feedback_type IN ('star', 'wish')),
        content TEXT NOT NULL,
        collected_at TEXT NOT NULL,
        FOREIGN KEY (session_id) REFERENCES entities(id) ON DELETE CASCADE
    );
`;

export const CREATE_SESSION_FEEDBACK_INDEXES = `
    CREATE INDEX IF NOT EXISTS idx_session_feedback_session ON session_feedback(session_id);
`;

export const ALTER_ENTITIES_ADD_DURATION = `
    ALTER TABLE entities ADD COLUMN duration INTEGER;
`;

// ============================================================================
// Schema Version 5: Type-specific fields
// ============================================================================

export const ALTER_ENTITIES_ADD_TYPE_SPECIFIC_FIELDS = `
    ALTER TABLE entities ADD COLUMN type_specific_fields TEXT DEFAULT '{}';
`;

// ============================================================================
// Schema Version 6: Continuities + Event entity type + continuity_id columns
// ============================================================================

export const CREATE_CONTINUITIES_TABLE = `
    CREATE TABLE IF NOT EXISTS continuities (
        id TEXT PRIMARY KEY,
        world_id TEXT NOT NULL REFERENCES worlds(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT,
        branched_from_id TEXT REFERENCES continuities(id) ON DELETE SET NULL,
        branch_point_event_id TEXT,
        created_at TEXT NOT NULL,
        modified_at TEXT NOT NULL
    );
`;

export const CREATE_CONTINUITIES_INDEXES = `
    CREATE INDEX IF NOT EXISTS idx_continuities_world ON continuities(world_id);
    CREATE INDEX IF NOT EXISTS idx_continuities_modified ON continuities(modified_at DESC);
`;

export const ALTER_CAMPAIGNS_ADD_CONTINUITY_ID = `
    ALTER TABLE campaigns ADD COLUMN continuity_id TEXT REFERENCES continuities(id);
`;

/**
 * Rebuilt entities table with 'event' in CHECK constraint and continuity_id column.
 * Used during v6 migration to replace the original entities table.
 * The FK on forked_from references 'entities' (the final name after rename).
 */
export const CREATE_ENTITIES_TABLE_REBUILD = `
    CREATE TABLE entities_rebuild (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL CHECK(type IN ('character','location','faction','session','note','event')),
        name TEXT NOT NULL,
        description TEXT,
        secrets TEXT,
        content TEXT,
        summary TEXT,
        notes TEXT,
        tags TEXT NOT NULL DEFAULT '[]',
        world_id TEXT NOT NULL,
        campaign_id TEXT,
        forked_from TEXT,
        session_date TEXT,
        created_at TEXT NOT NULL,
        modified_at TEXT NOT NULL,
        duration INTEGER,
        type_specific_fields TEXT DEFAULT '{}',
        continuity_id TEXT,
        FOREIGN KEY (forked_from) REFERENCES entities(id) ON DELETE SET NULL
    );
`;

export const CREATE_ENTITIES_INDEXES_V6 = `
    CREATE INDEX IF NOT EXISTS idx_entities_world ON entities(world_id);
    CREATE INDEX IF NOT EXISTS idx_entities_campaign ON entities(campaign_id);
    CREATE INDEX IF NOT EXISTS idx_entities_type ON entities(type);
    CREATE INDEX IF NOT EXISTS idx_entities_forked_from ON entities(forked_from);
    CREATE INDEX IF NOT EXISTS idx_entities_modified ON entities(modified_at DESC);
    CREATE INDEX IF NOT EXISTS idx_entities_continuity ON entities(continuity_id);
`;

// ============================================================================
// Schema Version 7: Entity Drifts table (drift detection)
// ============================================================================
  
export const CREATE_ENTITY_DRIFTS_TABLE = `
    CREATE TABLE IF NOT EXISTS entity_drifts (
        id TEXT PRIMARY KEY,
        entity_id TEXT NOT NULL,
        continuity_id TEXT NOT NULL,
        field TEXT NOT NULL,
        event_derived_value TEXT NOT NULL,
        current_value TEXT NOT NULL,
        detected_at TEXT NOT NULL,
        resolved_at TEXT,
        FOREIGN KEY (entity_id) REFERENCES entities(id) ON DELETE CASCADE,
        FOREIGN KEY (continuity_id) REFERENCES continuities(id) ON DELETE CASCADE,
        UNIQUE(entity_id, continuity_id, field)
    );
`;

export const CREATE_ENTITY_DRIFTS_INDEXES = `
    CREATE INDEX IF NOT EXISTS idx_entity_drifts_entity ON entity_drifts(entity_id);
    CREATE INDEX IF NOT EXISTS idx_entity_drifts_continuity ON entity_drifts(continuity_id);
    CREATE INDEX IF NOT EXISTS idx_entity_drifts_unresolved ON entity_drifts(resolved_at) WHERE resolved_at IS NULL;
`;

// ============================================================================
// Schema Version 8: Session run persistence (active session + run timestamps)
// ============================================================================
export const ALTER_CAMPAIGNS_ADD_ACTIVE_SESSION_ID = `
    ALTER TABLE campaigns ADD COLUMN active_session_id TEXT;
`;
export const ALTER_ENTITIES_ADD_STARTED_AT = `
    ALTER TABLE entities ADD COLUMN started_at TEXT;
`;
export const ALTER_ENTITIES_ADD_ENDED_AT = `
    ALTER TABLE entities ADD COLUMN ended_at TEXT;
`;