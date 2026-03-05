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
import { SQLiteStagedProposalRepository } from '../../infrastructure/repositories/SQLiteStagedProposalRepository';
import { World } from '../../domain/entities/World';
import { Continuity } from '../../domain/entities/Continuity';
import { Campaign } from '../../domain/entities/Campaign';
import { Session } from '../../domain/entities/Session';
import { CreateStagedProposalUseCase } from './CreateStagedProposalUseCase';
import { ListStagedProposalsUseCase } from './ListStagedProposalsUseCase';
import { ReviewStagedProposalUseCase } from './ReviewStagedProposalUseCase';
import { ListStagedProposalAuditEventsUseCase } from './ListStagedProposalAuditEventsUseCase';

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

describe('Staged Proposals Persistence (M4 scaffold)', () => {
    it('staged proposals persist and can be reopened (with audit trail)', async () => {
        const dbPath = join(tmpdir(), `mnemora-staged-proposals-${randomUUID()}.db`);
        try {
            // Stage
            let dbManager = new DatabaseManager({ filepath: dbPath });
            dbManager.initialize();
            const db = dbManager.getDatabase();
            const ids = await seedCampaignAndSession(db);
            const repo = new SQLiteStagedProposalRepository(db);
            const createUseCase = new CreateStagedProposalUseCase(repo);
            const listUseCase = new ListStagedProposalsUseCase(repo);
            const listEventsUseCase = new ListStagedProposalAuditEventsUseCase(repo);
            const createResult = await createUseCase.execute({
                sessionID: ids.sessionID,
                kind: 'npc',
                title: 'Captain Vale',
                content: 'Captain Vale survived the ambush and fled into the marsh.',
            });

            expect(createResult.isSuccess).toBe(true);
            const proposalID = createResult.value.proposal.id;
            
            const list1 = await listUseCase.execute({ sessionID: ids.sessionID, includeResolved: true });
            expect(list1.isSuccess).toBe(true);
            expect(list1.value.proposals).toHaveLength(1);
            expect(list1.value.proposals[0]!.id).toBe(proposalID);
            
            const ev1 = await listEventsUseCase.execute({ proposalID: proposalID });
            expect(ev1.isSuccess).toBe(true);
            expect(ev1.value.events).toHaveLength(1);
            expect(ev1.value.events[0]!.action).toBe('created');
            
            // "Crash"
            dbManager.close();
            
            // Reopen
            dbManager = new DatabaseManager({ filepath: dbPath });
            dbManager.initialize();
            
            const db2 = dbManager.getDatabase();
            const repo2 = new SQLiteStagedProposalRepository(db2);
            const listUseCase2 = new ListStagedProposalsUseCase(repo2);
            const listEventsUseCase2 = new ListStagedProposalAuditEventsUseCase(repo2);
            
            const list2 = await listUseCase2.execute({ sessionID: ids.sessionID, includeResolved: true });
            expect(list2.isSuccess).toBe(true);
            expect(list2.value.proposals).toHaveLength(1);
            expect(list2.value.proposals[0]!.id).toBe(proposalID);
            
            const ev2 = await listEventsUseCase2.execute({ proposalID });
            expect(ev2.isSuccess).toBe(true);
            expect(ev2.value.events).toHaveLength(1);
            expect(ev2.value.events[0]!.action).toBe('created');
            
            dbManager.close();
        } finally {
            cleanupDBFiles(dbPath);
        }
    });
    it('review actions append audit events: accept/edit/defer/discard/merge/reclassify', async () => {
        const dbPath = join(tmpdir(), `mnemora-staged-proposals-review-${randomUUID()}.db`);
        try {
            // Setup
            let dbManager = new DatabaseManager({ filepath: dbPath });
            dbManager.initialize();
            
            const db = dbManager.getDatabase();
            const ids = await seedCampaignAndSession(db);
            const repo = new SQLiteStagedProposalRepository(db);
            const createUseCase = new CreateStagedProposalUseCase(repo);
            const listUseCase = new ListStagedProposalsUseCase(repo);
            const reviewUseCase = new ReviewStagedProposalUseCase(repo);
            const listEventsUseCase = new ListStagedProposalAuditEventsUseCase(repo);
            
            async function stage(content: string) {
                const r = await createUseCase.execute({ sessionID: ids.sessionID, content });
                expect(r.isSuccess).toBe(true);
                return r.value.proposal.id;
            }

            const pAccept = await stage('Accept me');
            const pEditAccept = await stage('Edit then accept me');
            const pDefer = await stage('Defer me');
            const pDiscard = await stage('Discard me');
            const pMergeTarget = await stage('Target proposal');
            const pMerge = await stage('Merge me');
            const pReclassify = await stage('Reclassify me');
            
            // Actions
            const a1 = await reviewUseCase.execute({ proposalID: pAccept, action: 'accept' });
            expect(a1.isSuccess).toBe(true);
            
            const a2 = await reviewUseCase.execute({
                proposalID: pEditAccept,
                action: 'edit_then_accept',
                edits: { content: 'Edited content (final)' },
            });
            expect(a2.isSuccess).toBe(true);
            
            const a3 = await reviewUseCase.execute({ proposalID: pDefer, action: 'defer', reason: 'Needs more context' });
            expect(a3.isSuccess).toBe(true);
            
            const a4 = await reviewUseCase.execute({ proposalID: pDiscard, action: 'discard', reason: 'Not needed' });
            expect(a4.isSuccess).toBe(true);
            
            const a5 = await reviewUseCase.execute({
                proposalID: pMerge,
                action: 'merge',
                mergeTarget: { type: 'proposal', targetID: pMergeTarget },
            });
            expect(a5.isSuccess).toBe(true);
            
            const a6 = await reviewUseCase.execute({
                proposalID: pReclassify,
                action: 'reclassify',
                reclassifyToKind: 'npc',
            });
            expect(a6.isSuccess).toBe(true);
            
            // Audit invariants: each reviewed proposal has created + one review event
            for (const [id, expectedLast] of [
                [pAccept, 'accepted'],
                [pEditAccept, 'edited_then_accepted'],
                [pDefer, 'deferred'],
                [pDiscard, 'discarded'],
                [pMerge, 'merged'],
                [pReclassify, 'reclassified'],
            ] as const) {
                const ev = await listEventsUseCase.execute({ proposalID: id });
                expect(ev.isSuccess).toBe(true);
                expect(ev.value.events.length).toBe(2);
                expect(ev.value.events[0]!.action).toBe('created');
                expect(ev.value.events[1]!.action).toBe(expectedLast);
            }

            const all = await listUseCase.execute({ sessionID: ids.sessionID, includeResolved: true });
            expect(all.isSuccess).toBe(true);
            
            const byID = new Map(all.value.proposals.map((p) => [p.id, p]));
            expect(byID.get(pAccept)!.status).toBe('accepted');
            expect(byID.get(pEditAccept)!.status).toBe('accepted');
            expect(byID.get(pDefer)!.status).toBe('deferred');
            expect(byID.get(pDiscard)!.status).toBe('discarded');
            expect(byID.get(pMerge)!.status).toBe('merged');
            expect(byID.get(pMerge)!.mergedTarget).not.toBeNull();
            expect(byID.get(pReclassify)!.kind).toBe('npc');
            
            // "Crash" then verify persisted
            dbManager.close();
            dbManager = new DatabaseManager({ filepath: dbPath });
            dbManager.initialize();
            
            const db2 = dbManager.getDatabase();
            const repo2 = new SQLiteStagedProposalRepository(db2);
            const listUseCase2 = new ListStagedProposalsUseCase(repo2);
            const listEventsUseCase2 = new ListStagedProposalAuditEventsUseCase(repo2);
            const all2 = await listUseCase2.execute({ sessionID: ids.sessionID, includeResolved: true });
            
            expect(all2.isSuccess).toBe(true);
            expect(all2.value.proposals.length).toBe(all.value.proposals.length);
            
            const ev2 = await listEventsUseCase2.execute({ proposalID: pMerge });
            expect(ev2.isSuccess).toBe(true);
            expect(ev2.value.events.length).toBe(2);
            expect(ev2.value.events[1]!.action).toBe('merged');
            
            dbManager.close();
        } finally {
            cleanupDBFiles(dbPath);
        }
    });
});