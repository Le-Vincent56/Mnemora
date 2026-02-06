import { describe, it, expect, beforeEach, afterEach } from 'vitest';
  import { SQLiteCampaignRepository } from './SQLiteCampaignRepository';
  import { SQLiteWorldRepository } from './SQLiteWorldRepository';
  import { SQLiteContinuityRepository } from './SQLiteContinuityRepository';
  import { DatabaseManager } from '../database/DatabaseManager';
  import { Campaign } from '../../domain/entities/Campaign';
  import { World } from '../../domain/entities/World';
  import { Continuity } from '../../domain/entities/Continuity';
  import { EntityID } from '../../domain/value-objects/EntityID';

  describe('SQLiteCampaignRepository.countByContinuity', () => {
      let dbManager: DatabaseManager;
      let campaignRepository: SQLiteCampaignRepository;
      let worldRepository: SQLiteWorldRepository;
      let continuityRepository: SQLiteContinuityRepository;
      let testWorld: World;
      let testContinuity: Continuity;

      beforeEach(async () => {
          dbManager = new DatabaseManager({ filepath: ':memory:' });
          dbManager.initialize();
          const db = dbManager.getDatabase();
          campaignRepository = new SQLiteCampaignRepository(db);
          worldRepository = new SQLiteWorldRepository(db);
          continuityRepository = new SQLiteContinuityRepository(db);

          testWorld = World.create({ name: 'Test World' }).value;
          await worldRepository.save(testWorld);

          testContinuity = Continuity.create({
              name: 'Main Timeline',
              worldID: testWorld.id,
          }).value;
          await continuityRepository.save(testContinuity);
      });

      afterEach(() => {
          dbManager.close();
      });

      it('should return 0 when no campaigns reference the continuity', async () => {
          const result = await campaignRepository.countByContinuity(testContinuity.id);

          expect(result.isSuccess).toBe(true);
          expect(result.value).toBe(0);
      });

      it('should count campaigns referencing a continuity', async () => {
          const c1 = Campaign.create({
              name: 'Campaign 1',
              worldID: testWorld.id,
              continuityID: testContinuity.id,
          }).value;
          const c2 = Campaign.create({
              name: 'Campaign 2',
              worldID: testWorld.id,
              continuityID: testContinuity.id,
          }).value;

          await campaignRepository.save(c1);
          await campaignRepository.save(c2);

          const result = await campaignRepository.countByContinuity(testContinuity.id);

          expect(result.isSuccess).toBe(true);
          expect(result.value).toBe(2);
      });

      it('should not count campaigns from other continuities', async () => {
          const otherContinuity = Continuity.create({
              name: 'Alt Timeline',
              worldID: testWorld.id,
          }).value;
          await continuityRepository.save(otherContinuity);

          const c1 = Campaign.create({
              name: 'Campaign Main',
              worldID: testWorld.id,
              continuityID: testContinuity.id,
          }).value;
          const c2 = Campaign.create({
              name: 'Campaign Alt',
              worldID: testWorld.id,
              continuityID: otherContinuity.id,
          }).value;

          await campaignRepository.save(c1);
          await campaignRepository.save(c2);

          const mainCount = await campaignRepository.countByContinuity(testContinuity.id);
          expect(mainCount.value).toBe(1);

          const altCount = await campaignRepository.countByContinuity(otherContinuity.id);
          expect(altCount.value).toBe(1);
      });

      it('should return 0 for non-existent continuity ID', async () => {
          const result = await campaignRepository.countByContinuity(EntityID.generate());

          expect(result.isSuccess).toBe(true);
          expect(result.value).toBe(0);
      });
  });