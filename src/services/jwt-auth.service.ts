import jwt, { SignOptions } from "jsonwebtoken";
import bcryptjs from "bcryptjs";
import { TokenPayloadDTO } from "../dtos/auth.dto";
import { InvalidTokenException, TokenExpiredException } from "../exceptions/auth.exception";

/**
 * JWT Authentication Service
 * Handles token generation, verification, and password hashing
 */
export class JwtAuthService {
  private accessTokenSecret: string;
  private refreshTokenSecret: string;
  private accessTokenExpiry: string;
  private refreshTokenExpiry: string;

  constructor() {
    this.accessTokenSecret = process.env.JWT_ACCESS_SECRET || "your-secret-access-key-change-in-production";
    this.refreshTokenSecret = process.env.JWT_REFRESH_SECRET || "your-secret-refresh-key-change-in-production";
    this.accessTokenExpiry = process.env.JWT_ACCESS_EXPIRY || "15m";
    this.refreshTokenExpiry = process.env.JWT_REFRESH_EXPIRY || "7d";
  }

  /**
   * Generate access token (short-lived)
   */
  generateAccessToken(payload: TokenPayloadDTO): string {
    return jwt.sign(payload, this.accessTokenSecret, {
      expiresIn: this.accessTokenExpiry,
    } as SignOptions);
  }

  /**
   * Generate refresh token (long-lived)
   */
  generateRefreshToken(payload: TokenPayloadDTO): string {
    return jwt.sign(payload, this.refreshTokenSecret, {
      expiresIn: this.refreshTokenExpiry,
    } as SignOptions);
  }

  /**
   * Verify and decode access token
   */
  verifyAccessToken(token: string): TokenPayloadDTO {
    try {
      const decoded = jwt.verify(token, this.accessTokenSecret) as TokenPayloadDTO;
      return decoded;
    } catch (error: any) {
      if (error.name === "TokenExpiredError") {
        throw new TokenExpiredException("Access token has expired");
      }
      throw new InvalidTokenException("Invalid access token");
    }
  }

  /**
   * Verify and decode refresh token
   */
  verifyRefreshToken(token: string): TokenPayloadDTO {
    try {
      const decoded = jwt.verify(token, this.refreshTokenSecret) as TokenPayloadDTO;
      return decoded;
    } catch (error: any) {
      if (error.name === "TokenExpiredError") {
        throw new TokenExpiredException("Refresh token has expired");
      }
      throw new InvalidTokenException("Invalid refresh token");
    }
  }

  /**
   * Hash password with bcryptjs
   */
  async hashPassword(password: string, saltRounds: number = 10): Promise<string> {
    return bcryptjs.hash(password, saltRounds);
  }

  /**
   * Compare plaintext password with hashed password
   */
  async comparePasswords(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcryptjs.compare(plainPassword, hashedPassword);
  }

  /**
   * Decode token without verification (use with caution)
   */
  decodeToken(token: string): TokenPayloadDTO | null {
    try {
      const decoded = jwt.decode(token) as TokenPayloadDTO | null;
      return decoded;
    } catch {
      return null;
    }
  }

  /**
   * Get expiry time of access token in milliseconds
   */
  getAccessTokenExpiry(): number {
    // Convert expiry string to milliseconds
    // "15m" = 15 * 60 * 1000 = 900000
    // "7d" = 7 * 24 * 60 * 60 * 1000 = 604800000
    const match = this.accessTokenExpiry.match(/^(\d+)([mhd])$/);
    if (!match) return 15 * 60 * 1000; // Default 15 minutes

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case "m":
        return value * 60 * 1000;
      case "h":
        return value * 60 * 60 * 1000;
      case "d":
        return value * 24 * 60 * 60 * 1000;
      default:
        return 15 * 60 * 1000;
    }
  }

  /**
   * Validate password strength
   * Requirements: min 8 chars, at least 1 uppercase, 1 lowercase, 1 number
   */
  validatePasswordStrength(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push("Password must be at least 8 characters long");
    }
    if (!/[A-Z]/.test(password)) {
      errors.push("Password must contain at least one uppercase letter");
    }
    if (!/[a-z]/.test(password)) {
      errors.push("Password must contain at least one lowercase letter");
    }
    if (!/[0-9]/.test(password)) {
      errors.push("Password must contain at least one number");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

// Export singleton instance
export const jwtAuthService = new JwtAuthService();
