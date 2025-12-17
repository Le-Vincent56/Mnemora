import { Result } from "../../domain/core/Result";
import { UseCaseError } from "./UseCaseError";

/**
 * Base interface for all use cases.
 * Use cases follow the "Interactor" pattern.
 * Each use case has a single responsibility and returns a Result.
 */
export interface IUseCase<TRequest, TResponse> {
   /**
    * Execute the user case.
    * @param request - The input data.
    * @returns A Result with response on success, UseCaseError on failure.
    */
    execute(request: TRequest): Promise<Result<TResponse, UseCaseError>>;
}