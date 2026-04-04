import { AppDataSource } from "../data-source";
import {
  CreatePromptDTO,
  UpdatePromptDTO,
  PromptResponseDTO,
  PromptListDTO,
  PromptDetailDTO,
  PromptFilterDTO,
} from "../dtos/prompt.dto";
import { Prompt } from "../entities/Prompt";
import { SkillType, DifficultyLevel } from "../enums";
import { User } from "../entities/User";
import { createPaginatedResponse } from "../utils/pagination.utils";
import { PaginatedResponseDTO } from "../dtos/pagination.dto";
import { NotFoundException, ConflictException, InternalServerErrorException, BadRequestException } from "../exceptions/HttpException";

export class PromptService {
  private promptRepository = AppDataSource.getRepository(Prompt);
  private userRepository = AppDataSource.getRepository(User);

  // Create prompt
  async createPrompt(dto: CreatePromptDTO, createdBy: string): Promise<PromptResponseDTO> {
    // Check if creator exists
    const creator = await this.userRepository.findOne({ where: { id: createdBy } });
    if (!creator) {
      throw new NotFoundException(`Creator user with ID '${createdBy}' not found`);
    }

    // Validate times
    if (dto.prepTime < 0 || dto.responseTime < 0) {
      throw new BadRequestException(`Invalid time values. prepTime (${dto.prepTime}) and responseTime (${dto.responseTime}) cannot be negative`);
    }

    const prompt = this.promptRepository.create({
      createdBy,
      skillType: dto.skillType,
      content: dto.content,
      difficulty: dto.difficulty,
      prepTime: dto.prepTime,
      responseTime: dto.responseTime,
      description: dto.description,
      followUpQuestions: dto.followUpQuestions,
    });

    const saved = await this.promptRepository.save(prompt);
    return this.mapToResponseDTO(saved);
  }

  // Get prompt by ID
  async getPromptById(id: string): Promise<PromptDetailDTO> {
    const prompt = await this.promptRepository.findOne({
      where: { id },
      relations: ["creator", "attempts"],
    });
    if (!prompt) {
      throw new NotFoundException(`Prompt with ID '${id}' not found`);
    }
    return this.mapToDetailDTO(prompt);
  }

  // Get all prompts
  async getAllPrompts(limit: number = 10, offset: number = 0): Promise<PaginatedResponseDTO<PromptListDTO>> {
    const [prompts, total] = await this.promptRepository.findAndCount({
      take: limit,
      skip: offset,
    });
    return createPaginatedResponse(
      prompts.map((p) => this.mapToListDTO(p)),
      total,
      limit,
      offset
    );
  }

  // Get prompts by skill type
  async getPromptsBySkillType(skillType: SkillType, limit: number = 10, offset: number = 0): Promise<PaginatedResponseDTO<PromptListDTO>> {
    const [prompts, total] = await this.promptRepository.findAndCount({
      where: { skillType },
      take: limit,
      skip: offset,
    });
    return createPaginatedResponse(
      prompts.map((p) => this.mapToListDTO(p)),
      total,
      limit,
      offset
    );
  }

  // Get prompts by difficulty
  async getPromptsByDifficulty(difficulty: DifficultyLevel, limit: number = 10, offset: number = 0): Promise<PaginatedResponseDTO<PromptListDTO>> {
    const [prompts, total] = await this.promptRepository.findAndCount({
      where: { difficulty },
      take: limit,
      skip: offset,
    });
    return createPaginatedResponse(
      prompts.map((p) => this.mapToListDTO(p)),
      total,
      limit,
      offset
    );
  }

  // Get prompts by skill and difficulty
  async getPromptsByFilter(filter: PromptFilterDTO): Promise<PaginatedResponseDTO<PromptListDTO>> {
    const limit = filter.limit || 10;
    const offset = filter.offset || 0;

    if (filter.skillType && filter.difficulty) {
      const [prompts, total] = await this.promptRepository.findAndCount({
        where: {
          skillType: filter.skillType,
          difficulty: filter.difficulty,
        },
        take: limit,
        skip: offset,
      });
      return createPaginatedResponse(
        prompts.map((p) => this.mapToListDTO(p)),
        total,
        limit,
        offset
      );
    }

    if (filter.skillType) {
      return this.getPromptsBySkillType(filter.skillType, limit, offset);
    }

    if (filter.difficulty) {
      return this.getPromptsByDifficulty(filter.difficulty, limit, offset);
    }

    return this.getAllPrompts(limit, offset);
  }

