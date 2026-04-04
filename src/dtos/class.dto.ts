/**
 * Class DTOs
 */

/**
 * @example {
 *   "teacherId": "teacher-1",
 *   "name": "IELTS Speaking Preparation - Batch A",
 *   "description": "Intensive speaking practice for IELTS exam",
 *   "code": "IELTS-SPK-A"
 * }
 */
export class CreateClassDTO {
  /**
   * ID of the class teacher
   */
  teacherId!: string;

  /**
   * Class name
   */
  name!: string;

  /**
   * Class description/about
   */
  description?: string;

  /**
   * Unique enrollment code
   */
  code?: string;
}

/**
 * @example {
 *   "name": "IELTS Speaking Preparation - Batch B",
 *   "code": "IELTS-SPK-B"
 * }
 */
export class UpdateClassDTO {
  name?: string;
  description?: string;
  code?: string;
}

/**
 * @example {
 *   "id": "class-123",
 *   "teacherId": "teacher-1",
 *   "name": "IELTS Speaking Preparation - Batch A",
 *   "description": "Intensive speaking practice for IELTS exam",
 *   "code": "IELTS-SPK-A",
 *   "createdAt": "2024-11-14T10:00:00Z",
 *   "updatedAt": "2024-11-14T10:00:00Z"
 * }
 */
export class ClassResponseDTO {
  id!: string;
  teacherId!: string;
  name!: string;
  description?: string;
  code?: string;
  createdAt!: Date;
  updatedAt!: Date;
}

/**
 * @example {
 *   "id": "class-123",
 *   "name": "IELTS Speaking Preparation - Batch A",
 *   "code": "IELTS-SPK-A",
 *   "createdAt": "2024-11-14T10:00:00Z"
 * }
 */
export class ClassListDTO {
  id!: string;
  name!: string;
  code?: string;
  createdAt!: Date;
  learnerCount?: number;
}

/**
 * Class with teacher and learner details
 * @example {
 *   "id": "class-123",
 *   "teacherId": "teacher-1",
 *   "name": "IELTS Speaking Preparation - Batch A",
 *   "description": "Intensive speaking practice for IELTS exam",
 *   "code": "IELTS-SPK-A",
 *   "teacherEmail": "teacher@example.com",
 *   "teacherName": "John Doe",
 *   "learnerCount": 25,
 *   "learners": [{"id": "learner-1", "email": "learner1@example.com"}],
 *   "createdAt": "2024-11-14T10:00:00Z",
 *   "updatedAt": "2024-11-14T10:00:00Z"
 * }
 */
export class ClassDetailDTO extends ClassResponseDTO {
  /**
   * Teacher's email
   */
  teacherEmail?: string;

  /**
   * Teacher's name
   */
  teacherName?: string;

  /**
   * Number of enrolled learners
   */
  learnerCount?: number;

  /**
   * List of enrolled learners
   */
  learners?: ClassLearnerDTO[];
}

/**
 * Learner in class
 * @example {
 *   "id": "learner-1",
 *   "email": "learner1@example.com",
 *   "enrolledAt": "2024-11-14T10:05:00Z"
 * }
 */
export class ClassLearnerDTO {
  /**
   * Learner user ID
   */
  id!: string;

  /**
   * Learner email address
   */
  email!: string;

  /**
   * Enrollment timestamp
   */
  enrolledAt?: Date;
}

/**
 * @example {
 *   "learnerId": "learner-1"
 * }
 */
export class EnrollLearnerDTO {
  /**
   * ID of learner to enroll
   */
  learnerId!: string;
}

/**
 * @example {
 *   "code": "IELTS-SPK-A"
 * }
 */
export class EnrollByCodeDTO {
  /**
   * Class enrollment code
   */
  code!: string;
}

/**
 * @example {
 *   "learnerId": "learner-1"
 * }
 */
export class RemoveLearnerDTO {
  /**
   * ID of learner to remove
   */
  learnerId!: string;
}

/**
 * Query filter for classes
 * @example {
 *   "limit": 10,
 *   "offset": 0
 * }
 */
export class ClassFilterDTO {
  limit?: number;
  offset?: number;
}
