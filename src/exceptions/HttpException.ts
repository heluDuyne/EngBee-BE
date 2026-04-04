/**
 * Custom HTTP exception classes for services to throw
 * Similar to NestJS HttpException pattern
 * BaseController will automatically catch these and format responses
 */

/**
 * Base HTTP exception class
 * All custom exceptions should extend this
 */
export class HttpException extends Error {
  constructor(
    public message: string,
    public statusCode: number
  ) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, HttpException.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 400 Bad Request Exception
 * @example throw new BadRequestException("Invalid email format");
 */
export class BadRequestException extends HttpException {
  constructor(message: string = "Bad Request") {
    super(message, 400);
    Object.setPrototypeOf(this, BadRequestException.prototype);
  }
}

/**
 * 401 Unauthorized Exception
 * @example throw new UnauthorizedException("User not authenticated");
 */
export class UnauthorizedException extends HttpException {
  constructor(message: string = "Unauthorized") {
    super(message, 401);
    Object.setPrototypeOf(this, UnauthorizedException.prototype);
  }
}

/**
 * 403 Forbidden Exception
 * @example throw new ForbiddenException("User lacks required permissions");
 */
export class ForbiddenException extends HttpException {
  constructor(message: string = "Forbidden") {
    super(message, 403);
    Object.setPrototypeOf(this, ForbiddenException.prototype);
  }
}

/**
 * 404 Not Found Exception
 * @example throw new NotFoundException("User not found");
 */
export class NotFoundException extends HttpException {
  constructor(message: string = "Resource not found") {
    super(message, 404);
    Object.setPrototypeOf(this, NotFoundException.prototype);
  }
}

/**
 * 409 Conflict Exception
 * Used for duplicate entries, constraint violations, etc.
 * @example throw new ConflictException("Email already registered");
 */
export class ConflictException extends HttpException {
  constructor(message: string = "Conflict") {
    super(message, 409);
    Object.setPrototypeOf(this, ConflictException.prototype);
  }
}

/**
 * 422 Unprocessable Entity Exception
 * Used for semantic validation errors
 * @example throw new UnprocessableEntityException("Invalid request body");
 */
export class UnprocessableEntityException extends HttpException {
  constructor(message: string = "Unprocessable Entity") {
    super(message, 422);
    Object.setPrototypeOf(this, UnprocessableEntityException.prototype);
  }
}

/**
 * 500 Internal Server Error Exception
 * @example throw new InternalServerErrorException("Database connection failed");
 */
export class InternalServerErrorException extends HttpException {
  constructor(message: string = "Internal Server Error") {
    super(message, 500);
    Object.setPrototypeOf(this, InternalServerErrorException.prototype);
  }
}

/**
 * 503 Service Unavailable Exception
 * @example throw new ServiceUnavailableException("External service is down");
 */
export class ServiceUnavailableException extends HttpException {
  constructor(message: string = "Service Unavailable") {
    super(message, 503);
    Object.setPrototypeOf(this, ServiceUnavailableException.prototype);
  }
}

/**
 * Type guard to check if error is an HttpException
 * @example if (isHttpException(error)) { ... }
 */
export function isHttpException(error: unknown): error is HttpException {
  return error instanceof HttpException;
}
