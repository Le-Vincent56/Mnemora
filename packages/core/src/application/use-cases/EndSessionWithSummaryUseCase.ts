import { Result } from '../../domain/core/Result';
import { Session } from '../../domain/entities/Session';
import { StarsAndWishes } from '../../domain/value-objects/StarsAndWishes';
import { EntityType } from '../../domain/entities/EntityType';
import type { IEntityRepository } from '../../domain/repositories/IEntityRepository';
import type { IQuickNoteRepository } from '../../domain/repositories/IQuickNoteRepository';
import type { IUseCase } from './IUseCase';
import { UseCaseError } from './UseCaseError';
import type { EndSessionRequest, SessionSummaryDTO, QuickNoteDTO, StarsAndWishesDTO } from '../dtos/SessionNotesDTOs';
import { EntityID } from '../../domain/value-objects/EntityID';
import type { ISessionRunRepository } from '../../domain/repositories/ISessionRunRepository';

export class EndSessionWithSummaryUseCase implements IUseCase<EndSessionRequest, SessionSummaryDTO> {
    constructor(
        private readonly entityRepository: IEntityRepository,
        private readonly quickNoteRepository: IQuickNoteRepository,
        private readonly sessionRunRepository : ISessionRunRepository
    ) { }

    async execute(request: EndSessionRequest): Promise<Result<SessionSummaryDTO, UseCaseError>> {
        // 1. Validate request
        if (!request.sessionId?.trim()) {
            return Result.fail(UseCaseError.validation('Session ID is required', 'sessionId'));
        }

        if (request.durationSeconds < 0) {
            return Result.fail(UseCaseError.validation('Duration cannot be negative', 'durationSeconds'));
        }

        // 2. Find the session
        const sessionId = EntityID.fromString(request.sessionId);
        if (sessionId.isFailure) {
            return Result.fail(UseCaseError.validation('Invalid session ID format', 'sessionId'));
        }

        const sessionResult = await this.entityRepository.findByID(sessionId.value);
        if (sessionResult.isFailure) {
            return Result.fail(UseCaseError.repositoryError('Failed to find session', sessionResult.error));
        }

        const entity = sessionResult.value;
        if (!entity) {
            return Result.fail(UseCaseError.notFound('Session', request.sessionId));
        }

        if (entity.type !== EntityType.SESSION) {
            return Result.fail(UseCaseError.validation('Entity is not a session', 'sessionId'));
        }

        // Cast is safe after type check above
        const session = entity as Session;

        // 3. Build Stars & Wishes if provided
        let starsAndWishes: StarsAndWishes | null = null;
        if (request.starsAndWishes) {
            let feedback = StarsAndWishes.empty();

            // Add stars
            for (const star of request.starsAndWishes.stars) {
                const addResult = feedback.addStar(star);
                if (addResult.isFailure) {
                    return Result.fail(UseCaseError.validation(addResult.error.message, 'stars'));
                }
                feedback = addResult.value;
            }

            // Add wishes
            for (const wish of request.starsAndWishes.wishes) {
                const addResult = feedback.addWish(wish);
                if (addResult.isFailure) {
                    return Result.fail(UseCaseError.validation(addResult.error.message, 'wishes'));
                }
                feedback = addResult.value;
            }

            // Save feedback to repository
            const saveFeedbackResult = await this.quickNoteRepository.saveFeedback(
                request.sessionId,
                feedback
            );
            if (saveFeedbackResult.isFailure) {
                return Result.fail(UseCaseError.repositoryError('Failed to save feedback', saveFeedbackResult.error));
            }

            starsAndWishes = feedback;
        }

        // 4. Get all quick notes for the session
        const notesResult = await this.quickNoteRepository.findBySessionId(request.sessionId);
        if (notesResult.isFailure) {
            return Result.fail(UseCaseError.repositoryError('Failed to get quick notes', notesResult.error));
        }

        const notes = notesResult.value;

        // 5. End the sesion run (persist ended_at + durationSeconds, clear active pointer)
        const endResult = await this.sessionRunRepository.endSessionRun(
            session.campaignID,
            session.id,
            new Date(),
            request.durationSeconds
        );

        if(endResult.isFailure) {
            return Result.fail(UseCaseError.repositoryError('Failed to end session', endResult.error));
        }

        const endOutcome = endResult.value;
        if(endOutcome.kind === 'conflict') {
            return Result.fail(UseCaseError.conflict(
                `Cannot end session: campaign has a different active session (${endOutcome.activeSessionID.toString()})`
            ));
        }

        // 6. Count unique referenced entities from quick notes
        const referencedEntityIds = new Set<string>();
        for (const note of notes) {
            for (const entityId of note.linkedEntityIds) {
                referencedEntityIds.add(entityId);
            }
        }

        // 7. Format duration
        const durationFormatted = this.formatDuration(request.durationSeconds);

        // 8. Build and return summary DTO
        const quickNoteDTOs: QuickNoteDTO[] = notes.map(note => ({
            id: note.id,
            content: note.content,
            capturedAt: note.capturedAt.toISOString(),
            linkedEntityIds: [...note.linkedEntityIds],
            visibility: note.visibility
        }));

        const starsAndWishesDTO: StarsAndWishesDTO | null = starsAndWishes
            ? {
                stars: [...starsAndWishes.stars],
                wishes: [...starsAndWishes.wishes],
                collectedAt: starsAndWishes.collectedAt.toISOString()
            }
            : null;

        const summary: SessionSummaryDTO = {
            sessionId: request.sessionId,
            sessionName: session.name.toString(),
            durationSeconds: request.durationSeconds,
            durationFormatted,
            quickNotes: quickNoteDTOs,
            starsAndWishes: starsAndWishesDTO,
            referencedEntityCount: referencedEntityIds.size
        };

        return Result.ok(summary);
    }

    /**
     * Formats duration in seconds to human-readable string.
     * Examples: "45m", "1h 23m", "2h 0m"
     */
    private formatDuration(seconds: number): string {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);

        if (hours === 0) {
            return `${minutes}m`;
        }

        return `${hours}h ${minutes}m`;
    }
}