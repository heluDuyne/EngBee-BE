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
  CreatePromptDTO,
  UpdatePromptDTO,
  PromptResponseDTO,
  PromptListDTO,
  PromptDetailDTO,
  PromptFilterDTO,
} from "../dtos/prompt.dto";
import { PromptService } from "../services/prompt.service";
import { SkillType, DifficultyLevel } from "../enums";
import { PaginatedResponseDTO } from "../dtos/pagination.dto";
import { TeacherOnly } from "../decorators/auth.decorator";
import { AuthRequest } from "../middleware/auth.middleware";

@Route("/prompts")
@Tags("Prompt")
export class PromptController extends Controller {
  private promptService = new PromptService();

  /**
   * Create a new prompt
   * Requires: Teacher or Admin role
   * User ID is automatically extracted from the authentication token
   */
  @Post()
  @Response(201, "Prompt created successfully")
  @Response(401, "Unauthorized - must be logged in")
  @Response(403, "Forbidden - only teachers and admins can create prompts")
  @Security("bearer")
  @TeacherOnly()
  async createPrompt(
    @Body() dto: CreatePromptDTO,
    @Request() request: AuthRequest
  ): Promise<PromptResponseDTO> {
    if (!request.user) {
      throw new Error("Unauthorized: No user in request");
    }
    return await this.promptService.createPrompt(dto, request.user.id);
  }

  /**
   * Get prompt by ID
   */
  @Get("{id}")
  @Response(200, "Prompt found")
  @Response(404, "Prompt not found")
  async getPromptById(@Path() id: string): Promise<PromptDetailDTO> {
    return await this.promptService.getPromptById(id);
  }

  /**
   * Get all prompts with pagination
   */
  @Get()
  async getAllPrompts(
    @Query() limit: number = 10,
    @Query() offset: number = 0
  ): Promise<PaginatedResponseDTO<PromptListDTO>> {
    return await this.promptService.getAllPrompts(limit, offset);
  }

  /**
   * Get prompts by skill type
   */
  @Get("by-skill/{skillType}")
  async getPromptsBySkillType(
    @Path() skillType: SkillType,
    @Query() limit: number = 10,
    @Query() offset: number = 0
  ): Promise<PaginatedResponseDTO<PromptListDTO>> {
    return await this.promptService.getPromptsBySkillType(
      skillType,
      limit,
      offset
    );
  }

  /**
   * Get prompts by difficulty level
   */
  @Get("by-difficulty/{difficulty}")
  async getPromptsByDifficulty(
    @Path() difficulty: DifficultyLevel,
    @Query() limit: number = 10,
    @Query() offset: number = 0
  ): Promise<PaginatedResponseDTO<PromptListDTO>> {
    return await this.promptService.getPromptsByDifficulty(
      difficulty,
      limit,
      offset
    );
  }

  /**
   * Get prompts by creator (teacher)
   */
  @Get("by-creator/{creatorId}")
  async getPromptsByCreator(
    @Path() creatorId: string,
    @Query() limit: number = 10,
    @Query() offset: number = 0
  ): Promise<PaginatedResponseDTO<PromptListDTO>> {
    return await this.promptService.getPromptsByCreator(
      creatorId,
      limit,
      offset
    );
  }

  /**
   * Get prompts with filter
   */
  @Post("filter")
  async getPromptsByFilter(
    @Body() filter: PromptFilterDTO
  ): Promise<PaginatedResponseDTO<PromptListDTO>> {
    return await this.promptService.getPromptsByFilter(filter);
  }

  /**
   * Search prompts by content
   */
  @Get("search/{query}")
  async searchPrompts(
    @Path() query: string,
    @Query() limit: number = 10
  ): Promise<PromptListDTO[]> {
    return await this.promptService.searchPrompts(query, limit);
  }

  /**
   * Update prompt
   * Requires: Teacher or Admin role
   */
  @Put("{id}")
  @Response(200, "Prompt updated successfully")
  @Response(404, "Prompt not found")
  @Response(401, "Unauthorized - must be logged in")
  @Response(403, "Forbidden - only teachers and admins can update prompts")
  @Security("bearer")
  @TeacherOnly()
  async updatePrompt(
    @Path() id: string,
    @Body() dto: UpdatePromptDTO
  ): Promise<PromptResponseDTO> {
    return await this.promptService.updatePrompt(id, dto);
  }

  /**
   * Delete prompt
   * Requires: Teacher or Admin role
   */
  @Delete("{id}")
  @Response(204, "Prompt deleted successfully")
  @Response(404, "Prompt not found")
  @Response(401, "Unauthorized - must be logged in")
  @Response(403, "Forbidden - only teachers and admins can delete prompts")
  @Security("bearer")
  @TeacherOnly()
  async deletePrompt(@Path() id: string): Promise<void> {
    await this.promptService.deletePrompt(id);
    this.setStatus(204);
  }
}
