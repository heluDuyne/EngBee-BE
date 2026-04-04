import {
  Controller,
  Post,
  Get,
  Route,
  Body,
  Response,
  Tags,
  Request,
  Security,
} from "tsoa";
import { authService } from "../services/auth.service";
import {
  RegisterDTO,
  LoginDTO,
  RefreshTokenDTO,
  AuthResponseDTO,
  ChangePasswordDTO,
  VerifyTokenResponseDTO,
  AuthUserDTO,
} from "../dtos/auth.dto";
import { Authenticated } from "../decorators/auth.decorator";
import { AuthRequest } from "../middleware/auth.middleware";

/**
 * Authentication Controller
 */
@Route("/auth")
@Tags("Auth")
export class AuthController extends Controller {
  /**
   * Register a new user
   */
  @Post("register")
  @Response<AuthResponseDTO>(201, "User registered successfully")
  @Response(409, "User with this email already exists")
  @Response(400, "Invalid input or passwords do not match")
  async register(@Body() dto: RegisterDTO): Promise<AuthResponseDTO> {
    return await authService.register(dto);
  }

  /**
   * Login 
   */
  @Post("login")
  @Response<AuthResponseDTO>(200, "Login successful")
  @Response(401, "Invalid email or password")
  @Response(403, "Account is locked")
  async login(@Body() dto: LoginDTO): Promise<AuthResponseDTO> {
    return await authService.login(dto);
  }

  /**
   * Refresh access token 
   */
  @Post("refresh")
  @Response<AuthResponseDTO>(200, "Token refreshed successfully")
  @Response(401, "Invalid or expired refresh token")
  async refreshToken(@Body() dto: RefreshTokenDTO): Promise<AuthResponseDTO> {
    return await authService.refreshToken(dto.refreshToken);
  }

  /**
   * Verify current access token
   */
  @Get("verify")
  @Response(200, "Token is valid")
  @Response(401, "Invalid or expired token")
  @Security("bearer")
  @Authenticated()
  async verifyToken(): Promise<VerifyTokenResponseDTO> {
    return {
      valid: true,
    };
  }

  /**
   * Change user password
   */
  @Post("change-password")
  @Response(200, "Password changed successfully")
  @Response(401, "Current password is incorrect")
  @Response(400, "Invalid new password")
  @Security("bearer")
  @Authenticated()
  async changePassword(
    @Body() dto: ChangePasswordDTO,
    @Request() request: any
  ): Promise<{ message: string }> {
    const authRequest = request as AuthRequest;
    if (!authRequest.user || !authRequest.user.id) {
        throw new Error("Unauthorized: No user in request");
    }
    
    await authService.changePassword(authRequest.user.id, dto.currentPassword, dto.newPassword);
    
    return { message: "Password changed successfully" };
  }

  /**
   * Get current user profile
   */
  @Get("me")
  @Response<AuthUserDTO>(200, "User profile retrieved")
  @Response(401, "Unauthorized")
  @Security("bearer")
  @Authenticated()
  async getCurrentUser(@Request() request: any): Promise<AuthUserDTO> {
    const authRequest = request as AuthRequest;
    if (!authRequest.user) {
      throw new Error("Unauthorized: No user in request");
    }

    // Fetch full user details from database
    const user = await authService.getUserFromToken(authRequest.user);
    if (!user) {
      throw new Error("User not found");
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
    };
  }
}
