import { UserRole, UserStatus, UILanguage } from "../enums";

/**
 * User DTOs for API requests and responses
 */

// Input DTOs
/**
 * @example {
 *   "email": "learner@example.com",
 *   "password": "securePassword123",
 *   "role": "LEARNER",
 *   "uiLanguage": "EN"
 * }
 */
export class CreateUserDTO {
  /**
   * @isEmail
   */
  email!: string;

  /**
   * @minLength 6
   */
  password!: string;

  role?: UserRole;
  uiLanguage?: UILanguage;
  firstName?: string;
  lastName?: string;
  phone?: string;
  location?: string;
  bio?: string;
  avatar?: string;
}

/**
 * @example {
 *   "email": "newemail@example.com",
 *   "role": "TEACHER"
 * }
 */
export class UpdateUserDTO {
  email?: string;
  password?: string;
  role?: UserRole;
  status?: UserStatus;
  uiLanguage?: UILanguage;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  bio?: string;
  phone?: string;
  location?: string;
}


/**
 * @example {
 *   "token": "reset_token_here",
 *   "newPassword": "newSecurePassword123"
 * }
 */
export class ResetPasswordDTO {
  token!: string;

  /**
   * @minLength 6
   */
  newPassword!: string;
}

// Output DTOs
/**
 * @example {
 *   "id": "user-123",
 *   "email": "learner@example.com",
 *   "role": "LEARNER",
 *   "status": "ACTIVE",
 *   "uiLanguage": "EN",
 *   "createdAt": "2024-11-14T10:00:00Z",
 *   "updatedAt": "2024-11-14T10:00:00Z"
 * }
 */
export class UserResponseDTO {
  id!: string;
  email!: string;
  role!: UserRole;
  status!: UserStatus;
  uiLanguage!: UILanguage;
  createdAt!: Date;
  updatedAt!: Date;
  firstName?: string;
  lastName?: string;
  name?: string;
  avatar?: string;
  bio?: string;
  phone?: string;
  location?: string;
}

/**
 * Extended user response with related data
 * @example {
 *   "id": "user-123",
 *   "email": "teacher@example.com",
 *   "role": "TEACHER",
 *   "status": "ACTIVE",
 *   "uiLanguage": "EN",
 *   "createdAt": "2024-11-14T10:00:00Z",
 *   "updatedAt": "2024-11-14T10:00:00Z",
 *   "learnerProfile": null,
 *   "taughtClasses": [],
 *   "enrolledClasses": []
 * }
 */
export class UserDetailResponseDTO extends UserResponseDTO {
  learnerProfile?: LearnerProfileResponseDTO;
  taughtClasses?: ClassResponseDTO[];
  enrolledClasses?: ClassResponseDTO[];
}

/**
 * @example {
 *   "id": "user-123",
 *   "email": "learner@example.com",
 *   "role": "LEARNER",
 *   "status": "ACTIVE",
 *   "createdAt": "2024-11-14T10:00:00Z"
 * }
 */
export class UserListDTO {
  id!: string;
  email!: string;
  role!: UserRole;
  status!: UserStatus;
  createdAt!: Date;
  firstName?: string;
  lastName?: string;
  name?: string;
  avatar?: string;
  enrolledClass?: string;
  lastActiveAt?: Date;
}

// Nested DTOs
import { LearnerProfileResponseDTO } from "./learner-profile.dto";
import { ClassResponseDTO } from "./class.dto";
