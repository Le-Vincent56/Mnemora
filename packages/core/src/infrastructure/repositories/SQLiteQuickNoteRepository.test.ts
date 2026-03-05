import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { SQLiteQuickNoteRepository } from './SQLiteQuickNoteRepository';
import { QuickNote } from '../../domain/value-objects/QuickNote';
import { StarsAndWishes } from '../../domain/value-objects/StarsAndWishes';
import * as schema from '../database/schema';

describe('SQLiteQuickNoteRepository', () => {
    let db: Database.Database;
    let repository: SQLiteQuickNoteRepository;
    const testSessionID = 'test-session-123';

    beforeEach(() => {
        // Create in-memory database
        db = new Database(':memory:');
        db.pragma('foreign_keys = OFF'); // Disable for testing without entities table

        // Create tables
        db.exec(schema.CREATE_QUICK_NOTES_TABLE);
        db.exec(schema.CREATE_QUICK_NOTES_INDEXES);
        db.exec(schema.CREATE_SESSION_FEEDBACK_TABLE);
        db.exec(schema.CREATE_SESSION_FEEDBACK_INDEXES);

        repository = new SQLiteQuickNoteRepository(db);
    });

    afterEach(() => {
        db.close();
    });

    describe('Quick Notes', () => {
        describe('saveQuickNote / findBySessionId', () => {
            it('should save and retrieve a quick note', async () => {
                const note = QuickNote.create('Test note content').value;

                await repository.saveQuickNote(testSessionID, note);
                const result = await repository.findBySessionID(testSessionID);

                expect(result.isSuccess).toBe(true);
                expect(result.value).toHaveLength(1);
                expect(result.value[0].id).toBe(note.id);
                expect(result.value[0].content).toBe('Test note content');
            });

            it('should save note with linked entities', async () => {
                const note = QuickNote.create('Note with links', ['entity1', 'entity2']).value;

                await repository.saveQuickNote(testSessionID, note);
                const result = await repository.findBySessionID(testSessionID);

                expect(result.value[0].linkedEntityIDs).toEqual(['entity1', 'entity2']);
            });

            it('should return notes ordered by capturedAt', async () => {
                const note1 = QuickNote.fromProps({
                    id: 'note-1',
                    content: 'First',
                    capturedAt: new Date('2024-01-01T10:00:00Z'),
                    linkedEntityIDs: [],
                    visibility: 'gm_only'
                });
                const note2 = QuickNote.fromProps({
                    id: 'note-2',
                    content: 'Second',
                    capturedAt: new Date('2024-01-01T11:00:00Z'),
                    linkedEntityIDs: [],
                    visibility: 'gm_only'
                });

                await repository.saveQuickNote(testSessionID, note2);
                await repository.saveQuickNote(testSessionID, note1);

                const result = await repository.findBySessionID(testSessionID);

                expect(result.value[0].content).toBe('First');
                expect(result.value[1].content).toBe('Second');
            });
        });

        describe('deleteQuickNote', () => {
            it('should delete a specific note', async () => {
                const note = QuickNote.create('To be deleted').value;
                await repository.saveQuickNote(testSessionID, note);

                await repository.deleteQuickNote(note.id);

                const result = await repository.findBySessionID(testSessionID);
                expect(result.value).toHaveLength(0);
            });

            it('should succeed even if note does not exist', async () => {
                const result = await repository.deleteQuickNote('nonexistent');
                expect(result.isSuccess).toBe(true);
            });
        });

        describe('deleteAllForSession', () => {
            it('should delete all notes for a session', async () => {
                const note1 = QuickNote.create('Note 1').value;
                const note2 = QuickNote.create('Note 2').value;

                await repository.saveQuickNote(testSessionID, note1);
                await repository.saveQuickNote(testSessionID, note2);

                await repository.deleteAllForSession(testSessionID);

                const result = await repository.findBySessionID(testSessionID);
                expect(result.value).toHaveLength(0);
            });
        });
    });

    describe('Stars & Wishes', () => {
        describe('saveFeedback / findFeedbackBySessionId', () => {
            it('should save and retrieve feedback', async () => {
                let feedback = StarsAndWishes.empty();
                feedback = feedback.addStar('Great combat').value;
                feedback = feedback.addWish('More NPC interaction').value;

                await repository.saveFeedback(testSessionID, feedback);
                const result = await repository.findFeedbackBySessionID(testSessionID);

                expect(result.isSuccess).toBe(true);
                expect(result.value).not.toBeNull();
                expect(result.value!.stars).toEqual(['Great combat']);
                expect(result.value!.wishes).toEqual(['More NPC interaction']);
            });

            it('should return null when no feedback exists', async () => {
                const result = await repository.findFeedbackBySessionID('no-feedback-session');

                expect(result.isSuccess).toBe(true);
                expect(result.value).toBeNull();
            });

            it('should replace existing feedback on save', async () => {
                let feedback1 = StarsAndWishes.empty().addStar('Old star').value;
                let feedback2 = StarsAndWishes.empty().addStar('New star').value;

                await repository.saveFeedback(testSessionID, feedback1);
                await repository.saveFeedback(testSessionID, feedback2);

                const result = await repository.findFeedbackBySessionID(testSessionID);
                expect(result.value!.stars).toEqual(['New star']);
            });
        });

        describe('deleteFeedbackForSession', () => {
            it('should delete all feedback for a session', async () => {
                const feedback = StarsAndWishes.empty().addStar('Star').value;
                await repository.saveFeedback(testSessionID, feedback);

                await repository.deleteFeedbackForSession(testSessionID);

                const result = await repository.findFeedbackBySessionID(testSessionID);
                expect(result.value).toBeNull();
            });
        });
    });
});