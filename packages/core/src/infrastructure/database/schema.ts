export const SCHEMA_VERSION = 1;

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