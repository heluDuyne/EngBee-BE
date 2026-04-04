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
  CreateFeedbackDTO,
  UpdateFeedbackDTO,
  FeedbackResponseDTO,
  FeedbackListDTO,
  FeedbackDetailDTO,
  FeedbackFilterDTO,
} from "../dtos/feedback.dto";
import { FeedbackService } from "../services/feedback.service";
import { FeedbackType, FeedbackVisibility } from "../entities/Feedback";
import { PaginatedResponseDTO } from "../dtos/pagination.dto";
import { TeacherOnly, Authenticated } from "../decorators/auth.decorator";
import { AuthRequest } from "../middleware/auth.middleware";

@Route("/feedback")
@Tags("Feedback")
export class FeedbackController extends Controller {
  private feedbackService = new FeedbackService();

  /**
   * Create feedback
   */
  @Post()
  @Response(201, "Feedback created successfully")
  @Response(401, "Unauthorized - must be logged in")
  @Response(403, "Forbidden - only teachers and admins can create feedback")
  @Security("bearer")
  @TeacherOnly()
  async createFeedback(
    @Body() dto: CreateFeedbackDTO
  ): Promise<FeedbackResponseDTO> {
    return await this.feedbackService.createFeedback(dto);
  }

  /**
   * Get feedback by ID
   */
  @Get("{id}")
  @Response(200, "Feedback found")
  @Response(404, "Feedback not found")
  async getFeedbackById(@Path() id: string): Promise<FeedbackDetailDTO> {
    return await this.feedbackService.getFeedbackById(id);
  }

  /**
   * Get all feedback with pagination
   */
  @Get()
  async getAllFeedback(
    @Query() limit: number = 10,
    @Query() offset: number = 0
  ): Promise<PaginatedResponseDTO<FeedbackListDTO>> {
    return await this.feedbackService.getAllFeedback(limit, offset);
  }

  /**
   * Get feedback by attempt
   */
  @Get("attempt/{attemptId}")
  async getFeedbackByAttempt(
    @Path() attemptId: string
  ): Promise<FeedbackResponseDTO[]> {
    return await this.feedbackService.getFeedbackByAttempt(attemptId);
  }

  /**
   * Get feedback by attempt and visibility
   */
  @Get("attempt/{attemptId}/visibility/{visibility}")
  async getFeedbackByAttemptAndVisibility(
    @Path() attemptId: string,
    @Path() visibility: FeedbackVisibility
  ): Promise<FeedbackResponseDTO[]> {
    return await this.feedbackService.getFeedbackByAttemptAndVisibility(
      attemptId,
      visibility
    );
  }

  /**
   * Get feedback by author
   */
  @Get("author/{authorId}")
  async getFeedbackByAuthor(
    @Path() authorId: string,
    @Query() limit: number = 10,
    @Query() offset: number = 0
  ): Promise<PaginatedResponseDTO<FeedbackListDTO>> {
    return await this.feedbackService.getFeedbackByAuthor(
      authorId,
      limit,
      offset
    );
  }

  /**
   * Get feedback by type
   */
  @Get("by-type/{type}")
  async getFeedbackByType(
    @Path() type: FeedbackType,
    @Query() limit: number = 10,
    @Query() offset: number = 0
  ): Promise<PaginatedResponseDTO<FeedbackListDTO>> {
    return await this.feedbackService.getFeedbackByType(type, limit, offset);
  }

  /**
   * Get feedback by visibility
   */
  @Get("by-visibility/{visibility}")
  async getFeedbackByVisibility(
    @Path() visibility: FeedbackVisibility,
    @Query() limit: number = 10,
    @Query() offset: number = 0
  ): Promise<PaginatedResponseDTO<FeedbackListDTO>> {
    return await this.feedbackService.getFeedbackByVisibility(
      visibility,
      limit,
      offset
    );
  }

  /**
   * Get feedback with filter
   */
  @Post("attempt/{attemptId}/filter")
  async getFeedbackByFilter(
    @Path() attemptId: string,
    @Body() filter: FeedbackFilterDTO
  ): Promise<PaginatedResponseDTO<FeedbackListDTO>> {
    return await this.feedbackService.getFeedbackByFilter(attemptId, filter);
  }

  /**
   * Update feedback
   * Requires: Teacher or Admin role
   */
  @Put("{id}")
  @Response(200, "Feedback updated successfully")
  @Response(404, "Feedback not found")
  @Response(401, "Unauthorized - must be logged in")
  @Response(403, "Forbidden - only teachers and admins can update feedback")
  @Security("bearer")
  @TeacherOnly()
  async updateFeedback(
    @Path() id: string,
    @Body() dto: UpdateFeedbackDTO
  ): Promise<FeedbackResponseDTO> {
    return await this.feedbackService.updateFeedback(id, dto);
  }

  /**
   * Get feedback count by attempt
   */
  @Get("{attemptId}/count")
  async getFeedbackCountByAttempt(
    @Path() attemptId: string
  ): Promise<{ count: number }> {
    const count = await this.feedbackService.getFeedbackCountByAttempt(
      attemptId
    );
    return { count };
  }

  /**
   * Get feedback count by author
   */
  @Get("author/{authorId}/count")
  async getFeedbackCountByAuthor(
    @Path() authorId: string
  ): Promise<{ count: number }> {
    const count = await this.feedbackService.getFeedbackCountByAuthor(authorId);
    return { count };
  }

  /**
   * Get feedback count by type
   */
  @Get("type/{type}/count")
  async getFeedbackCountByType(
    @Path() type: FeedbackType
  ): Promise<{ count: number }> {
    const count = await this.feedbackService.getFeedbackCountByType(type);
    return { count };
  }

  /**
   * Delete feedback
   */
  @Delete("{id}")
  @Response(204, "Feedback deleted successfully")
  @Response(404, "Feedback not found")
  @Response(401, "Unauthorized - must be logged in")
  @Response(403, "Forbidden - only teachers and admins can delete feedback")
  @Security("bearer")
  @TeacherOnly()
  async deleteFeedback(@Path() id: string): Promise<void> {
    await this.feedbackService.deleteFeedback(id);
    this.setStatus(204);
  }

  /**
   * Delete all feedback for an attempt
   */
  @Delete("attempt/{attemptId}/all")
  @Response(204, "All feedback deleted successfully")
  @Response(404, "Attempt not found")
  @Response(401, "Unauthorized - must be logged in")
  @Response(403, "Forbidden - only teachers and admins can delete feedback")
  @Security("bearer")
  @TeacherOnly()
  async deleteFeedbackByAttempt(@Path() attemptId: string): Promise<number> {
    return await this.feedbackService.deleteFeedbackByAttempt(attemptId);
  }
}
