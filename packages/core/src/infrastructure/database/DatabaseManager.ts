import { randomUUID } from 'crypto';
import Database from 'better-sqlite3';
import { Result } from '../../domain/core/Result';
import { RepositoryError } from '../../domain/core/errors';
import * as schema from './schema';

export interface DatabaseConfig {
    filepath: string;       // Path to .db file, or ':memory:' for in-memory
    readonly?: boolean;
}

export class DatabaseManager {
    private db: Database.Database | null = null;

    constructor(private readonly config: DatabaseConfig) { }

    /**
     * Opens the database and runs migrations.
     */
    initialize(): Result<void, RepositoryError> {
        try {
            this.db = new Database(this.config.filepath, {
                readonly: this.config.readonly ?? false,
            });

            // Enable foreign keys
            this.db.pragma('foreign_keys = ON');

            // WAL mode for better concurrent read performance
            this.db.pragma('journal_mode = WAL');

            // Run migrations
            this.runMigrations();

            return Result.ok(undefined);
        } catch (error) {
            return Result.fail(new RepositoryError('Failed to initialize database', error));
        }
    }

    /**
     * Returns the raw database instance.
     */
    getDatabase(): Database.Database {
        if (!this.db) {
            throw new Error('Database no initialized. Call initialize() first.');
        }
        return this.db;
    }

    /**
     * Closes the database connection.
     */
    close(): void {
        if (!this.db) {
            return;
        }

        this.db.close();
        this.db = null;
    }

