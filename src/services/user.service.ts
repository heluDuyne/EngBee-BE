import { AppDataSource } from "../data-source";
import { ILike } from "typeorm";
import {
  CreateUserDTO,
  UpdateUserDTO,
  UserResponseDTO,
  UserDetailResponseDTO,
  UserListDTO,
} from "../dtos/user.dto";
import { User } from "../entities/User";
import { UserRole, UserStatus } from "../enums";
import { createPaginatedResponse } from "../utils/pagination.utils";
import { PaginatedResponseDTO } from "../dtos/pagination.dto";
import { NotFoundException, ConflictException, InternalServerErrorException } from "../exceptions/HttpException";

export class UserService {
  private userRepository = AppDataSource.getRepository(User);

  // Create user
  async createUser(dto: CreateUserDTO): Promise<UserResponseDTO> {
    // Check if email already exists
    const existing = await this.userRepository.findOne({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException(`Email '${dto.email}' is already registered`);
    }

    const user = this.userRepository.create({
      email: dto.email,
      password: dto.password, // Note: Should be hashed in real implementation
      role: dto.role || UserRole.LEARNER,
      uiLanguage: dto.uiLanguage,
      firstName: dto.firstName,
      lastName: dto.lastName,
    });

    const saved = await this.userRepository.save(user);
    return this.mapToResponseDTO(saved);
  }

  // Get user by ID
  async getUserById(id: string): Promise<UserDetailResponseDTO> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ["learnerProfile", "taughtClasses", "enrolledClasses"],
    });

    if (!user) {
      throw new NotFoundException(`User with ID '${id}' not found`);
    }

    return this.mapToDetailResponseDTO(user);
  }

  // Get user by email
  async getUserByEmail(email: string): Promise<UserResponseDTO> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundException(`User with email '${email}' not found`);
    }
    return this.mapToResponseDTO(user);
  }

  // Get all users
  async getAllUsers(limit: number, offset: number): Promise<PaginatedResponseDTO<UserListDTO>> {
    const [users, total] = await this.userRepository.findAndCount({
      take: limit,
      skip: offset,
      order: { createdAt: "DESC" },
    });

    return createPaginatedResponse(
      users.map((user) => this.mapToListDTO(user)),
      total,
      limit,
      offset
    );
  }

  // Get users by role
  async getUsersByRole(role: UserRole, limit: number, offset: number): Promise<PaginatedResponseDTO<UserListDTO>> {
    const [users, total] = await this.userRepository.findAndCount({
      where: { role },
      relations: ["enrolledClasses", "attempts"],
      take: limit,
      skip: offset,
      order: { createdAt: "DESC" },
    });

    return createPaginatedResponse(
      users.map((user) => this.mapToListDTO(user)),
      total,
      limit,
      offset
    );
  }

  // Get learners
  async getLearners(limit: number, offset: number): Promise<PaginatedResponseDTO<UserListDTO>> {
    return this.getUsersByRole(UserRole.LEARNER, limit, offset);
  }

  // Get teachers
  async getTeachers(limit: number, offset: number): Promise<PaginatedResponseDTO<UserListDTO>> {
    return this.getUsersByRole(UserRole.TEACHER, limit, offset);
  }

  // Search users
  async searchUsers(query: string, limit: number = 10): Promise<UserListDTO[]> {
    const users = await this.userRepository.find({
      where: [
        { email: ILike(`%${query}%`) },
        { firstName: ILike(`%${query}%`) },
        { lastName: ILike(`%${query}%`) },
      ],
      take: limit,
    });
    return users.map(user => this.mapToListDTO(user));
  }

  // Update user
  async updateUser(id: string, dto: UpdateUserDTO): Promise<UserResponseDTO> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID '${id}' not found`);
    }

    // Check if email is being changed and already exists
    if (dto.email && dto.email !== user.email) {
      const existing = await this.userRepository.findOne({ where: { email: dto.email } });
      if (existing) {
        throw new ConflictException(`Email '${dto.email}' is already registered`);
      }
    }

    // Update fields
    if (dto.firstName !== undefined) user.firstName = dto.firstName;
    if (dto.lastName !== undefined) user.lastName = dto.lastName;
    if (dto.avatar !== undefined) user.avatar = dto.avatar;
    if (dto.phone !== undefined) user.phone = dto.phone;
    if (dto.location !== undefined) user.location = dto.location;
    if (dto.bio !== undefined) user.bio = dto.bio;
    if (dto.email !== undefined) user.email = dto.email;
    if (dto.password !== undefined) user.password = dto.password; // Should hash
    if (dto.role !== undefined) user.role = dto.role;
    if (dto.status !== undefined) user.status = dto.status;
    if (dto.uiLanguage !== undefined) user.uiLanguage = dto.uiLanguage;

    await this.userRepository.save(user); // Use save to trigger @UpdateDateColumn and potentially hooks if added
    
    // Refresh to return
    const updated = await this.userRepository.findOne({ where: { id } });
    if (!updated) {
      throw new InternalServerErrorException(`Failed to update user with ID '${id}'`);
    }

    return this.mapToResponseDTO(updated);
  }

  // Lock user account
  async lockUserAccount(id: string): Promise<UserResponseDTO> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID '${id}' not found`);
    }

    if (user.status === UserStatus.LOCKED) {
      throw new ConflictException(`User with ID '${id}' is already locked`);
    }

    user.status = UserStatus.LOCKED;
    await this.userRepository.save(user);

    return this.mapToResponseDTO(user);
  }

  // Unlock user account
  async unlockUserAccount(id: string): Promise<UserResponseDTO> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID '${id}' not found`);
    }

    if (user.status === UserStatus.ACTIVE) {
      throw new ConflictException(`User with ID '${id}' is already active`);
    }

    user.status = UserStatus.ACTIVE;
    await this.userRepository.save(user);

    return this.mapToResponseDTO(user);
  }

  // Delete user
  async deleteUser(id: string): Promise<void> {
    const user = await this.userRepository.findOne({ 
        where: { id },
        relations: ["enrolledClasses"] 
    });

    if (!user) {
      throw new NotFoundException(`User with ID '${id}' not found`);
    }

    // Capture class IDs before deletion
    const enrolledClassIds = user.enrolledClasses?.map(c => c.id) || [];

    await this.userRepository.remove(user);

    // Update stats for all assignments in enrolled classes
    if (enrolledClassIds.length > 0) {
        try {
            const { assignmentService } = await import("./assignment.service");
            for (const classId of enrolledClassIds) {
                await assignmentService.updateClassAssignmentsStats(classId);
            }
        } catch (error) {
            console.error(`Failed to update assignment stats after user deletion:`, error);
        }
    }
  }

  // Mappers
  private mapToResponseDTO(user: User): UserResponseDTO {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      uiLanguage: user.uiLanguage,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      firstName: user.firstName,
      lastName: user.lastName,
      // Frontend expects "name"
      name: (user.firstName && user.lastName) 
        ? `${user.firstName} ${user.lastName}` 
        : (user.firstName || user.lastName || user.email.split('@')[0]),
      avatar: user.avatar,
      phone: user.phone,
      location: user.location,
      bio: user.bio,
    };
  }

  private mapToDetailResponseDTO(user: User): UserDetailResponseDTO {
    return {
      ...this.mapToResponseDTO(user), // Reuse base mapping
      learnerProfile: user.learnerProfile
        ? {
            id: user.learnerProfile.id,
            userId: user.learnerProfile.userId,
            firstName: user.learnerProfile.firstName,
            lastName: user.learnerProfile.lastName,
            targetBand: user.learnerProfile.targetBand,
            currentBand: user.learnerProfile.currentBand,
            nativeLanguage: user.learnerProfile.nativeLanguage,
            learningGoals: user.learnerProfile.learningGoals,
          }
        : undefined,
      taughtClasses: user.taughtClasses?.map((c) => ({
        id: c.id,
        teacherId: c.teacherId,
        name: c.name,
        description: c.description,
        code: c.code,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      })),
      enrolledClasses: user.enrolledClasses?.map((c) => ({
        id: c.id,
        teacherId: c.teacherId,
        name: c.name,
        description: c.description,
        code: c.code,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      })),
    };
  }

  private mapToListDTO(user: User): UserListDTO {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
      firstName: user.firstName, // Use user entity fields now
      lastName: user.lastName,
      name: (user.firstName && user.lastName) 
        ? `${user.firstName} ${user.lastName}` 
        : (user.firstName || user.lastName || user.email.split('@')[0]),
      avatar: user.avatar,
      enrolledClass: user.enrolledClasses?.map(c => c.name).join(", ") || "-",
      lastActiveAt: user.attempts && user.attempts.length > 0 
          ? new Date(Math.max(...user.attempts.map(a => new Date(a.scoredAt || a.submittedAt || a.createdAt).getTime()))) 
          : user.updatedAt
    };
  }
}
