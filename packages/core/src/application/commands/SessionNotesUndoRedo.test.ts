import { describe, it, expect } from 'vitest';
import { tmpdir } from 'os';
import { join } from 'path';
import { rmSync } from 'fs';
import { randomUUID } from 'crypto';
import { DatabaseManager } from '../../infrastructure/database/DatabaseManager';
import { SQLiteWorldRepository } from '../../infrastructure/repositories/SQLiteWorldRepository';
import { SQLiteContinuityRepository } from '../../infrastructure/repositories/SQLiteContinuityRepository';
import { SQLiteCampaignRepository } from '../../infrastructure/repositories/SQLiteCampaignRepository';
import { SQLiteEntityRepository } from '../../infrastructure/repositories/SQLiteEntityRepository';
import { SQLiteQuickNoteRepository } from '../../infrastructure/repositories/SQLiteQuickNoteRepository';
import { World } from '../../domain/entities/World';
import { Continuity } from '../../domain/entities/Continuity';
import { Campaign } from '../../domain/entities/Campaign';
import { Session } from '../../domain/entities/Session';
import { CommandHistory } from './CommandHistory';
import { AddQuickNoteCommand } from './AddQuickNoteCommand';
import { UpdateQuickNoteCommand } from './UpdateQuickNoteCommand';
import { RemoveQuickNoteCommand } from './RemoveQuickNoteCommand';
import { SetSessionFeedbackCommand } from './SetSessionFeedbackCommand';

function cleanupDBFiles(dbPath: string): void {
    rmSync(dbPath, { force: true });
    rmSync(`${dbPath}-wal`, { force: true });
    rmSync(`${dbPath}-shm`, { force: true });
}

async function seedCampaignAndSession(db: any): Promise<{
    worldID: string;
    campaignID: string;
    sessionID: string;
}> {
    const worldRepo = new SQLiteWorldRepository(db);
    const continuityRepo = new SQLiteContinuityRepository(db);
    const campaignRepo = new SQLiteCampaignRepository(db);
    const entityRepo = new SQLiteEntityRepository(db);

    const world = World.create({ name: 'Test World' }).value;
    await worldRepo.save(world);

    const continuity = Continuity.create({ name: 'Main', worldID: world.id }).value;
    await continuityRepo.save(continuity);

    const campaign = Campaign.create({
        name: 'Test Campaign',
        worldID: world.id,
        continuityID: continuity.id,
    }).value;
    await campaignRepo.save(campaign);

    const session = Session.create({
        name: 'Session 1',
        worldID: world.id,
        campaignID: campaign.id,
    }).value;
    await entityRepo.save(session);

    return {
        worldID: world.id.toString(),
        campaignID: campaign.id.toString(),
        sessionID: session.id.toString(),
    };
}

