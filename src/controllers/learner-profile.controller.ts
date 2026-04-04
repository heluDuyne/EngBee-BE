import { Controller, Get, Post, Put, Delete, Route, Body, Path, Query, Response, Tags } from "tsoa";
import {
  CreateLearnerProfileDTO,
  UpdateLearnerProfileDTO,
  LearnerProfileResponseDTO,
  LearnerProfileDetailDTO,
} from "../dtos/learner-profile.dto";
import { LearnerProfileService } from "../services/learner-profile.service";
import { PaginatedResponseDTO } from "../dtos/pagination.dto";

@Route("/learner-profiles")
@Tags("LearnerProfile")
export class LearnerProfileController extends Controller {
  private learnerProfileService = new LearnerProfileService();

  /**
   * Create learner profile
   */
  @Post()
  @Response(201, "Learner profile created successfully")
  async createLearnerProfile(@Body() dto: CreateLearnerProfileDTO): Promise<LearnerProfileResponseDTO> {
    return await this.learnerProfileService.createLearnerProfile(dto);
  }

  /**
   * Get learner profile by ID
   */
  @Get("{id}")
  @Response(200, "Learner profile found")
  @Response(404, "Learner profile not found")
  async getLearnerProfileById(@Path() id: string): Promise<LearnerProfileDetailDTO> {
    return await this.learnerProfileService.getLearnerProfileById(id);
  }

  /**
   * Get learner profile by user ID
   */
  @Get("user/{userId}")
  @Response(200, "Learner profile found")
  @Response(404, "Learner profile not found")
  async getLearnerProfileByUserId(@Path() userId: string): Promise<LearnerProfileDetailDTO> {
    return await this.learnerProfileService.getLearnerProfileByUserId(userId);
  }

  /**
   * Get all learner profiles with pagination
   */
  @Get()
  async getAllLearnerProfiles(
    @Query() limit: number = 10,
    @Query() offset: number = 0
  ): Promise<PaginatedResponseDTO<LearnerProfileDetailDTO>> {
    return await this.learnerProfileService.getAllLearnerProfiles(limit, offset);
  }

  /**
   * Search learner profiles by name
   */
  @Get("search/{query}")
  async searchLearnerProfiles(
    @Path() query: string,
    @Query() limit: number = 10
  ): Promise<LearnerProfileDetailDTO[]> {
    return await this.learnerProfileService.searchLearnerProfiles(query, limit);
  }

  /**
   * Update learner profile
   */
  @Put("{id}")
  @Response(200, "Learner profile updated successfully")
  @Response(404, "Learner profile not found")
  async updateLearnerProfile(
    @Path() id: string,
    @Body() dto: UpdateLearnerProfileDTO
  ): Promise<LearnerProfileResponseDTO> {
    return await this.learnerProfileService.updateLearnerProfile(id, dto);
  }

  /**
   * Get average band for learner
   */
  @Get("{userId}/average-band")
  @Response(200, "Average band retrieved")
  async getAverageBandByUserId(@Path() userId: string): Promise<{ averageBand: number | null }> {
    const averageBand = await this.learnerProfileService.getAverageBandByUserId(userId);
    return { averageBand };
  }

  /**
   * Delete learner profile
   */
  @Delete("{id}")
  @Response(204, "Learner profile deleted successfully")
  @Response(404, "Learner profile not found")
  async deleteLearnerProfile(@Path() id: string): Promise<void> {
    await this.learnerProfileService.deleteLearnerProfile(id);
    this.setStatus(204);
  }
}
