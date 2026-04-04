/**
 * User role enumeration
 * Defines the different roles a user can have in the system
 */
export enum UserRole {
  LEARNER = "learner",
  TEACHER = "teacher",
  ADMIN = "admin",
}

/**
 * User status enumeration
 * Defines the different statuses a user can have
 */
export enum UserStatus {
  ACTIVE = "active",
  LOCKED = "locked",
}

/**
 * UI language enumeration
 * Defines the supported languages for the user interface
 */
export enum UILanguage {
  VI = "vi",
  EN = "en",
}
