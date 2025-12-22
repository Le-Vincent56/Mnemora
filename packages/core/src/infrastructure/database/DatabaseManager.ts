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
     * Migrate the database based on version
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
            // Run migrations in a transaction
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
            })();
        }
    }
}