import { Request } from "express";
import { jwtAuthService } from "./services/jwt-auth.service";
import { TokenPayloadDTO } from "./dtos/auth.dto";
import {
  UnauthorizedException,
  InvalidTokenException,
  InsufficientPermissionsException,
} from "./exceptions/auth.exception";

/**
 * Extract token from Authorization header
 * Format: "Bearer <token>"
 */
function extractTokenFromHeader(request: Request): string | null {
  const authHeader = request.headers.authorization;

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
  if (securityName === "bearer" || securityName === "jwt") {
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
