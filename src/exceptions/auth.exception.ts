import { HttpException } from "./HttpException";

/**
 * Authentication/Authorization related exceptions
 */

/**
 * Password validation failed exception
 * @example throw new PasswordValidationException("Password must contain uppercase, lowercase, and numbers");
 */
export class PasswordValidationException extends HttpException {
  constructor(message: string = "Password does not meet strength requirements") {
    super(message, 400);
  }
}

export class UnauthorizedException extends HttpException {
  constructor(message: string = "Unauthorized") {
    super(message, 401);
  }
}

export class ForbiddenException extends HttpException {
  constructor(message: string = "Forbidden") {
    super(message, 403);
  }
}

export class InvalidCredentialsException extends HttpException {
  constructor(message: string = "Invalid email or password") {
    super(message, 401);
  }
}

export class InvalidTokenException extends HttpException {
  constructor(message: string = "Invalid or expired token") {
    super(message, 401);
  }
}

export class TokenExpiredException extends HttpException {
  constructor(message: string = "Token has expired") {
    super(message, 401);
  }
}

export class UserNotFoundException extends HttpException {
  constructor(message: string = "User not found") {
    super(message, 404);
  }
}

export class UserAlreadyExistsException extends HttpException {
  constructor(message: string = "User with this email already exists") {
    super(message, 409);
  }
}

export class AccountLockedException extends HttpException {
  constructor(message: string = "Account is locked") {
    super(message, 403);
  }
}

export class InsufficientPermissionsException extends HttpException {
  constructor(message: string = "Insufficient permissions for this action") {
    super(message, 403);
  }
}
