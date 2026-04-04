import { SkillType, AttemptStatus } from "../enums";

/**
 * Attempt DTOs
 */

/**
 * @example {
 *   "learnerId": "learner-1",
 *   "promptId": "prompt-123",
 *   "skillType": "SPEAKING"
 * }
 */
export class CreateAttemptDTO {
  /**
   * ID of the learner
   */
  learnerId!: string;

  /**
   * ID of the prompt to attempt
   */
  promptId!: string;

  skillType!: SkillType;

  /**
   * Optional ID of the assignment this attempt belongs to
   */
  assignmentId?: string;
}

/**
 * @example {
 *   "status": "SUBMITTED",
 *   "submittedAt": "2024-11-14T12:30:00Z"
 * }
 */
export class UpdateAttemptDTO {
  status?: AttemptStatus;
  startedAt?: Date;
  submittedAt?: Date;
}

/**
 * @example {
 *   "responseText": "This is my written response to the prompt...",
 *   "aiRuleId": "ai-rule-123"
 * }
 */
export class SubmitAttemptDTO {
  /**
   * Response text for writing attempts
   */
  responseText?: string;

  /**
   * Content/transcript to be scored (can be from text or speech-to-text)
   */
  content?: string;

  /**
   * Optional AI Rule ID to automatically score the attempt with teacher-defined rules
   */
  aiRuleId?: string;
}

/**
 * @example {
 *   "score": 7.5,
 *   "feedback": "Great job, but work on pronunciation."
 * }
 */
export class GradeAttemptDTO {
  /**
   * Overall band score (0-9)
   */
  score!: number;

  /**
   * Teacher's feedback comments
   */
  feedback!: string;

  fluency?: number;
  pronunciation?: number;
  lexical?: number;
  grammar?: number;
  coherence?: number;
  taskResponse?: number;
}

/**
 * @example {
 *   "id": "attempt-123",
 *   "learnerId": "learner-1",
 *   "promptId": "prompt-123",
 *   "skillType": "SPEAKING",
 *   "status": "SUBMITTED",
 *   "createdAt": "2024-11-14T10:00:00Z",
 *   "startedAt": "2024-11-14T10:05:00Z",
 *   "submittedAt": "2024-11-14T10:10:00Z"
 * }
 */
export class AttemptResponseDTO {
  id!: string;
  learnerId!: string;
  promptId!: string;
  skillType!: SkillType;
  status!: AttemptStatus;
  createdAt!: Date;
  startedAt?: Date;
  submittedAt?: Date;
  scoredAt?: Date;
  content?: string;
}

/**
 * @example {
 *   "id": "attempt-123",
 *   "promptId": "prompt-123",
 *   "skillType": "SPEAKING",
 *   "status": "SUBMITTED",
 *   "createdAt": "2024-11-14T10:00:00Z",
 *   "submittedAt": "2024-11-14T10:10:00Z"
 * }
 */
export class AttemptListDTO {
  id!: string;
  promptId!: string;
  skillType!: SkillType;
  status!: AttemptStatus;
  createdAt!: Date;
  submittedAt?: Date;
  deadline?: Date;
  title?: string;
  score?: AttemptScoreResponseDTO;
}

/**
 * @example {
 *   "id": "attempt-123",
 *   "studentName": "John Doe",
 *   "assignmentTitle": "Essay 1",
 *   "status": "SUBMITTED",
 *   "submittedAt": "2024-11-14T10:10:00Z"
 * }
 */
export class AttemptReviewDTO extends AttemptListDTO {
  studentName!: string;
  assignmentTitle!: string;
  studentEmail?: string;
  className?: string;
  assignmentId?: string;
  classId?: string;
}

/**
 * Attempt with associated media, scores and feedback
 * @example {
 *   "id": "attempt-123",
 *   "learnerId": "learner-1",
 *   "promptId": "prompt-123",
 *   "skillType": "SPEAKING",
 *   "status": "SCORED",
 *   "promptContent": "Describe your hometown in 2 minutes",
 *   "promptDifficulty": "INTERMEDIATE",
 *   "createdAt": "2024-11-14T10:00:00Z",
 *   "startedAt": "2024-11-14T10:05:00Z",
 *   "submittedAt": "2024-11-14T10:10:00Z",
 *   "scoredAt": "2024-11-14T11:00:00Z"
 * }
 */
export class AttemptDetailDTO extends AttemptResponseDTO {
  promptContent?: string;
  promptDifficulty?: string;
  media?: AttemptMediaResponseDTO[];
  score?: AttemptScoreResponseDTO;
  feedbacks?: AttemptFeedbackResponseDTO[];
  studentName?: string;
  studentEmail?: string;
  assignmentTitle?: string;
  assignmentDescription?: string;
  className?: string;
}

/**
 * Nested DTO for media files
 * @example {
 *   "id": "media-1",
 *   "mediaType": "AUDIO",
 *   "storageUrl": "https://storage.example.com/audio-123.mp3",
 *   "fileName": "audio-123.mp3",
 *   "duration": 120,
 *   "fileSize": 1024000,
 *   "mimeType": "audio/mpeg",
 *   "uploadedAt": "2024-11-14T10:05:00Z"
 * }
 */
export class AttemptMediaResponseDTO {
  id!: string;
  mediaType!: string;
  storageUrl!: string;
  fileName!: string;
  duration?: number;
  fileSize?: number;
  mimeType?: string;
  uploadedAt!: Date;
}

/**
 * Nested DTO for scores
 * @example {
 *   "id": "score-1",
 *   "fluency": 7,
 *   "pronunciation": 6.5,
 *   "lexical": 7.5,
 *   "grammar": 7,
 *   "overallBand": 7,
 *   "feedback": "Good fluency but needs pronunciation improvement"
 * }
 */
export class AttemptScoreResponseDTO {
  id!: string;
  fluency?: number;
  pronunciation?: number;
  lexical!: number;
  grammar!: number;
  coherence!: number;
  taskResponse?: number;
  overallBand!: number;
  feedback!: string;
  detailedFeedback?: any;
}

/**
 * Nested DTO for feedback
 * @example {
 *   "id": "feedback-1",
 *   "type": "TEACHER",
 *   "content": "Excellent pronunciation with minor grammar issues",
 *   "visibility": "PUBLIC",
 *   "authorEmail": "teacher@example.com",
 *   "createdAt": "2024-11-14T11:00:00Z"
 * }
 */
export class AttemptFeedbackResponseDTO {
  id!: string;
  type!: string;
  content!: string;
  visibility!: string;
  authorEmail?: string;
  createdAt!: Date;
}

/**
 * Query filter for attempts
 * @example {
 *   "status": "SUBMITTED",
 *   "skillType": "SPEAKING",
 *   "limit": 20,
 *   "offset": 0
 * }
 */
export class AttemptFilterDTO {
  status?: AttemptStatus;
  skillType?: SkillType;
  limit?: number;
  offset?: number;
}
