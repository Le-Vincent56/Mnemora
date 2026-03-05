import { Result } from '@mnemora/core/src/domain/core/Result';
import { RepositoryError } from '@mnemora/core/src/domain/core/errors';
import type { Campaign } from '@mnemora/core/src/domain/entities/Campaign';
import type { ICampaignRepository } from '@mnemora/core/src/domain/repositories/ICampaignRepository';
import type { EntityID } from '@mnemora/core/src/domain/value-objects/EntityID';

export class StaticCampaignRepository implements ICampaignRepository {
    constructor(private readonly campaignID: string) { }
    async exists(id: EntityID): Promise<Result<boolean, RepositoryError>> {
        return Result.ok(id.toString() === this.campaignID);
    }
    async findById(_id: EntityID): Promise<Result<Campaign | null, RepositoryError>> {
        return Result.fail(new RepositoryError('StaticCampaignRepository.findById not implemented'));
    }
    async findByWorld(_worldID: EntityID): Promise<Result<Campaign[], RepositoryError>> {
        return Result.fail(new RepositoryError('StaticCampaignRepository.findByWorld not implemented'));
    }
    async findAll(): Promise<Result<Campaign[], RepositoryError>> {
        return Result.fail(new RepositoryError('StaticCampaignRepository.findAll not implemented'));
    }
    async save(_campaign: Campaign): Promise<Result<void, RepositoryError>> {
        return Result.fail(new RepositoryError('StaticCampaignRepository.save not implemented'));
    }
    async delete(_id: EntityID): Promise<Result<void, RepositoryError>> {
        return Result.fail(new RepositoryError('StaticCampaignRepository.delete not implemented'));
    }
    async countByWorld(_worldID: EntityID): Promise<Result<number, RepositoryError>> {
        return Result.fail(new RepositoryError('StaticCampaignRepository.countByWorld not implemented'));
    }
    async countByContinuity(_continuityID: EntityID): Promise<Result<number, RepositoryError>> {
        return Result.fail(new RepositoryError('StaticCampaignRepository.countByContinuity not implemented'));
    }
}