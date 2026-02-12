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
import { SQLiteSessionRunRepository } from '../../infrastructure/repositories/SQLiteSessionRunRepository';
import { World } from '../../domain/entities/World';
import { Continuity } from '../../domain/entities/Continuity';
import { Campaign } from '../../domain/entities/Campaign';
import { Session } from '../../domain/entities/Session';
import { StartSessionRunUseCase } from './StartSessionRunUseCase';
import { GetActiveSessionRunUseCase } from './GetActiveSessionRunUseCase';
import { EndSessionRunUseCase } from './EndSessionRunUseCase';
import { EntityType } from '../../domain/entities/EntityType';

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
describe('Session Run Persistence', () => {
    it('start -> "crash" -> resume detects active session', async () => {
        const dbPath = join(tmpdir(), `mnemora-session-run-${randomUUID()}.db`);

        try {
            // Start
            let dbManager = new DatabaseManager({ filepath: dbPath });
            dbManager.initialize();
            const db = dbManager.getDatabase();
            const ids = await seedCampaignAndSession(db);

            const entityRepo = new SQLiteEntityRepository(db);
            const campaignRepo = new SQLiteCampaignRepository(db);
            const runRepo = new SQLiteSessionRunRepository(db);
            const startUseCase = new StartSessionRunUseCase(entityRepo, campaignRepo, runRepo);

            const startResult = await startUseCase.execute({ sessionID: ids.sessionID });
            expect(startResult.isSuccess).toBe(true);
            expect(startResult.value.sessionID).toBe(ids.sessionID);
            
            // "Crash"
            dbManager.close();

            // Resume after restart
            dbManager = new DatabaseManager({ filepath: dbPath });
            dbManager.initialize();

            const db2 = dbManager.getDatabase();
            const campaignRepo2 = new SQLiteCampaignRepository(db2);
            const runRepo2 = new SQLiteSessionRunRepository(db2);
            const getActiveUseCase = new GetActiveSessionRunUseCase(campaignRepo2, runRepo2);
            const activeResult = await getActiveUseCase.execute({ campaignID: ids.campaignID });

            expect(activeResult.isSuccess).toBe(true);
            expect(activeResult.value).not.toBeNull();
            expect(activeResult.value!.sessionID).toBe(ids.sessionID);
            expect(activeResult.value!.startedAt).toBe(startResult.value.startedAt);

            dbManager.close();
        } finally {
            cleanupDBFiles(dbPath);
        }
    });

    it('end clears active pointer and persists ended_at + durationSeconds', async () => {
        const dbPath = join(tmpdir(), `mnemora-session-end-${randomUUID()}.db`);
        
        try {
            const dbManager = new DatabaseManager({ filepath: dbPath });
            dbManager.initialize();
            const db = dbManager.getDatabase();
            const ids = await seedCampaignAndSession(db);

            const entityRepo = new SQLiteEntityRepository(db);
            const campaignRepo = new SQLiteCampaignRepository(db);
            const runRepo = new SQLiteSessionRunRepository(db);
            const startUseCase = new StartSessionRunUseCase(entityRepo, campaignRepo, runRepo);
            const endUseCase = new EndSessionRunUseCase(entityRepo, campaignRepo, runRepo);
            const getActiveUseCase = new GetActiveSessionRunUseCase(campaignRepo, runRepo);

            await startUseCase.execute({ sessionID: ids.sessionID });
            const endResult = await endUseCase.execute({ sessionId: ids.sessionID, durationSeconds: 123 });
            expect(endResult.isSuccess).toBe(true);

            const activeAfter = await getActiveUseCase.execute({ campaignID: ids.campaignID });
            expect(activeAfter.isSuccess).toBe(true);
            expect(activeAfter.value).toBeNull();

            const reloaded = await entityRepo.findByID({ toString: () => ids.sessionID } as any);
            expect(reloaded.isSuccess).toBe(true);
            expect(reloaded.value).not.toBeNull();
            expect(reloaded.value!.type).toBe(EntityType.SESSION);

            const session = reloaded.value as Session;
            expect(session.duration).toBe(123);
            expect(session.endedAt).not.toBeNull();

            dbManager.close();
        } finally {
            cleanupDBFiles(dbPath);
        }
    });

    it('conflict when starting a second active session for same campaign', async () => {
        const dbPath = join(tmpdir(), `mnemora-session-conflict-${randomUUID()}.db`);
        try {
            const dbManager = new DatabaseManager({ filepath: dbPath });
            dbManager.initialize();
            const db = dbManager.getDatabase();

            const worldRepo = new SQLiteWorldRepository(db);
            const continuityRepo = new SQLiteContinuityRepository(db);
            const campaignRepo = new SQLiteCampaignRepository(db);
            const entityRepo = new SQLiteEntityRepository(db);
            const runRepo = new SQLiteSessionRunRepository(db);

            const world = World.create({ name: 'World' }).value;
            await worldRepo.save(world);

            const continuity = Continuity.create({ name: 'Main', worldID: world.id }).value;
            await continuityRepo.save(continuity);

            const campaign = Campaign.create({
                name: 'Campaign',
                worldID: world.id,
                continuityID: continuity.id,
            }).value;
            await campaignRepo.save(campaign);

            const s1 = Session.create({ name: 'S1', worldID: world.id, campaignID: campaign.id }).value;
            const s2 = Session.create({ name: 'S2', worldID: world.id, campaignID: campaign.id }).value;
            await entityRepo.saveMany([s1, s2]);

            const startUseCase = new StartSessionRunUseCase(entityRepo, campaignRepo, runRepo);

            const r1 = await startUseCase.execute({ sessionID: s1.id.toString() });
            expect(r1.isSuccess).toBe(true);
            
            const r2 = await startUseCase.execute({ sessionID: s2.id.toString() });
            expect(r2.isFailure).toBe(true);
            expect(r2.error.code).toBe('CONFLICT');
            
            dbManager.close();
        } finally {
            cleanupDBFiles(dbPath);
        }
    });
});