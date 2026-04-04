/**
 * LearnerProfile DTOs
 */

/**
 * @example {
 *   "userId": "user-123",
 *   "firstName": "John",
 *   "lastName": "Doe",
 *   "targetBand": 7,
 *   "nativeLanguage": "Spanish",
 *   "learningGoals": "Improve speaking for immigration"
 * }
 */
export class CreateLearnerProfileDTO {
  /**
   * User ID to create profile for
   */
  userId!: string;

  firstName?: string;
  lastName?: string;

  /**
   * @min 1
   * @max 9
   */
  targetBand?: number;

  nativeLanguage?: string;
  learningGoals?: string;
}

/**
 * @example {
 *   "firstName": "John",
 *   "targetBand": 8,
 *   "currentBand": 6
 * }
 */
export class UpdateLearnerProfileDTO {
  firstName?: string;
  lastName?: string;

  /**
   * @min 1
   * @max 9
   */
  targetBand?: number;

  /**
   * @min 1
   * @max 9
   */
  currentBand?: number;

  nativeLanguage?: string;
  learningGoals?: string;
}

/**
 * @example {
 *   "id": "profile-123",
 *   "userId": "user-123",
 *   "firstName": "John",
 *   "lastName": "Doe",
 *   "targetBand": 7,
 *   "currentBand": 6,
 *   "nativeLanguage": "Spanish",
 *   "learningGoals": "Improve speaking for immigration"
 * }
 */
export class LearnerProfileResponseDTO {
  id!: string;
  userId!: string;
  firstName?: string;
  lastName?: string;
  targetBand?: number;
  currentBand?: number;
  nativeLanguage?: string;
  learningGoals?: string;
}

/**
 * Learner profile with user and statistics
 * @example {
 *   "id": "profile-123",
 *   "userId": "user-123",
 *   "firstName": "John",
 *   "lastName": "Doe",
 *   "targetBand": 7,
 *   "currentBand": 6,
 *   "nativeLanguage": "Spanish",
 *   "learningGoals": "Improve speaking for immigration",
 *   "userName": "john_doe",
 *   "userEmail": "john@example.com",
 *   "attemptCount": 25,
 *   "averageBand": 5.8
 * }
 */
export class LearnerProfileDetailDTO extends LearnerProfileResponseDTO {
  userName?: string;
  userEmail?: string;
  attemptCount?: number;
  averageBand?: number;
}
