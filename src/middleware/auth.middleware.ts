import { Request, Response, NextFunction } from "express";
import { jwtAuthService } from "../services/jwt-auth.service";
import { TokenPayloadDTO } from "../dtos/auth.dto";
import {
  UnauthorizedException,
  InvalidTokenException,
  InsufficientPermissionsException,
} from "../exceptions/auth.exception";

/**
 * Extended Express Request with authenticated user
 */
export interface AuthRequest extends Request {
  user?: TokenPayloadDTO;
  token?: string;
}

/**
 * TSOA authentication function
 * This function is called by TSOA when @Security decorator is used
 *
 * @param request - Express request object
 * @param securityName - Name of the security scheme (e.g., 'jwt')
 * @param scopes - Optional scopes/roles required
 * @returns Promise resolving to user payload
 */
export async function expressAuthentication(
  request: Request,
  securityName: string,
  scopes?: string[]
): Promise<TokenPayloadDTO> {
  if (securityName === "jwt") {
    const token = extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException("No token provided");
    }

    try {
      const decoded = jwtAuthService.verifyAccessToken(token);

      // Check scopes/roles if specified
      if (scopes && scopes.length > 0) {
        if (!scopes.includes(decoded.role)) {
          throw new InsufficientPermissionsException(
            `Insufficient permissions. Required roles: ${scopes.join(", ")}`
          );
        }
      }

      return decoded;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new InvalidTokenException("Invalid or expired token");
    }
  }

  throw new UnauthorizedException(
    `Unknown authentication scheme: ${securityName}`
  );
}

/**
 * Extract token from Authorization header
 * Format: "Bearer <token>"
 */
export function extractTokenFromHeader(req: Request): string | null {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(" ");

  if (parts.length !== 2 || parts[0] !== "Bearer") {
    throw new UnauthorizedException(
      "Invalid authorization header format. Expected: Bearer <token>"
    );
  }

  return parts[1];
}

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 *
 * Usage in Express:
 *   app.use(authMiddleware);
 *   app.get("/protected", authMiddleware, (req, res) => { ... })
 */
export function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    const token = extractTokenFromHeader(req);

    if (!token) {
      throw new UnauthorizedException(
        "No token provided. Please include Authorization header with Bearer token"
      );
    }

    const decoded = jwtAuthService.verifyAccessToken(token);
    req.user = decoded;
    req.token = token;

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Optional authentication middleware
 * Doesn't throw error if token is missing, but verifies if present
 *
 * Usage:
 *   app.use(optionalAuthMiddleware);
 *   app.get("/public-with-optional-auth", (req, res) => {
 *     if (req.user) { ... }
 *   })
 */
export function optionalAuthMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    const token = extractTokenFromHeader(req);

    if (token) {
      const decoded = jwtAuthService.verifyAccessToken(token);
      req.user = decoded;
      req.token = token;
    }

    next();
  } catch (error) {
    // Log but don't fail on optional auth
    console.warn(
      "Optional auth verification failed:",
      (error as Error).message
    );
    next();
  }
}

/**
 * Role-based access control middleware factory
 * Returns middleware that checks if user has required role(s)
 *
 * Usage:
 *   app.post("/admin-only", authMiddleware, requireRole("admin"), (req, res) => { ... })
 *   app.post("/teacher-or-admin", authMiddleware, requireRole(["teacher", "admin"]), (req, res) => { ... })
 */
export function requireRole(allowedRoles: string | string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new UnauthorizedException(
          "Authentication required for this resource"
        );
      }

      const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

      if (!roles.includes(req.user.role)) {
        throw new InsufficientPermissionsException(
          `This resource requires one of these roles: ${roles.join(", ")}`
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * User ID match middleware
 * Ensures user can only access their own resources (or is admin/teacher)
 *
 * Usage:
 *   app.get("/learner/:id", authMiddleware, requireOwnResourceOrAdmin, (req, res) => { ... })
 */
export function requireOwnResourceOrAdmin(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    if (!req.user) {
      throw new UnauthorizedException("Authentication required");
    }

    const requestedUserId =
      req.params.id || req.params.userId || req.params.learnerId;

    // Allow if user is accessing their own resource or is admin/teacher
    if (
      req.user.id !== requestedUserId &&
      req.user.role !== "admin" &&
      req.user.role !== "teacher"
    ) {
      throw new UnauthorizedException("You can only access your own resources");
    }

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Token expiry check middleware
 * Warns when token is about to expire (within 1 minute)
 */
export function tokenExpiryWarningMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    const token = extractTokenFromHeader(req);

    if (token) {
      const decoded = jwtAuthService.decodeToken(token);

      if (decoded && decoded.exp) {
        const expiresIn = (decoded.exp * 1000 - Date.now()) / 1000; // in seconds

        if (expiresIn > 0 && expiresIn < 60) {
          res.setHeader("X-Token-Expires-Soon", "true");
          res.setHeader("X-Token-Expires-In", Math.ceil(expiresIn).toString());
        }
      }
    }

    next();
  } catch {
    // Non-blocking, continue regardless
    next();
  }
}
