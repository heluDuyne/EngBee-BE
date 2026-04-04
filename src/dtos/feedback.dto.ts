import { FeedbackType, FeedbackVisibility } from "../entities/Feedback";

/**
 * Feedback DTOs
 */

/**
 * @example {
 *   "attemptId": "attempt-123",
 *   "authorId": "teacher-1",
 *   "type": "TEACHER",
 *   "content": "Excellent pronunciation. Work on your grammar.",
 *   "visibility": "PUBLIC",
 *   "metadata": {"tone": "encouraging"}
 * }
 */
export class CreateFeedbackDTO {
  /**
   * ID of the attempt being commented on
   */
  attemptId!: string;

  /**
   * ID of the feedback author (teacher or AI)
   */
  authorId!: string;

  type!: FeedbackType;

  /**
   * Feedback content/comment
   */
  content!: string;

  visibility!: FeedbackVisibility;

  /**
   * Additional metadata for feedback
   */
  metadata?: Record<string, any>;
}

/**
 * @example {
 *   "content": "Updated feedback with more specific guidance",
 *   "visibility": "PRIVATE"
 * }
 */
export class UpdateFeedbackDTO {
  content?: string;
  visibility?: FeedbackVisibility;
  metadata?: Record<string, any>;
}

/**
 * @example {
 *   "id": "feedback-1",
 *   "attemptId": "attempt-123",
 *   "authorId": "teacher-1",
 *   "type": "TEACHER",
 *   "content": "Excellent pronunciation. Work on your grammar.",
 *   "visibility": "PUBLIC",
 *   "createdAt": "2024-11-14T11:00:00Z",
 *   "updatedAt": "2024-11-14T11:00:00Z"
 * }
 */
export class FeedbackResponseDTO {
  id!: string;
  attemptId!: string;
  authorId!: string;
  type!: FeedbackType;
  content!: string;
  visibility!: FeedbackVisibility;
  metadata?: Record<string, any>;
  createdAt!: Date;
  updatedAt!: Date;
}

/**
 * @example {
 *   "id": "feedback-1",
 *   "attemptId": "attempt-123",
 *   "type": "TEACHER",
 *   "visibility": "PUBLIC",
 *   "createdAt": "2024-11-14T11:00:00Z"
 * }
 */
export class FeedbackListDTO {
  id!: string;
  attemptId!: string;
  type!: FeedbackType;
  visibility!: FeedbackVisibility;
  createdAt!: Date;
}

/**
 * Feedback with author and attempt details
 * @example {
 *   "id": "feedback-1",
 *   "attemptId": "attempt-123",
 *   "authorId": "teacher-1",
 *   "type": "TEACHER",
 *   "content": "Excellent pronunciation. Work on your grammar.",
 *   "visibility": "PUBLIC",
 *   "authorEmail": "teacher@example.com",
 *   "authorName": "John Doe",
 *   "attemptDate": "2024-11-14T10:00:00Z",
 *   "createdAt": "2024-11-14T11:00:00Z",
 *   "updatedAt": "2024-11-14T11:00:00Z"
 * }
 */
export class FeedbackDetailDTO extends FeedbackResponseDTO {
  authorEmail?: string;
  authorName?: string;
  attemptDate?: Date;
}

/**
 * Query filter for feedback
 * @example {
 *   "type": "TEACHER",
 *   "visibility": "PUBLIC",
 *   "limit": 10,
 *   "offset": 0
 * }
 */
export class FeedbackFilterDTO {
  type?: FeedbackType;
  visibility?: FeedbackVisibility;
  limit?: number;
  offset?: number;
}
