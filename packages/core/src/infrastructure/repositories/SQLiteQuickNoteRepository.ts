import Database from 'better-sqlite3';
import { Result } from '../../domain/core/Result';
import { RepositoryError } from '../../domain/core/errors';
import { IQuickNoteRepository } from '../../domain/repositories/IQuickNoteRepository';
import { QuickNote, QuickNoteVisibility } from '../../domain/value-objects/QuickNote';
import { StarsAndWishes } from '../../domain/value-objects/StarsAndWishes';

/**
 * Database row type for quick_notes table.
 */
interface QuickNoteRow {
    id: string;
    session_id: string;
    content: string;
    captured_at: string;
    linked_entity_ids: string;
    visibility: string;
}

/**
 * Database row type for session_feedback table.
 */
interface SessionFeedbackRow {
    id: string;
    session_id: string;
    feedback_type: 'star' | 'wish';
    content: string;
    collected_at: string;
}

export class SQLiteQuickNoteRepository implements IQuickNoteRepository {
    constructor(private readonly db: Database.Database) { }

    // Quick Notes

    async findBySessionId(sessionId: string): Promise<Result<QuickNote[], RepositoryError>> {
        try {
            const rows = this.db.prepare(
                'SELECT * FROM quick_notes WHERE session_id = ? ORDER BY captured_at ASC'
            ).all(sessionId) as QuickNoteRow[];

            const notes = rows.map(row => this.rowToQuickNote(row));
            return Result.ok(notes);
        } catch (error) {
            return Result.fail(new RepositoryError('Failed to find quick notes', error));
        }
    }

    async saveQuickNote(sessionId: string, note: QuickNote): Promise<Result<void, RepositoryError>> {
        try {
            this.db.prepare(`
                  INSERT INTO quick_notes (id, session_id, content, captured_at, linked_entity_ids, visibility)
                  VALUES (@id, @session_id, @content, @captured_at, @linked_entity_ids, @visibility)
                  ON CONFLICT(id) DO UPDATE SET
                      content = @content,
                      linked_entity_ids = @linked_entity_ids,
                      visibility = @visibility
              `).run({
                id: note.id,
                session_id: sessionId,
                content: note.content,
                captured_at: note.capturedAt.toISOString(),
                linked_entity_ids: JSON.stringify(note.linkedEntityIds),
                visibility: note.visibility
            });

            return Result.ok(undefined);
        } catch (error) {
            return Result.fail(new RepositoryError('Failed to save quick note', error));
        }
    }

    async deleteQuickNote(noteId: string): Promise<Result<void, RepositoryError>> {
        try {
            this.db.prepare('DELETE FROM quick_notes WHERE id = ?').run(noteId);
            return Result.ok(undefined);
        } catch (error) {
            return Result.fail(new RepositoryError('Failed to delete quick note', error));
        }
    }

    async deleteAllForSession(sessionId: string): Promise<Result<void, RepositoryError>> {
        try {
            this.db.prepare('DELETE FROM quick_notes WHERE session_id = ?').run(sessionId);
            return Result.ok(undefined);
        } catch (error) {
            return Result.fail(new RepositoryError('Failed to delete quick notes', error));
        }
    }

    // Stars & Wishes (Session Feedback)

    async findFeedbackBySessionId(sessionId: string): Promise<Result<StarsAndWishes | null, RepositoryError>> {
        try {
            const rows = this.db.prepare(
                'SELECT * FROM session_feedback WHERE session_id = ? ORDER BY collected_at ASC'
            ).all(sessionId) as SessionFeedbackRow[];

            if (rows.length === 0) {
                return Result.ok(null);
            }

            const stars: string[] = [];
            const wishes: string[] = [];
            let collectedAt = new Date();

            for (const row of rows) {
                if (row.feedback_type === 'star') {
                    stars.push(row.content);
                } else {
                    wishes.push(row.content);
                }
                // Use the earliest collected_at as the collection time
                const rowDate = new Date(row.collected_at);
                if (rowDate < collectedAt) {
                    collectedAt = rowDate;
                }
            }

            return Result.ok(StarsAndWishes.fromProps({
                stars,
                wishes,
                collectedAt
            }));
        } catch (error) {
            return Result.fail(new RepositoryError('Failed to find session feedback', error));
        }
    }

    async saveFeedback(sessionId: string, feedback: StarsAndWishes): Promise<Result<void, RepositoryError>> {
        try {
            const transaction = this.db.transaction(() => {
                // Delete existing feedback
                this.db.prepare('DELETE FROM session_feedback WHERE session_id = ?').run(sessionId);

                const insertStmt = this.db.prepare(`
                      INSERT INTO session_feedback (id, session_id, feedback_type, content, collected_at)
                      VALUES (@id, @session_id, @feedback_type, @content, @collected_at)
                  `);

                const collectedAtISO = feedback.collectedAt.toISOString();

                // Insert stars
                for (const star of feedback.stars) {
                    insertStmt.run({
                        id: crypto.randomUUID(),
                        session_id: sessionId,
                        feedback_type: 'star',
                        content: star,
                        collected_at: collectedAtISO
                    });
                }

                // Insert wishes
                for (const wish of feedback.wishes) {
                    insertStmt.run({
                        id: crypto.randomUUID(),
                        session_id: sessionId,
                        feedback_type: 'wish',
                        content: wish,
                        collected_at: collectedAtISO
                    });
                }
            });

            transaction();
            return Result.ok(undefined);
        } catch (error) {
            return Result.fail(new RepositoryError('Failed to save session feedback', error));
        }
    }

    async deleteFeedbackForSession(sessionId: string): Promise<Result<void, RepositoryError>> {
        try {
            this.db.prepare('DELETE FROM session_feedback WHERE session_id = ?').run(sessionId);
            return Result.ok(undefined);
        } catch (error) {
            return Result.fail(new RepositoryError('Failed to delete session feedback', error));
        }
    }

    private rowToQuickNote(row: QuickNoteRow): QuickNote {
        return QuickNote.fromProps({
            id: row.id,
            content: row.content,
            capturedAt: new Date(row.captured_at),
            linkedEntityIds: JSON.parse(row.linked_entity_ids),
            visibility: row.visibility as QuickNoteVisibility
        });
    }
}