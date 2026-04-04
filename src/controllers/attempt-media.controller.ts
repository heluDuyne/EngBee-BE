import { Controller, Get, Post, Put, Delete, Route, Body, Path, Query, Response, Tags } from "tsoa";
import {
  CreateAttemptMediaDTO,
  UpdateAttemptMediaDTO,
  AttemptMediaResponseDTO,
  AttemptMediaListDTO,
  UploadMediaDTO,
} from "../dtos/attempt-media.dto";
import { AttemptMediaService } from "../services/attempt-media.service";
import { MediaType } from "../enums";
import { PaginatedResponseDTO } from "../dtos/pagination.dto";

@Route("/attempt-media")
@Tags("AttemptMedia")
export class AttemptMediaController extends Controller {
  private attemptMediaService = new AttemptMediaService();

  /**
   * Create media record
   */
  @Post()
  @Response(201, "Media created successfully")
  async createMedia(@Body() dto: CreateAttemptMediaDTO): Promise<AttemptMediaResponseDTO> {
    return await this.attemptMediaService.createMedia(dto);
  }

  /**
   * Get media by ID
   */
  @Get("{id}")
  @Response(200, "Media found")
  @Response(404, "Media not found")
  async getMediaById(@Path() id: string): Promise<AttemptMediaResponseDTO> {
    return await this.attemptMediaService.getMediaById(id);
  }

  /**
   * Get all media with pagination
   */
  @Get()
  async getAllMedia(
    @Query() limit: number = 10,
    @Query() offset: number = 0
  ): Promise<PaginatedResponseDTO<AttemptMediaListDTO>> {
    return await this.attemptMediaService.getAllMedia(limit, offset);
  }

  /**
   * Get media by attempt
   */
  @Get("attempt/{attemptId}")
  async getMediaByAttempt(@Path() attemptId: string): Promise<AttemptMediaResponseDTO[]> {
    return await this.attemptMediaService.getMediaByAttempt(attemptId);
  }

  /**
   * Get media by type
   */
  @Get("by-type/{mediaType}")
  async getMediaByType(
    @Path() mediaType: MediaType,
    @Query() limit: number = 10,
    @Query() offset: number = 0
  ): Promise<PaginatedResponseDTO<AttemptMediaListDTO>> {
    return await this.attemptMediaService.getMediaByType(mediaType, limit, offset);
  }

  /**
   * Update media metadata
   */
  @Put("{id}")
  @Response(200, "Media updated successfully")
  @Response(404, "Media not found")
  async updateMedia(@Path() id: string, @Body() dto: UpdateAttemptMediaDTO): Promise<AttemptMediaResponseDTO> {
    return await this.attemptMediaService.updateMedia(id, dto);
  }

  /**
   * Get media count by attempt
   */
  @Get("{attemptId}/count")
  async getMediaCountByAttempt(@Path() attemptId: string): Promise<{ count: number }> {
    const count = await this.attemptMediaService.getMediaCountByAttempt(attemptId);
    return { count };
  }

  /**
   * Delete media file
   */
  @Delete("{id}")
  @Response(204, "Media deleted successfully")
  @Response(404, "Media not found")
  async deleteMedia(@Path() id: string): Promise<void> {
    await this.attemptMediaService.deleteMedia(id);
    this.setStatus(204);
  }

  /**
   * Delete all media for an attempt
   */
  @Delete("attempt/{attemptId}/all")
  @Response(204, "All media deleted successfully")
  @Response(404, "Attempt not found")
  async deleteMediaByAttempt(@Path() attemptId: string): Promise<void> {
    await this.attemptMediaService.deleteMediaByAttempt(attemptId);
    this.setStatus(204);
  }
}