    /**
     * Migrate the database based on version.
     * Versions 1-5 run in a single transaction.
     * Version 6 runs separately because it requires PRAGMA foreign_keys = OFF
     * outsides a transaction for the entities table rebuild.s
     */
    private runMigrations(): void {
        const db = this.getDatabase();

        // Create schema version table
        db.exec(schema.CREATE_SCHEMA_VERSION_TABLE);

        // Check current version
        const row = db.prepare('SELECT version FROM schema_version ORDER BY version DESC LIMIT 1')
            .get() as { version: number } | undefined;

        const currentVersion = row?.version ?? 0;

        if (currentVersion < schema.SCHEMA_VERSION) {
            // Run migrations v1-v5 in a transaction
            db.transaction(() => {
                if (currentVersion < 1) {
                    db.exec(schema.CREATE_ENTITIES_TABLE);
                    db.exec(schema.CREATE_ENTITIES_INDEXES);
                    db.exec(schema.CREATE_FTS_TABLE);
                    db.exec(schema.CREATE_FTS_TRIGGERS);
                    db.prepare('INSERT INTO schema_version (version) VALUES (?)').run(1);
                }

                if (currentVersion < 2) {
                    db.exec(schema.CREATE_WORLDS_TABLE);
                    db.exec(schema.CREATE_WORLDS_INDEXES);
                    db.exec(schema.CREATE_CAMPAIGNS_TABLE);
                    db.exec(schema.CREATE_CAMPAIGNS_INDEXES);
                    db.prepare('INSERT INTO schema_version (version) VALUES (?)').run(2);
                }

                if (currentVersion < 3) {
                    db.exec(schema.CREATE_SAFETY_TOOL_CONFIGURATIONS_TABLE);
                    db.exec(schema.CREATE_SAFETY_TOOL_CONFIGURATIONS_INDEXES);
                    db.exec(schema.CREATE_SAFETY_TOOLS_TABLE);
                    db.exec(schema.CREATE_SAFETY_TOOLS_INDEXES);
                    db.prepare('INSERT INTO schema_version (version) VALUES (?)').run(3);
                }

                if (currentVersion < 4) {
                    db.exec(schema.CREATE_QUICK_NOTES_TABLE);
                    db.exec(schema.CREATE_QUICK_NOTES_INDEXES);
                    db.exec(schema.CREATE_SESSION_FEEDBACK_TABLE);
                    db.exec(schema.CREATE_SESSION_FEEDBACK_INDEXES);
                    db.exec(schema.ALTER_ENTITIES_ADD_DURATION);
                    db.prepare('INSERT INTO schema_version (version) VALUES (?)').run(4);
                }

                if (currentVersion < 5) {
                    // Add type_specific_fields column if it doesn't exist
                    const columns = db.prepare(
                        "SELECT name FROM pragma_table_info('entities') WHERE name = 'type_specific_fields'"
                    ).get();

                    if (!columns) {
                        db.exec(schema.ALTER_ENTITIES_ADD_TYPE_SPECIFIC_FIELDS);
                    }
                    db.prepare('INSERT INTO schema_version (version) VALUES (?)').run(5);
                }
            })();

            // Re-check version after v1-v5 transaction
            const versionAfter = (db.prepare(
                'SELECT version FROM schema_version ORDER BY version DESC LIMIT 1'
            ).get() as { version: number } | undefined)?.version ?? 0;

            if (versionAfter < 6) {
                // v6 requires table rebuild -> must disable foreign keys outside a transaction
                db.pragma('foreign_keys = OFF');
                db.transaction(() => {
                    // 1. Create continuities table
                    db.exec(schema.CREATE_CONTINUITIES_TABLE);
                    db.exec(schema.CREATE_CONTINUITIES_INDEXES);

                    // 2. Add continuity_id to campaigns
                    db.exec(schema.ALTER_CAMPAIGNS_ADD_CONTINUITY_ID);

                    // 3. Create a default continuity for each world that has campaigns
                    const worlds = db.prepare(
                        'SELECT DISTINCT w.id FROM worlds w INNER JOIN campaigns c ON c.world_id = w.id'
                    ).all() as { id: string }[];

                    const insertContinuity = db.prepare(
                        'INSERT INTO continuities (id, world_id, name, description, created_at, modified_at) VALUES (?, ?, ?, ?, ?, ?)'
                    );

                    const updateCampaigns = db.prepare(
                        'UPDATE campaigns SET continuity_id = ? WHERE world_id = ?'
                    );

                    const now = new Date().toISOString();
                    for (const world of worlds) {
                        const continuityID = randomUUID();
                        insertContinuity.run(continuityID, world.id, 'Default Timeline', '', now, now);
                        updateCampaigns.run(continuityID, world.id);
                    }

                    // 4. Rebuild entities table to update CHECK constraint + add continuity_id
                    db.exec(schema.CREATE_ENTITIES_TABLE_REBUILD);
                    db.exec(`
                          INSERT INTO entities_rebuild (id, type, name, description, secrets, content, summary, notes, tags,
  world_id, campaign_id, forked_from, session_date, created_at, modified_at, duration, type_specific_fields, continuity_id)
                          SELECT id, type, name, description, secrets, content, summary, notes, tags, world_id, campaign_id,
  forked_from, session_date, created_at, modified_at, duration, type_specific_fields, NULL
                          FROM entities
                      `);
                    db.exec('DROP TABLE entities');
                    db.exec('ALTER TABLE entities_rebuild RENAME TO entities');

                    // 5. Recreate indexes and FTS triggers (dropped with old table)
                    db.exec(schema.CREATE_ENTITIES_INDEXES_V6);
                    db.exec(schema.CREATE_FTS_TRIGGERS);
                    db.exec("INSERT INTO entities_fts(entities_fts) VALUES('rebuild')");

                    db.prepare('INSERT INTO schema_version (version) VALUES (?)').run(6);
                })();

                db.pragma('foreign_keys = ON');
            }

            // Re-check version after v6
            const versionAfterV6 = (db.prepare(
                'SELECT version FROM schema_version ORDER BY version DESC LIMIT 1'
            ).get() as { version: number } | undefined)?.version ?? 0;

            if (versionAfterV6 < 7) {
                db.transaction(() => {
                    db.exec(schema.CREATE_ENTITY_DRIFTS_TABLE);
                    db.exec(schema.CREATE_ENTITY_DRIFTS_INDEXES);
                    db.prepare('INSERT INTO schema_version (version) VALUES (?)').run(7);
                })();
            }

            // Re-check version after v7
            const versionAfterV7 = (db.prepare(
                'SELECT version FROM schema_version ORDER BY version DESC LIMIT 1'
            ).get() as { version: number } | undefined)?.version ?? 0;
            
            if (versionAfterV7 < 8) {
                db.transaction(() => {
                    // Add active_session_id to campaigns if it doesn't exist
                    const activeSessionColumn = db.prepare(
                        "SELECT name FROM pragma_table_info('campaigns') WHERE name = 'active_session_id'"
                    ).get();

                    if (!activeSessionColumn) {
                        db.exec(schema.ALTER_CAMPAIGNS_ADD_ACTIVE_SESSION_ID);
                    }

                    // Add started_at and ended_at to entities if they don't exist
                    const startedAtColumn = db.prepare(
                        "SELECT name FROM pragma_table_info('entities') WHERE name = 'started_at'"
                    ).get();

                    if (!startedAtColumn) {
                        db.exec(schema.ALTER_ENTITIES_ADD_STARTED_AT);
                    }

                    const endedAtColumn = db.prepare(
                        "SELECT name FROM pragma_table_info('entities') WHERE name = 'ended_at'"
                    ).get();

                    if (!endedAtColumn) {
                        db.exec(schema.ALTER_ENTITIES_ADD_ENDED_AT);
                    }

                    db.prepare('INSERT INTO schema_version (version) VALUES (?)').run(8);
                })();
            }
        }
    }
}