describe('Session Notes Commands (Undo/Redo + Write-through)', () => {
    it('add/edit/delete note then undo/redo', async () => {
        const dbPath = join(tmpdir(), `mnemora-session-notes-${randomUUID()}.db`);

        try {
            const dbManager = new DatabaseManager({ filepath: dbPath });
            dbManager.initialize();
            const db = dbManager.getDatabase();
            const ids = await seedCampaignAndSession(db);

            const entityRepo = new SQLiteEntityRepository(db);
            const quickNoteRepo = new SQLiteQuickNoteRepository(db);
            const history = new CommandHistory();

            // Add
            const add = new AddQuickNoteCommand(
                ids.sessionID,
                'Player asked about the prophecy',
                [],
                'gm_only',
                entityRepo,
                quickNoteRepo,
            );
            const addResult = await history.execute(add);
            expect(addResult.isSuccess).toBe(true);

            const noteId = add.getNoteID();
            expect(noteId).not.toBeNull();

            let notes = await quickNoteRepo.findBySessionID(ids.sessionID);
            expect(notes.isSuccess).toBe(true);
            expect(notes.value).toHaveLength(1);
            expect(notes.value[0]?.content).toBe('Player asked about the prophecy');
            expect(notes.value[0]?.id).toBe(noteId);

            // Edit
            const edit = new UpdateQuickNoteCommand(
                ids.sessionID,
                noteId!,
                'Player asked about the prophecy (prep)',
                quickNoteRepo,
            );
            const editResult = await history.execute(edit);
            expect(editResult.isSuccess).toBe(true);

            notes = await quickNoteRepo.findBySessionID(ids.sessionID);
            expect(notes.value).toHaveLength(1);
            expect(notes.value[0]?.id).toBe(noteId);
            expect(notes.value[0]?.content).toBe('Player asked about the prophecy (prep)');

            // Delete
            const del = new RemoveQuickNoteCommand(ids.sessionID, noteId!, quickNoteRepo);
            const delResult = await history.execute(del);
            expect(delResult.isSuccess).toBe(true);

            notes = await quickNoteRepo.findBySessionID(ids.sessionID);
            expect(notes.value).toHaveLength(0);

            // Undo delete
            const u1 = await history.undo();
            expect(u1.isSuccess).toBe(true);
            notes = await quickNoteRepo.findBySessionID(ids.sessionID);
            expect(notes.value).toHaveLength(1);
            expect(notes.value[0]?.content).toBe('Player asked about the prophecy (prep)');

            // Undo edit
            const u2 = await history.undo();
            expect(u2.isSuccess).toBe(true);
            notes = await quickNoteRepo.findBySessionID(ids.sessionID);
            expect(notes.value).toHaveLength(1);
            expect(notes.value[0]?.content).toBe('Player asked about the prophecy');

            // Undo add
            const u3 = await history.undo();
            expect(u3.isSuccess).toBe(true);
            notes = await quickNoteRepo.findBySessionID(ids.sessionID);
            expect(notes.value).toHaveLength(0);

            // Redo add
            const r1 = await history.redo();
            expect(r1.isSuccess).toBe(true);
            notes = await quickNoteRepo.findBySessionID(ids.sessionID);
            expect(notes.value).toHaveLength(1);
            expect(notes.value[0]?.id).toBe(noteId);
            expect(notes.value[0]?.content).toBe('Player asked about the prophecy');

            // Redo edit
            const r2 = await history.redo();
            expect(r2.isSuccess).toBe(true);
            notes = await quickNoteRepo.findBySessionID(ids.sessionID);
            expect(notes.value[0]?.content).toBe('Player asked about the prophecy (prep)');

            // Redo delete
            const r3 = await history.redo();
            expect(r3.isSuccess).toBe(true);
            notes = await quickNoteRepo.findBySessionID(ids.sessionID);
            expect(notes.value).toHaveLength(0);

            dbManager.close();
        } finally {
            cleanupDBFiles(dbPath);
        }
    });

    it('reflection edits (Stars & Wishes) are undoable', async () => {
        const dbPath = join(tmpdir(), `mnemora-session-feedback-${randomUUID()}.db`);

        try {
            const dbManager = new DatabaseManager({ filepath: dbPath });
            dbManager.initialize();
            const db = dbManager.getDatabase();
            const ids = await seedCampaignAndSession(db);

            const quickNoteRepo = new SQLiteQuickNoteRepository(db);
            const history = new CommandHistory();
            const collectedAt = new Date('2026-03-04T00:00:00Z');

            const set1 = new SetSessionFeedbackCommand(
                ids.sessionID,
                ['Great pacing'],
                ['More NPC downtime'],
                collectedAt,
                quickNoteRepo,
            );
            const r1 = await history.execute(set1);
            expect(r1.isSuccess).toBe(true);

            const f1 = await quickNoteRepo.findFeedbackBySessionID(ids.sessionID);
            expect(f1.isSuccess).toBe(true);
            expect(f1.value).not.toBeNull();
            expect(f1.value!.stars).toEqual(['Great pacing']);
            expect(f1.value!.wishes).toEqual(['More NPC downtime']);

            const set2 = new SetSessionFeedbackCommand(
                ids.sessionID,
                ['Great pacing', 'Fun combat'],
                ['More NPC downtime'],
                collectedAt,
                quickNoteRepo,
            );
            const r2 = await history.execute(set2);
            expect(r2.isSuccess).toBe(true);

            const f2 = await quickNoteRepo.findFeedbackBySessionID(ids.sessionID);
            expect(f2.value!.stars).toEqual(['Great pacing', 'Fun combat']);

            // Undo set2 -> back to set1
            const u1 = await history.undo();
            expect(u1.isSuccess).toBe(true);
            const fu1 = await quickNoteRepo.findFeedbackBySessionID(ids.sessionID);
            expect(fu1.value!.stars).toEqual(['Great pacing']);

            // Undo set1 -> cleared
            const u2 = await history.undo();
            expect(u2.isSuccess).toBe(true);
            const fu2 = await quickNoteRepo.findFeedbackBySessionID(ids.sessionID);
            expect(fu2.value).toBeNull();

            // Redo set1 -> restored
            const rr1 = await history.redo();
            expect(rr1.isSuccess).toBe(true);
            const fr1 = await quickNoteRepo.findFeedbackBySessionID(ids.sessionID);
            expect(fr1.value!.stars).toEqual(['Great pacing']);

            // Redo set2 -> restored
            const rr2 = await history.redo();
            expect(rr2.isSuccess).toBe(true);
            const fr2 = await quickNoteRepo.findFeedbackBySessionID(ids.sessionID);
            expect(fr2.value!.stars).toEqual(['Great pacing', 'Fun combat']);

            dbManager.close();
        } finally {
            cleanupDBFiles(dbPath);
        }
    });

    it('crash/reopen does not lose captured notes or reflection (write-through)', async () => {
        const dbPath = join(tmpdir(), `mnemora-session-notes-crash-${randomUUID()}.db`);

        try {
            // Start + capture
            let dbManager = new DatabaseManager({ filepath: dbPath });
            dbManager.initialize();
            const db = dbManager.getDatabase();
            const ids = await seedCampaignAndSession(db);

            const entityRepo = new SQLiteEntityRepository(db);
            const quickNoteRepo = new SQLiteQuickNoteRepository(db);
            const history = new CommandHistory();

            const add = new AddQuickNoteCommand(
                ids.sessionID,
                'Aldric discovered the secret passage',
                ['ent-1'],
                'gm_only',
                entityRepo,
                quickNoteRepo,
            );
            const addResult = await history.execute(add);
            expect(addResult.isSuccess).toBe(true);

            const collectedAt = new Date('2026-03-04T00:00:00Z');
            const set = new SetSessionFeedbackCommand(
                ids.sessionID,
                ['Puzzle was engaging'],
                [],
                collectedAt,
                quickNoteRepo,
            );
            const setResult = await history.execute(set);
            expect(setResult.isSuccess).toBe(true);

            // "Crash"
            dbManager.close();

            // Reopen + verify persisted
            dbManager = new DatabaseManager({ filepath: dbPath });
            dbManager.initialize();
            const db2 = dbManager.getDatabase();

            const quickNoteRepo2 = new SQLiteQuickNoteRepository(db2);
            const notes2 = await quickNoteRepo2.findBySessionID(ids.sessionID);
            expect(notes2.isSuccess).toBe(true);
            expect(notes2.value).toHaveLength(1);
            expect(notes2.value[0]?.content).toBe('Aldric discovered the secret passage');
            expect(notes2.value[0]?.linkedEntityIDs).toEqual(['ent-1']);

            const feedback2 = await quickNoteRepo2.findFeedbackBySessionID(ids.sessionID);
            expect(feedback2.isSuccess).toBe(true);
            expect(feedback2.value).not.toBeNull();
            expect(feedback2.value!.stars).toEqual(['Puzzle was engaging']);

            dbManager.close();
        } finally {
            cleanupDBFiles(dbPath);
        }
    });
});
