/**
   * Drift DTO for crossing layer boundaries.
   */
export interface DriftDTO {
    readonly id: string;
    readonly entityID: string;
    readonly continuityID: string;
    readonly field: string;
    readonly eventDerivedValue: string;
    readonly currentValue: string;
    readonly detectedAt: string;   // ISO date string
    readonly resolvedAt: string | null;
}

/**
 * Request to list drifts with optional filters.
 */
export interface ListDriftsRequest {
    readonly entityID?: string;
    readonly continuityID?: string;
    readonly unresolvedOnly?: boolean;
}

/**
 * Request to resolve (dismiss) a drift.
 */
export interface ResolveDriftRequest {
    readonly driftID: string;
}