import { AppDataSource } from "../data-source";
import {
  CreateLearnerProfileDTO,
  UpdateLearnerProfileDTO,
  LearnerProfileResponseDTO,
  LearnerProfileDetailDTO,
} from "../dtos/learner-profile.dto";
import { LearnerProfile } from "../entities/LearnerProfile";
import { User } from "../entities/User";
import { createPaginatedResponse } from "../utils/pagination.utils";
import { PaginatedResponseDTO } from "../dtos/pagination.dto";
import { NotFoundException, ConflictException, InternalServerErrorException, BadRequestException } from "../exceptions/HttpException";

export class LearnerProfileService {
  private learnerProfileRepository = AppDataSource.getRepository(LearnerProfile);
  private userRepository = AppDataSource.getRepository(User);

  // Create learner profile
  async createLearnerProfile(dto: CreateLearnerProfileDTO): Promise<LearnerProfileResponseDTO> {
    // Check if user exists
    const user = await this.userRepository.findOne({ where: { id: dto.userId } });
    if (!user) {
      throw new NotFoundException(`User with ID '${dto.userId}' not found`);
    }

    // Check if profile already exists for this user
    const existingProfile = await this.learnerProfileRepository.findOne({
      where: { userId: dto.userId }
    });
    if (existingProfile) {
      throw new ConflictException(`Learner profile already exists for user with ID '${dto.userId}'`);
    }

    const profile = this.learnerProfileRepository.create({
      userId: dto.userId,
      firstName: dto.firstName,
      lastName: dto.lastName,
      targetBand: dto.targetBand,
      nativeLanguage: dto.nativeLanguage,
      learningGoals: dto.learningGoals,
    });

    const saved = await this.learnerProfileRepository.save(profile);
    return this.mapToResponseDTO(saved);
  }

  // Get learner profile by ID
  async getLearnerProfileById(id: string): Promise<LearnerProfileDetailDTO> {
    const profile = await this.learnerProfileRepository.findOne({
      where: { id },
      relations: ["user"],
    });
    if (!profile) {
      throw new NotFoundException(`Learner profile with ID '${id}' not found`);
    }
    return this.mapToDetailDTO(profile);
  }

  // Get learner profile by user ID
  async getLearnerProfileByUserId(userId: string): Promise<LearnerProfileDetailDTO> {
    const profile = await this.learnerProfileRepository.findOne({
      where: { userId },
      relations: ["user"],
    });
    if (!profile) {
      // Auto-create profile if missing
      const newProfile = this.learnerProfileRepository.create({
          userId,
          targetBand: 6.0, 
          currentBand: 0,
          learningGoals: "Generated profile",
      });
      await this.learnerProfileRepository.save(newProfile);
      
      const savedProfile = await this.learnerProfileRepository.findOne({
          where: { id: newProfile.id },
          relations: ["user"],
      });
      
      if (!savedProfile) throw new InternalServerErrorException("Failed to create default profile");
      
      return this.mapToDetailDTO(savedProfile);
    }
    return this.mapToDetailDTO(profile);
  }

  // Get all learner profiles
  async getAllLearnerProfiles(limit: number = 10, offset: number = 0): Promise<PaginatedResponseDTO<LearnerProfileResponseDTO>> {
    const [profiles, total] = await this.learnerProfileRepository.findAndCount({
      take: limit,
      skip: offset,
    });
    return createPaginatedResponse(
      profiles.map((p) => this.mapToResponseDTO(p)),
      total,
      limit,
      offset
    );
  }

  // Update learner profile
  async updateLearnerProfile(
    id: string,
    dto: UpdateLearnerProfileDTO
  ): Promise<LearnerProfileResponseDTO> {
    const profile = await this.learnerProfileRepository.findOne({ where: { id } });
    if (!profile) {
      throw new NotFoundException(`Learner profile with ID '${id}' not found`);
    }

    await this.learnerProfileRepository.update(id, dto);

    // Sync user details if provided
    if (dto.firstName || dto.lastName) {
      if (profile.userId) {
        await this.userRepository.update(profile.userId, {
            ...(dto.firstName && { firstName: dto.firstName }),
            ...(dto.lastName && { lastName: dto.lastName })
        });
      }
    }

    const updated = await this.learnerProfileRepository.findOne({ where: { id } });
    if (!updated) {
      throw new InternalServerErrorException(`Failed to update learner profile with ID '${id}'`);
    }

    return this.mapToResponseDTO(updated);
  }

  // Delete learner profile
  async deleteLearnerProfile(id: string): Promise<boolean> {
    const profile = await this.learnerProfileRepository.findOne({ where: { id } });
    if (!profile) {
      throw new NotFoundException(`Learner profile with ID '${id}' not found`);
    }
    const result = await this.learnerProfileRepository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  // Search learner profiles by name
  async searchLearnerProfiles(query: string, limit: number = 10): Promise<LearnerProfileResponseDTO[]> {
    const profiles = await this.learnerProfileRepository
      .createQueryBuilder("profile")
      .where("profile.firstName ILIKE :query", { query: `%${query}%` })
      .orWhere("profile.lastName ILIKE :query", { query: `%${query}%` })
      .take(limit)
      .getMany();
    return profiles.map((p) => this.mapToResponseDTO(p));
  }

  // Get average band for learner
  async getAverageBandByUserId(userId: string): Promise<number | null> {
    const profile = await this.learnerProfileRepository.findOne({
      where: { userId },
    });
    if (!profile) {
      throw new NotFoundException(`Learner profile for user with ID '${userId}' not found`);
    }
    return profile.currentBand || null;
  }

  // Mappers
  private mapToResponseDTO(profile: LearnerProfile): LearnerProfileResponseDTO {
    return {
      id: profile.id,
      userId: profile.userId,
      firstName: profile.firstName,
      lastName: profile.lastName,
      targetBand: profile.targetBand,
      currentBand: profile.currentBand,
      nativeLanguage: profile.nativeLanguage,
      learningGoals: profile.learningGoals,
    };
  }

  private mapToDetailDTO(profile: LearnerProfile): LearnerProfileDetailDTO {
    return {
      id: profile.id,
      userId: profile.userId,
      firstName: profile.firstName,
      lastName: profile.lastName,
      targetBand: profile.targetBand,
      currentBand: profile.currentBand,
      nativeLanguage: profile.nativeLanguage,
      learningGoals: profile.learningGoals,
      userName: profile.user?.email.split("@")[0],
      userEmail: profile.user?.email,
    };
  }
}
