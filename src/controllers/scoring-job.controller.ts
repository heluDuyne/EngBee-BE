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
import { TeacherOnly } from "../decorators/auth.decorator";
import { AuthRequest } from "../middleware/auth.middleware";
import {
  CreateScoringJobDTO,
  UpdateScoringJobDTO,
  ScoringJobResponseDTO,
  ScoringJobListDTO,
  ScoringJobFilterDTO,
} from "../dtos/scoring-job.dto";
import { ScoringJobService } from "../services/scoring-job.service";
import { ScoringJobStatus } from "../enums";
import { PaginatedResponseDTO } from "../dtos/pagination.dto";

@Route("/scoring-jobs")
@Tags("ScoringJob")
export class ScoringJobController extends Controller {
  private scoringJobService = new ScoringJobService();

  /**
   * Create a new scoring job
   * Requires: Teacher or Admin role
   */
  @Post()
  @Response(201, "Scoring job created successfully")
  @Response(401, "Unauthorized - must be logged in")
  @Response(403, "Forbidden - only teachers and admins can create scoring jobs")
  @Security("bearer")
  @TeacherOnly()
  async createScoringJob(
    @Body() dto: CreateScoringJobDTO
  ): Promise<ScoringJobResponseDTO> {
    return await this.scoringJobService.createScoringJob(dto);
  }

  /**
   * Get scoring job by ID
   */
  @Get("{id}")
  @Response(200, "Scoring job found")
  @Response(404, "Scoring job not found")
  async getScoringJobById(@Path() id: string): Promise<ScoringJobResponseDTO> {
    return await this.scoringJobService.getScoringJobById(id);
  }

  /**
   * Get scoring job by attempt ID
   */
  @Get("attempt/{attemptId}")
  @Response(200, "Scoring job found")
  @Response(404, "Scoring job not found")
  async getScoringJobByAttemptId(
    @Path() attemptId: string
  ): Promise<ScoringJobResponseDTO> {
    return await this.scoringJobService.getScoringJobByAttemptId(attemptId);
  }

  /**
   * Get all scoring jobs with pagination
   */
  @Get()
  async getAllScoringJobs(
    @Query() limit: number = 10,
    @Query() offset: number = 0
  ): Promise<PaginatedResponseDTO<ScoringJobListDTO>> {
    return await this.scoringJobService.getAllScoringJobs(limit, offset);
  }

  /**
   * Get scoring jobs by status
   */
  @Get("by-status/{status}")
  async getScoringJobsByStatus(
    @Path() status: ScoringJobStatus,
    @Query() limit: number = 10,
    @Query() offset: number = 0
  ): Promise<PaginatedResponseDTO<ScoringJobListDTO>> {
    return await this.scoringJobService.getScoringJobsByStatus(
      status,
      limit,
      offset
    );
  }

  /**
   * Get pending jobs for worker processing
   */
  @Get("pending/{limit}")
  async getPendingJobs(
    @Path() limit: number = 10
  ): Promise<ScoringJobResponseDTO[]> {
    return await this.scoringJobService.getPendingJobs(limit);
  }

  /**
   * Get scoring jobs with filter
   */
  @Post("filter")
  async getScoringJobsByFilter(
    @Body() filter: ScoringJobFilterDTO
  ): Promise<PaginatedResponseDTO<ScoringJobListDTO>> {
    return await this.scoringJobService.getScoringJobsByFilter(filter);
  }

  /**
   * Update job status
   * Requires: Teacher or Admin role
   */
  @Put("{id}/status/{status}")
  @Response(200, "Job status updated successfully")
  @Response(404, "Job not found")
  @Response(401, "Unauthorized - must be logged in")
  @Response(403, "Forbidden - only teachers and admins can update job status")
  @Security("bearer")
  @TeacherOnly()
  async updateScoringJobStatus(
    @Path() id: string,
    @Path() status: ScoringJobStatus
  ): Promise<ScoringJobResponseDTO> {
    return await this.scoringJobService.updateScoringJobStatus(id, status);
  }

  /**
   * Update job with error message
   * Requires: Teacher or Admin role
   */
  @Put("{id}/error")
  @Response(200, "Job error updated successfully")
  @Response(404, "Job not found")
  @Response(401, "Unauthorized - must be logged in")
  @Response(403, "Forbidden - only teachers and admins can update job errors")
  @Security("bearer")
  @TeacherOnly()
  async updateScoringJobError(
    @Path() id: string,
    @Body() body: { errorMessage: string }
  ): Promise<ScoringJobResponseDTO> {
    return await this.scoringJobService.updateScoringJobError(
      id,
      body.errorMessage
    );
  }

  /**
   * Get job count by status
   */
  @Get("stats/count/{status}")
  async getJobCountByStatus(
    @Path() status: ScoringJobStatus
  ): Promise<{ count: number }> {
    const count = await this.scoringJobService.getJobCountByStatus(status);
    return { count };
  }

  /**
   * Get failed jobs count
   */
  @Get("stats/failed-count")
  async getFailedJobsCount(): Promise<{ count: number }> {
    const count = await this.scoringJobService.getFailedJobsCount();
    return { count };
  }

  /**
   * Get queued jobs count
   */
  @Get("stats/queued-count")
  async getQueuedJobsCount(): Promise<{ count: number }> {
    const count = await this.scoringJobService.getQueuedJobsCount();
    return { count };
  }

  /**
   * Delete scoring job
   * Requires: Teacher or Admin role
   */
  @Delete("{id}")
  @Response(204, "Scoring job deleted successfully")
  @Response(404, "Scoring job not found")
  @Response(401, "Unauthorized - must be logged in")
  @Response(403, "Forbidden - only teachers and admins can delete scoring jobs")
  @Security("bearer")
  @TeacherOnly()
  async deleteScoringJob(@Path() id: string): Promise<void> {
    await this.scoringJobService.deleteScoringJob(id);
    this.setStatus(204);
  }
}
