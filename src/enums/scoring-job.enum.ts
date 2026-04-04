/**
 * Scoring job status enumeration
 * Defines the different states a scoring job can be in
 */
export enum ScoringJobStatus {
  QUEUED = "queued",
  PROCESSING = "processing",
  COMPLETED = "completed",
  FAILED = "failed",
}