  // Get prompts by creator
  async getPromptsByCreator(creatorId: string, limit: number = 10, offset: number = 0): Promise<PaginatedResponseDTO<PromptListDTO>> {
    const [prompts, total] = await this.promptRepository.findAndCount({
      where: { createdBy: creatorId },
      take: limit,
      skip: offset,
    });
    return createPaginatedResponse(
      prompts.map((p) => this.mapToListDTO(p)),
      total,
      limit,
      offset
    );
  }

  // Update prompt
  async updatePrompt(id: string, dto: UpdatePromptDTO): Promise<PromptResponseDTO> {
    const prompt = await this.promptRepository.findOne({ where: { id } });
    if (!prompt) {
      throw new NotFoundException(`Prompt with ID '${id}' not found`);
    }

    // Validate times if provided
    if ((dto.prepTime !== undefined && dto.prepTime < 0) || (dto.responseTime !== undefined && dto.responseTime < 0)) {
      throw new BadRequestException(`Invalid time values. Time values cannot be negative`);
    }

    await this.promptRepository.update(id, dto);
    const updated = await this.promptRepository.findOne({ where: { id } });
    if (!updated) {
      throw new InternalServerErrorException(`Failed to update prompt with ID '${id}'`);
    }

    return this.mapToResponseDTO(updated);
  }

  // Delete prompt
  async deletePrompt(id: string): Promise<boolean> {
    const prompt = await this.promptRepository.findOne({ where: { id } });
    if (!prompt) {
      throw new NotFoundException(`Prompt with ID '${id}' not found`);
    }
    const result = await this.promptRepository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  // Search prompts
  async searchPrompts(query: string, limit: number = 10): Promise<PromptListDTO[]> {
    const prompts = await this.promptRepository
      .createQueryBuilder("prompt")
      .where("prompt.content ILIKE :query", { query: `%${query}%` })
      .orWhere("prompt.description ILIKE :query", { query: `%${query}%` })
      .take(limit)
      .getMany();
    return prompts.map((p) => this.mapToListDTO(p));
  }

  // Mappers
  private mapToResponseDTO(prompt: Prompt): PromptResponseDTO {
    return {
      id: prompt.id,
      createdBy: prompt.createdBy,
      skillType: prompt.skillType,
      content: prompt.content,
      difficulty: prompt.difficulty,
      prepTime: prompt.prepTime,
      responseTime: prompt.responseTime,
      description: prompt.description,
      followUpQuestions: prompt.followUpQuestions,
      createdAt: prompt.createdAt,
      updatedAt: prompt.updatedAt,
    };
  }

  private mapToListDTO(prompt: Prompt): PromptListDTO {
    return {
      id: prompt.id,
      skillType: prompt.skillType,
      difficulty: prompt.difficulty,
      content: prompt.content,
      prepTime: prompt.prepTime,
      responseTime: prompt.responseTime,
      createdAt: prompt.createdAt,
    };
  }

  private mapToDetailDTO(prompt: Prompt): PromptDetailDTO {
    return {
      id: prompt.id,
      createdBy: prompt.createdBy,
      skillType: prompt.skillType,
      content: prompt.content,
      difficulty: prompt.difficulty,
      prepTime: prompt.prepTime,
      responseTime: prompt.responseTime,
      description: prompt.description,
      followUpQuestions: prompt.followUpQuestions,
      createdAt: prompt.createdAt,
      updatedAt: prompt.updatedAt,
      creatorName: prompt.creator?.email.split("@")[0],
      creatorEmail: prompt.creator?.email,
      attemptCount: prompt.attempts?.length || 0,
    };
  }
}
