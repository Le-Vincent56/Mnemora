import { Result } from '@mnemora/core/src/domain/core/Result';
import { RepositoryError } from '@mnemora/core/src/domain/core/errors';
import { Session } from '@mnemora/core/src/domain/entities/Session';
import type { BaseEntity } from '@mnemora/core/src/domain/entities/BaseEntity';
import type { EntityType } from '@mnemora/core/src/domain/entities/EntityType';
import type {
    EntityFilter,
    IEntityRepository,
    PaginatedResult,
    PaginationOptions,
} from '@mnemora/core/src/domain/repositories/IEntityRepository';
import { EntityID } from '@mnemora/core/src/domain/value-objects/EntityID';
import { Name } from '@mnemora/core/src/domain/value-objects/Name';
import { RichText } from '@mnemora/core/src/domain/value-objects/RichText';
import { TagCollection } from '@mnemora/core/src/domain/value-objects/TagCollection';
import { Timestamps } from '@mnemora/core/src/domain/value-objects/Timestamps';
import { getAllSessions } from '@/data/mockSessions';
import type { SelectedSession } from '../types';
import { SESSION_RUN_STORAGE_KEY } from '../constants';
import { readSessionRunState } from './SessionRunLocalStorage';

interface SessionSelectionEntityRepositoryOptions {
    readonly worldID: string;
    readonly campaignID: string;
    readonly getSelectedSession: () => SelectedSession | null;
    readonly storageKey?: string;
}

function parseISODate(value: string | null): Date | null {
    if (!value) return null;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
}

export class SessionSelectionEntityRepository implements IEntityRepository {
    private readonly storageKey: string;
    
    constructor(private readonly options: SessionSelectionEntityRepositoryOptions) {
        this.storageKey = options.storageKey ?? SESSION_RUN_STORAGE_KEY;
    }
    
    async findByID(id: EntityID): Promise<Result<BaseEntity | null, RepositoryError>> {
        try {
            const idStr = id.toString();
            const selected = this.options.getSelectedSession();
            const stateResult = readSessionRunState(this.storageKey);
            
            // Exit case - reading the session run state failed
            if (stateResult.isFailure) {
                return Result.fail(stateResult.error);
            }

            const state = stateResult.value;
            const stored = state.sessions[idStr];
            const mock = getAllSessions().find((s) => s.id === idStr);
            const sessionName =
                (selected && selected.sessionID === idStr ? selected.sessionName : null) ??
                stored?.name ??
                mock?.title ??
                null;

            // Exit case - no session name
            if (!sessionName) {
                return Result.ok(null);
            }

            const nameResult = Name.create(sessionName);
            
            // Exit case - naming failed
            if (nameResult.isFailure) {
                return Result.fail(new RepositoryError('Invalid session name', nameResult.error));
            }

            const startedAt = parseISODate(stored?.startedAt ?? null);
            const endedAt = parseISODate(stored?.endedAt ?? null);
            const duration = stored?.durationSeconds ?? null;
            const sessionDate = mock ? new Date(mock.date) : null;
            const sessionDateValue = sessionDate && !Number.isNaN(sessionDate.getTime()) 
                ? sessionDate 
                : null;
            
            const session = Session.fromProps({
                id: EntityID.fromStringOrThrow(idStr),
                name: nameResult.value,
                summary: RichText.empty(),
                notes: RichText.empty(),
                secrets: RichText.empty(),
                tags: TagCollection.empty(),
                worldID: EntityID.fromStringOrThrow(this.options.worldID),
                campaignID: EntityID.fromStringOrThrow(this.options.campaignID),
                sessionDate: sessionDateValue,
                timestamps: Timestamps.now(),
                quickNotes: [],
                starsAndWishes: null,
                duration,
                startedAt,
                endedAt,
            });

            return Result.ok(session);
        } catch (error) {
            return Result.fail(new RepositoryError('Failed to find entity', error));
        }
    }

    async findByWorld(_worldID: EntityID, _options?: PaginationOptions): Promise<Result<PaginatedResult<BaseEntity>, RepositoryError>> {
        return Result.fail(new RepositoryError('SessionSelectionEntityRepository.findByWorld not implemented'));
    }

    async findByCampaign(_campaignID: EntityID, _options?: PaginationOptions): Promise<Result<PaginatedResult<BaseEntity>, RepositoryError>> {
        return Result.fail(new RepositoryError('SessionSelectionEntityRepository.findByCampaign not implemented'));
    }

    async findByFilter(_filter: EntityFilter, _options?: PaginationOptions): Promise<Result<PaginatedResult<BaseEntity>, RepositoryError>> {
        return Result.fail(new RepositoryError('SessionSelectionEntityRepository.findByFilter not implemented'));
    }

    async findByType(_worldID: EntityID, _type: EntityType, _options?: PaginationOptions): Promise<Result<PaginatedResult<BaseEntity>, RepositoryError>> {
        return Result.fail(new RepositoryError('SessionSelectionEntityRepository.findByType not implemented'));
    }

    async save(_entity: BaseEntity): Promise<Result<void, RepositoryError>> {
        return Result.fail(new RepositoryError('SessionSelectionEntityRepository.save not implemented'));
    }

    async saveMany(_entities: BaseEntity[]): Promise<Result<void, RepositoryError>> {
        return Result.fail(new RepositoryError('SessionSelectionEntityRepository.saveMany not implemented'));
    }

    async delete(_id: EntityID): Promise<Result<void, RepositoryError>> {
        return Result.fail(new RepositoryError('SessionSelectionEntityRepository.delete not implemented'));
    }

    async deleteMany(_ids: EntityID[]): Promise<Result<void, RepositoryError>> {
        return Result.fail(new RepositoryError('SessionSelectionEntityRepository.deleteMany not implemented'));
    }

    async exists(id: EntityID): Promise<Result<boolean, RepositoryError>> {
        const result = await this.findByID(id);
        
        // Exit case - the result is a failure
        if (result.isFailure) {
            return Result.fail(result.error);
        }

        return Result.ok(result.value !== null);
    }

    async count(_filter: EntityFilter): Promise<Result<number, RepositoryError>> {
        return Result.fail(new RepositoryError('SessionSelectionEntityRepository.count not implemented'));
    }
}