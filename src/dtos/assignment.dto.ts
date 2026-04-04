import { AssignmentStatus } from "../enums";

/**
 * Create Assignment DTO
 * @example {
 *   "classId": "class-uuid-123",
 *   "promptId": "prompt-uuid-123",
 *   "title": "Week 1 Speaking Practice",
 *   "description": "Students must complete this speaking assignment",
 *   "deadline": "2024-12-20T23:59:59Z",
 *   "status": "active",
 *   "allowLateSubmission": false
 * }
 */
export class CreateAssignmentDTO {
  /**
   * Class ID
   * @minLength 1
   */
  classId!: string;

  /**
   * Prompt ID
   * @minLength 1
   */
  promptId!: string;

  /**
   * Assignment title
   * @minLength 1
   */
  title!: string;

  /**
   * Assignment description
   */
  description?: string;

  /**
   * Assignment deadline
   */
  deadline!: Date;

  /**
   * Assignment status
   */
  status?: AssignmentStatus;

  /**
   * Allow late submissions
   */
  allowLateSubmission?: boolean;

  /**
   * Late submission deadline
   */
  lateDeadline?: Date;
}

/**
 * Update Assignment DTO
 * @example {
 *   "title": "Updated Title",
 *   "deadline": "2024-12-25T23:59:59Z"
 * }
 */
export class UpdateAssignmentDTO {
  title?: string;
  description?: string;
  deadline?: Date;
  status?: AssignmentStatus;
  allowLateSubmission?: boolean;
  lateDeadline?: Date;
}

/**
 * Assignment Response DTO
 * @example {
 *   "id": "assignment-uuid-123",
 *   "classId": "class-uuid-123",
 *   "promptId": "prompt-uuid-123",
 *   "title": "Week 1 Speaking Practice",
 *   "description": "Students must complete this speaking assignment",
 *   "deadline": "2024-12-20T23:59:59Z",
 *   "status": "active",
 *   "totalEnrolled": 25,
 *   "totalSubmitted": 18,
 *   "totalScored": 15,
 *   "allowLateSubmission": false,
 *   "createdAt": "2024-12-06T10:00:00Z",
 *   "updatedAt": "2024-12-06T10:00:00Z"
 * }
 */
export class AssignmentResponseDTO {
  id!: string;
  classId!: string;
  promptId!: string;
  title!: string;
  description?: string;
  deadline!: Date;
  status!: AssignmentStatus;
  totalEnrolled!: number;
  totalSubmitted!: number;
  totalScored!: number;
  averageScore?: number;
  allowLateSubmission!: boolean;
  lateDeadline?: Date;
  createdAt!: Date;
  updatedAt!: Date;
}

/**
 * Assignment Detail DTO - Includes related class and prompt information
 * @example {
 *   "id": "assignment-uuid-123",
 *   "classId": "class-uuid-123",
 *   "promptId": "prompt-uuid-123",
 *   "title": "Week 1 Speaking Practice",
 *   "deadline": "2024-12-20T23:59:59Z",
 *   "status": "active",
 *   "totalEnrolled": 25,
 *   "totalSubmitted": 18,
 *   "totalScored": 15,
 *   "class": {
 *     "id": "class-uuid-123",
 *     "name": "IELTS Speaking Preparation"
 *   },
 *   "prompt": {
 *     "id": "prompt-uuid-123",
 *     "title": "Describe your hometown",
 *     "skillType": "speaking"
 *   },
 *   "createdAt": "2024-12-06T10:00:00Z",
 *   "updatedAt": "2024-12-06T10:00:00Z"
 * }
 */
export class AssignmentDetailDTO extends AssignmentResponseDTO {
  class?: {
    id: string;
    name: string;
  };
  attemptId?: string;
  submissionStatus?: string;
  prompt?: {
    id: string;
    title: string;
    content?: string;
    skillType: string;
  };
  score?: number;
  feedback?: string;
}

/**
 * Assignment List DTO
 * @example {
 *   "id": "assignment-uuid-123",
 *   "title": "Week 1 Speaking Practice",
 *   "deadline": "2024-12-20T23:59:59Z",
 *   "status": "active",
 *   "totalSubmitted": 18,
 *   "totalEnrolled": 25
 * }
 */
export class AssignmentListDTO {
  id!: string;
  title!: string;
  deadline!: Date;
  status!: AssignmentStatus;
  totalSubmitted!: number;
  totalScored!: number;
  totalEnrolled!: number;
  className?: string;
  submissionStatus?: string;
  score?: number;
  averageScore?: number;
  type?: string;
  attemptId?: string;
}

/**
 * Assignment Filter DTO
 * @example {
 *   "classId": "class-uuid-123",
 *   "status": "active",
 *   "limit": 10,
 *   "offset": 0
 * }
 */
export class AssignmentFilterDTO {
  classId?: string;
  status?: AssignmentStatus;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

/**
 * Assignment Student Submission DTO
 * @example {
 *   "learnerId": "learner-uuid-456",
 *   "learnerEmail": "learner@example.com",
 *   "learnerName": "John Doe",
 *   "status": "submitted",
 *   "submittedAt": "2024-12-15T10:30:00Z",
 *   "score": 7.5
 * }
 */
export class AssignmentStudentSubmissionDTO {
  learnerId!: string;
  learnerEmail!: string;
  learnerName?: string;
  status!: string;
  submittedAt?: Date;
  score?: number;
  attemptId?: string;
}
