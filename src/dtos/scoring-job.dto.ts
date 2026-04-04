import { ScoringJobStatus } from "../enums";

/**
 * ScoringJob DTOs
 */

/**
 * @example {
 *   "attemptId": "attempt-123"
 * }
 */
export class CreateScoringJobDTO {
  /**
   * ID of the attempt to score
   */
  attemptId!: string;
}

/**
 * @example {
 *   "status": "PROCESSING",
 *   "errorMessage": null
 * }
 */
export class UpdateScoringJobDTO {
  status?: ScoringJobStatus;
  errorMessage?: string;
  retryCount?: number;
}

/**
 * @example {
 *   "id": "job-123",
 *   "attemptId": "attempt-123",
 *   "status": "COMPLETED",
 *   "retryCount": 0,
 *   "createdAt": "2024-11-14T10:00:00Z",
 *   "startedAt": "2024-11-14T10:01:00Z",
 *   "completedAt": "2024-11-14T10:05:00Z"
 * }
 */
export class ScoringJobResponseDTO {
  id!: string;
  attemptId!: string;
  status!: ScoringJobStatus;
  errorMessage?: string;
  retryCount!: number;
  createdAt!: Date;
  startedAt?: Date;
  completedAt?: Date;
}

/**
 * @example {
 *   "id": "job-123",
 *   "attemptId": "attempt-123",
 *   "status": "COMPLETED",
 *   "createdAt": "2024-11-14T10:00:00Z"
 * }
 */
export class ScoringJobListDTO {
  id!: string;
  attemptId!: string;
  status!: ScoringJobStatus;
  createdAt!: Date;
}

/**
 * Query filter for scoring jobs
 * @example {
 *   "status": "QUEUED",
 *   "limit": 20,
 *   "offset": 0
 * }
 */
export class ScoringJobFilterDTO {
  status?: ScoringJobStatus;
  limit?: number;
  offset?: number;
}
