import { UserRole } from "../enums";

/**
 * Auth DTOs for login, register, and token responses
 */

/**
 * @example {
 *   "email": "user@example.com",
 *   "password": "SecurePass123!",
 *   "confirmPassword": "SecurePass123!",
 *   "firstName": "John",
 *   "lastName": "Doe",
 *   "role": "learner"
 * }
 */
export class RegisterDTO {
  /**
   * @isEmail
   */
  email!: string;

  /**
   * @minLength 6
   */
  password!: string;

  /**
   * @minLength 6
   */
  confirmPassword!: string;

  firstName?: string;
  lastName?: string;
  /**
   * @isEnum
   * Valid values: "learner", "teacher", "admin"
   */
  role?: UserRole;
}

/**
 * @example {
 *   "email": "user@example.com",
 *   "password": "SecurePass123!"
 * }
 */
export class LoginDTO {
  /**
   * @isEmail
   */
  email!: string;

  /**
   * @minLength 6
   */
  password!: string;
}

/**
 * @example {
 *   "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 * }
 */
export class RefreshTokenDTO {
  refreshToken!: string;
}

/**
 * @example {
 *   "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
 *   "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
 *   "expiresIn": 900,
 *   "user": {
 *     "id": "user-123",
 *     "email": "user@example.com",
 *     "role": "learner"
 *   }
 * }
 */
export class AuthResponseDTO {
  accessToken!: string;
  refreshToken!: string;
  expiresIn!: number;
  user!: AuthUserDTO;
}

/**
 * @example {
 *   "id": "user-123",
 *   "email": "user@example.com",
 *   "role": "learner",
 *   "firstName": "John",
 *   "lastName": "Doe"
 * }
 */
export class AuthUserDTO {
  id!: string;
  email!: string;
  role!: UserRole;
  firstName?: string;
  lastName?: string;
  name?: string;
  avatar?: string;
}

/**
 * @example {
 *   "id": "user-123",
 *   "email": "user@example.com",
 *   "role": "learner",
 *   "iat": 1699958400,
 *   "exp": 1699962000
 * }
 */
export class TokenPayloadDTO {
  id!: string;
  email!: string;
  role!: UserRole;
  iat?: number;
  exp?: number;
}

/**
 * @example {
 *   "valid": true,
 *   "user": {
 *     "id": "user-123",
 *     "email": "user@example.com",
 *     "role": "learner"
 *   }
 * }
 */
export class VerifyTokenResponseDTO {
  valid!: boolean;
  user?: AuthUserDTO;
  error?: string;
}

/**
 * @example {
 *   "currentPassword": "OldPass123!",
 *   "newPassword": "NewPass123!",
 *   "confirmPassword": "NewPass123!"
 * }
 */
export class ChangePasswordDTO {
  /**
   * @minLength 6
   */
  currentPassword!: string;

  /**
   * @minLength 6
   */
  newPassword!: string;

  /**
   * @minLength 6
   */
  confirmPassword!: string;
}

/**
 * @example {
 *   "email": "user@example.com"
 * }
 */
export class PasswordResetRequestDTO {
  /**
   * @isEmail
   */
  email!: string;
}

/**
 * @example {
 *   "resetToken": "reset_token_here",
 *   "newPassword": "NewPass123!",
 *   "confirmPassword": "NewPass123!"
 * }
 */
export class PasswordResetDTO {
  resetToken!: string;

  /**
   * @minLength 6
   */
  newPassword!: string;

  /**
   * @minLength 6
   */
  confirmPassword!: string;
}
