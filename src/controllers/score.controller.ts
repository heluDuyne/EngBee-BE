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
  CreateScoreDTO,
  UpdateScoreDTO,
  ScoreResponseDTO,
  ScoreListDTO,
  ScoreDetailDTO,
  ScorePaginationDTO,
} from "../dtos/score.dto";
import { ScoreService } from "../services/score.service";
import { PaginatedResponseDTO } from "../dtos/pagination.dto";

@Route("/scores")
@Tags("Score")
export class ScoreController extends Controller {
  private scoreService = new ScoreService();

  /**
   * Create a new score
   * Requires: Teacher or Admin role
   */
  @Post()
  @Response(201, "Score created successfully")
  @Response(401, "Unauthorized - must be logged in")
  @Response(403, "Forbidden - only teachers and admins can create scores")
  @Security("bearer")
  @TeacherOnly()
  async createScore(@Body() dto: CreateScoreDTO): Promise<ScoreResponseDTO> {
    return await this.scoreService.createScore(dto);
  }

  /**
   * Get score by ID
   */
  @Get("{id}")
  @Response(200, "Score found")
  @Response(404, "Score not found")
  async getScoreById(@Path() id: string): Promise<ScoreDetailDTO> {
    return await this.scoreService.getScoreById(id);
  }

  /**
   * Get score by attempt ID
   */
  @Get("attempt/{attemptId}")
  @Response(200, "Score found")
  @Response(404, "Score not found")
  async getScoreByAttemptId(
    @Path() attemptId: string
  ): Promise<ScoreResponseDTO> {
    return await this.scoreService.getScoreByAttemptId(attemptId);
  }

  /**
   * Get all scores with pagination
   */
  @Get()
  async getAllScores(
    @Query() limit: number = 10,
    @Query() offset: number = 0
  ): Promise<PaginatedResponseDTO<ScoreListDTO>> {
    return await this.scoreService.getAllScores(limit, offset);
  }

  /**
   * Get scores by band
   */
  @Get("by-band/{band}")
  async getScoresByBand(
    @Path() band: number,
    @Query() limit: number = 10,
    @Query() offset: number = 0
  ): Promise<PaginatedResponseDTO<ScoreListDTO>> {
    return await this.scoreService.getScoresByBand(band, limit, offset);
  }

  /**
   * Get scores by band range
   */
  @Get("by-band-range/{minBand}/{maxBand}")
  async getScoresByBandRange(
    @Path() minBand: number,
    @Path() maxBand: number,
    @Query() limit: number = 10,
    @Query() offset: number = 0
  ): Promise<PaginatedResponseDTO<ScoreListDTO>> {
    return await this.scoreService.getScoresByBandRange(
      minBand,
      maxBand,
      limit,
      offset
    );
  }

  /**
   * Update score
   * Requires: Teacher or Admin role
   */
  @Put("{id}")
  @Response(200, "Score updated successfully")
  @Response(404, "Score not found")
  @Response(401, "Unauthorized - must be logged in")
  @Response(403, "Forbidden - only teachers and admins can update scores")
  @Security("bearer")
  @TeacherOnly()
  async updateScore(
    @Path() id: string,
    @Body() dto: UpdateScoreDTO
  ): Promise<ScoreResponseDTO> {
    return await this.scoreService.updateScore(id, dto);
  }

  /**
   * Get average band across all scores
   */
  @Get("stats/average-band")
  async getAverageBand(): Promise<{ averageBand: number | null }> {
    const averageBand = await this.scoreService.getAverageBand();
    return { averageBand };
  }

  /**
   * Get score distribution
   */
  @Get("stats/distribution")
  async getScoreDistribution(): Promise<Record<number, number>> {
    return await this.scoreService.getScoreDistribution();
  }

  /**
   * Delete score
   * Requires: Teacher or Admin role
   */
  @Delete("{id}")
  @Response(204, "Score deleted successfully")
  @Response(404, "Score not found")
  @Response(401, "Unauthorized - must be logged in")
  @Response(403, "Forbidden - only teachers and admins can delete scores")
  @Security("bearer")
  @TeacherOnly()
  async deleteScore(@Path() id: string): Promise<void> {
    await this.scoreService.deleteScore(id);
    this.setStatus(204);
  }
}
