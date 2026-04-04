import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Route,
  Body,
  Path,
  Query,
  Response,
  Tags,
  Request,
  Security,
} from "tsoa";
import {
  CreateUserDTO,
  UpdateUserDTO,
  UserResponseDTO,
  UserDetailResponseDTO,
  UserListDTO,
} from "../dtos/user.dto";
import { PaginatedResponseDTO } from "../dtos/pagination.dto";
import { UserService } from "../services/user.service";
import { UserRole, UserStatus } from "../enums";
import { Authenticated, AdminOnly } from "../decorators/auth.decorator";
import { AuthRequest } from "../middleware/auth.middleware";

@Route("/users")
@Tags("User")
export class UserController extends Controller {
  private userService = new UserService();

  /**
   * Create a new user
   */
  @Post()
  @Response<UserResponseDTO>(201, "User created successfully")
  async createUser(@Body() dto: CreateUserDTO): Promise<UserResponseDTO> {
    return await this.userService.createUser(dto);
  }

  /**
   * Get user by ID
   */
  @Get("{id}")
  @Response<UserDetailResponseDTO>(200, "User found")
  @Response(404, "User not found")
  async getUserById(@Path() id: string): Promise<UserDetailResponseDTO> {
    return await this.userService.getUserById(id);
  }

  /**
   * Get user by email
   */
  @Get("by-email/{email}")
  @Response<UserResponseDTO>(200, "User found")
  @Response(404, "User not found")
  async getUserByEmail(@Path() email: string): Promise<UserResponseDTO> {
    return await this.userService.getUserByEmail(email);
  }

  /**
   * Get all users with pagination
   */
  @Get()
  async getAllUsers(
    @Query() limit: number = 10,
    @Query() offset: number = 0
  ): Promise<PaginatedResponseDTO<UserListDTO>> {
    return await this.userService.getAllUsers(limit, offset);
  }

  /**
   * Get users by role
   */
  @Get("by-role/{role}")
  async getUsersByRole(
    @Path() role: UserRole,
    @Query() limit: number = 10,
    @Query() offset: number = 0
  ): Promise<PaginatedResponseDTO<UserListDTO>> {
    return await this.userService.getUsersByRole(role, limit, offset);
  }

  /**
   * Get all learners
   */
  @Get("role/learners")
  async getLearners(
    @Query() limit: number = 10,
    @Query() offset: number = 0
  ): Promise<PaginatedResponseDTO<UserListDTO>> {
    return await this.userService.getLearners(limit, offset);
  }

  /**
   * Get all teachers
   */
  @Get("role/teachers")
  async getTeachers(
    @Query() limit: number = 10,
    @Query() offset: number = 0
  ): Promise<PaginatedResponseDTO<UserListDTO>> {
    return await this.userService.getTeachers(limit, offset);
  }

  /**
   * Update user
   * Requires: Authenticated user (users can update their own profile or admin can update any)
   */
  @Put("{id}")
  @Response<UserResponseDTO>(200, "User updated successfully")
  @Response(404, "User not found")
  @Response(401, "Unauthorized - must be logged in")
  @Security("bearer")
  @Authenticated()
  async updateUser(
    @Path() id: string,
    @Body() dto: UpdateUserDTO
  ): Promise<UserResponseDTO> {
    return await this.userService.updateUser(id, dto);
  }

  /**
   * Lock user account
   * Requires: Authenticated user (Teacher or Admin)
   */
  @Put("{id}/lock")
  @Response<UserResponseDTO>(200, "User locked successfully")
  @Response(404, "User not found")
  @Response(401, "Unauthorized - must be logged in")
  @Security("bearer")
  @Authenticated()
  async lockUserAccount(@Path() id: string): Promise<UserResponseDTO> {
    return await this.userService.lockUserAccount(id);
  }

  /**
   * Unlock user account
   * Requires: Authenticated user (Teacher or Admin)
   */
  @Put("{id}/unlock")
  @Response<UserResponseDTO>(200, "User unlocked successfully")
  @Response(404, "User not found")
  @Response(401, "Unauthorized - must be logged in")
  @Security("bearer")
  @Authenticated()
  async unlockUserAccount(@Path() id: string): Promise<UserResponseDTO> {
    return await this.userService.unlockUserAccount(id);
  }

  /**
   * Search users by email or username
   */
  @Get("search/{query}")
  async searchUsers(
    @Path() query: string,
    @Query() limit: number = 10
  ): Promise<UserListDTO[]> {
    return await this.userService.searchUsers(query, limit);
  }

  /**
   * Delete user
   * Requires: Authenticated user (Teacher or Admin)
   */
  @Delete("{id}")
  @Response(204, "User deleted successfully")
  @Response(404, "User not found")
  @Response(401, "Unauthorized - must be logged in")
  @Security("bearer")
  @Authenticated()
  async deleteUser(@Path() id: string): Promise<void> {
    await this.userService.deleteUser(id);
    this.setStatus(204);
  }
}
