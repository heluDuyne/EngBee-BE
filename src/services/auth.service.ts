import { Repository } from "typeorm";
import { AppDataSource } from "../data-source";
import { User } from "../entities/User";
import { UserRole, UserStatus } from "../enums";
import { jwtAuthService } from "./jwt-auth.service";
import {
  InvalidCredentialsException,
  UserAlreadyExistsException,
  UserNotFoundException,
  AccountLockedException,
  InvalidTokenException,
  PasswordValidationException,
} from "../exceptions/auth.exception";
import { AuthResponseDTO, AuthUserDTO, TokenPayloadDTO, RegisterDTO, LoginDTO } from "../dtos/auth.dto";

/**
 * Authentication Service
 * Handles user registration, login, token refresh, and password management
 */
export class AuthService {
  private userRepository: Repository<User>;

  constructor() {
    this.userRepository = AppDataSource.getRepository(User);
  }

  /**
   * Register new user with email and password
   */
  async register(dto: RegisterDTO): Promise<AuthResponseDTO> {
    // Check if passwords match
    if (dto.password !== dto.confirmPassword) {
      throw new PasswordValidationException("Passwords do not match");
    }

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new UserAlreadyExistsException(`User with email ${dto.email} already exists`);
    }

    // Hash password
    const hashedPassword = await jwtAuthService.hashPassword(dto.password);

    // Create new user
    const user = this.userRepository.create({
      email: dto.email,
      password: hashedPassword,
      role: dto.role || UserRole.LEARNER,
      status: UserStatus.ACTIVE,
      firstName: dto.firstName,
      lastName: dto.lastName,
    });

    const savedUser = await this.userRepository.save(user);

    // Generate tokens
    return this.generateAuthResponse(savedUser);
  }

  /**
   * Login with email and password
   */
  async login(dto: LoginDTO): Promise<AuthResponseDTO> {
    // Find user by email
    const user = await this.userRepository.findOne({
      where: { email: dto.email },
    });

    if (!user) {
      throw new InvalidCredentialsException("Invalid email or password");
    }

    // Check if account is locked
    if (user.status === UserStatus.LOCKED) {
      throw new AccountLockedException("Your account has been locked. Please contact support.");
    }

    // Verify password
    const isPasswordValid = await jwtAuthService.comparePasswords(dto.password, user.password);

    if (!isPasswordValid) {
      throw new InvalidCredentialsException("Invalid email or password");
    }

    // Generate tokens
    return this.generateAuthResponse(user);
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<AuthResponseDTO> {
    try {
      // Verify refresh token
      const decoded = jwtAuthService.verifyRefreshToken(refreshToken);

      // Find user
      const user = await this.userRepository.findOne({
        where: { id: decoded.id },
      });

      if (!user) {
        throw new UserNotFoundException("User not found");
      }

      // Check if account is locked
      if (user.status === UserStatus.LOCKED) {
        throw new AccountLockedException("Your account has been locked");
      }

      // Generate new tokens
      return this.generateAuthResponse(user);
    } catch (error) {
      throw new InvalidTokenException("Invalid refresh token");
    }
  }

  /**
   * Change user password
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    // Find user
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new UserNotFoundException("User not found");
    }

    // Verify current password
    const isPasswordValid = await jwtAuthService.comparePasswords(currentPassword, user.password);

    if (!isPasswordValid) {
      throw new InvalidCredentialsException("Current password is incorrect");
    }

    // Validate new password strength
    const passwordValidation = jwtAuthService.validatePasswordStrength(newPassword);
    if (!passwordValidation.valid) {
      throw new PasswordValidationException(`Password does not meet strength requirements: ${passwordValidation.errors.join(", ")}`);
    }

    // Hash and save new password
    user.password = await jwtAuthService.hashPassword(newPassword);
    await this.userRepository.save(user);
  }

  /**
   * Verify access token validity
   */
  async verifyAccessToken(token: string): Promise<AuthUserDTO> {
    try {
      const decoded = jwtAuthService.verifyAccessToken(token);

      // Find user to ensure they still exist
      const user = await this.userRepository.findOne({
        where: { id: decoded.id },
      });

      if (!user) {
        throw new UserNotFoundException("User not found");
      }

      return this.mapUserToAuthDTO(user);
    } catch (error) {
      throw new InvalidTokenException("Invalid or expired token");
    }
  }

  /**
   * Get user from token payload (internal use)
   */
  async getUserFromToken(tokenPayload: TokenPayloadDTO): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id: tokenPayload.id },
    });
  }

  /**
   * Logout (invalidate token on server side - optional, for token blacklist)
   */
  async logout(userId: string, token: string): Promise<void> {
    // TODO: Implement token blacklist if needed
    // Store token in cache with expiry time
    console.log(`User ${userId} logged out with token ${token.substring(0, 20)}...`);
  }

  /**
   * Generate JWT tokens and auth response
   */
  private generateAuthResponse(user: User): AuthResponseDTO {
    const tokenPayload: TokenPayloadDTO = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = jwtAuthService.generateAccessToken(tokenPayload);
    const refreshToken = jwtAuthService.generateRefreshToken(tokenPayload);
    const expiresIn = jwtAuthService.getAccessTokenExpiry();

    return {
      accessToken,
      refreshToken,
      expiresIn,
      user: this.mapUserToAuthDTO(user),
    };
  }

  /**
   * Map User entity to AuthUserDTO
   */
  private mapUserToAuthDTO(user: User): AuthUserDTO {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      name: (user.firstName && user.lastName) 
        ? `${user.firstName} ${user.lastName}` 
        : (user.firstName || user.lastName || user.email.split('@')[0]),
      avatar: user.avatar,
    };
  }
}

// Export singleton instance
export const authService = new AuthService();
