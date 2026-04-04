import { Repository } from "typeorm";
import { AppDataSource } from "../data-source";
import { AIRule, ScoringWeights } from "../entities/AIRule";
import {
  CreateAIRuleDTO,
  UpdateAIRuleDTO,
  AIRuleResponseDTO,
  AIRuleListDTO,
  AIRuleFilterDTO,
} from "../dtos/ai-rule.dto";
import { PaginatedResponseDTO } from "../dtos/pagination.dto";
import { HttpException } from "../exceptions/HttpException";

export class AIRuleService {
  private aiRuleRepository: Repository<AIRule>;

  constructor() {
    this.aiRuleRepository = AppDataSource.getRepository(AIRule);
  }

  async createAIRule(teacherId: string, dto: CreateAIRuleDTO): Promise<AIRuleResponseDTO> {
    // Validate weights sum to approximately 1.0 (with tolerance)
    const weightsSum = Object.values(dto.weights).reduce((a, b) => a + b, 0);
    if (weightsSum < 0.9 || weightsSum > 1.1) {
      throw new HttpException("Scoring weights must sum to 1.0 (tolerance: ±0.1)", 400);
    }

    const aiRule = this.aiRuleRepository.create({
      teacherId,
      name: dto.name,
      description: dto.description,
      modelId: dto.modelId,
      rubricId: dto.rubricId || "ielts_speaking",
      weights: dto.weights,
      strictness: dto.strictness || 1.0,
      extraConfig: dto.extraConfig,
      isActive: true,
    });

    const saved = await this.aiRuleRepository.save(aiRule);
    return this.mapToResponseDTO(saved);
  }

  async getAIRuleById(id: string): Promise<AIRuleResponseDTO> {
    const aiRule = await this.aiRuleRepository.findOne({
      where: { id },
    });

    if (!aiRule) {
      throw new HttpException("AI Rule not found", 404);
    }

    return this.mapToResponseDTO(aiRule);
  }

  async getAllAIRules(limit: number = 10, offset: number = 0): Promise<PaginatedResponseDTO<AIRuleListDTO>> {
    const [data, total] = await this.aiRuleRepository.findAndCount({
      skip: offset,
      take: limit,
      order: { createdAt: "DESC" },
    });

    return {
      data: data.map((a) => this.mapToListDTO(a)),
      pagination: {
        limit,
        offset,
        total,
      },
    };
  }

  async getAIRulesByTeacher(
    teacherId: string,
    limit: number = 10,
    offset: number = 0
  ): Promise<PaginatedResponseDTO<AIRuleListDTO>> {
    const [data, total] = await this.aiRuleRepository.findAndCount({
      where: { teacherId },
      skip: offset,
      take: limit,
      order: { createdAt: "DESC" },
    });

    return {
      data: data.map((a) => this.mapToListDTO(a)),
      pagination: {
        limit,
        offset,
        total,
      },
    };
  }

  async getActiveAIRulesByTeacher(teacherId: string): Promise<AIRuleListDTO[]> {
    const rules = await this.aiRuleRepository.find({
      where: { teacherId, isActive: true },
      order: { createdAt: "DESC" },
    });

    return rules.map((a) => this.mapToListDTO(a));
  }

  async getAIRulesByFilter(filter: AIRuleFilterDTO): Promise<PaginatedResponseDTO<AIRuleListDTO>> {
    const query = this.aiRuleRepository.createQueryBuilder("a");

    if (filter.teacherId) {
      query.andWhere("a.teacher_id = :teacherId", { teacherId: filter.teacherId });
    }

    if (filter.isActive !== undefined) {
      query.andWhere("a.isActive = :isActive", { isActive: filter.isActive });
    }

    if (filter.modelId) {
      query.andWhere("a.modelId = :modelId", { modelId: filter.modelId });
    }

    const total = await query.getCount();
    const data = await query
      .skip(filter.offset || 0)
      .take(filter.limit || 10)
      .orderBy("a.createdAt", "DESC")
      .getMany();

    return {
      data: data.map((a) => this.mapToListDTO(a)),
      pagination: {
        limit: filter.limit || 10,
        offset: filter.offset || 0,
        total,
      },
    };
  }

  async updateAIRule(id: string, dto: UpdateAIRuleDTO): Promise<AIRuleResponseDTO> {
    const aiRule = await this.aiRuleRepository.findOne({
      where: { id },
    });

    if (!aiRule) {
      throw new HttpException("AI Rule not found", 404);
    }

    // Validate weights if provided
    if (dto.weights) {
      const weightsSum = Object.values(dto.weights).reduce((a, b) => a + b, 0);
      if (weightsSum < 0.9 || weightsSum > 1.1) {
        throw new HttpException("Scoring weights must sum to 1.0 (tolerance: ±0.1)", 400);
      }
    }

    Object.assign(aiRule, dto);
    const updated = await this.aiRuleRepository.save(aiRule);

    return this.mapToResponseDTO(updated);
  }

  async toggleAIRuleStatus(id: string): Promise<AIRuleResponseDTO> {
    const aiRule = await this.aiRuleRepository.findOne({
      where: { id },
    });

    if (!aiRule) {
      throw new HttpException("AI Rule not found", 404);
    }

    aiRule.isActive = !aiRule.isActive;
    const updated = await this.aiRuleRepository.save(aiRule);

    return this.mapToResponseDTO(updated);
  }

  async deleteAIRule(id: string): Promise<void> {
    const aiRule = await this.aiRuleRepository.findOne({
      where: { id },
    });

    if (!aiRule) {
      throw new HttpException("AI Rule not found", 404);
    }

    await this.aiRuleRepository.remove(aiRule);
  }

  // Helper methods

  private mapToResponseDTO(aiRule: AIRule): AIRuleResponseDTO {
    return {
      id: aiRule.id,
      teacherId: aiRule.teacherId,
      name: aiRule.name,
      description: aiRule.description,
      modelId: aiRule.modelId,
      rubricId: aiRule.rubricId,
      weights: aiRule.weights,
      strictness: aiRule.strictness,
      extraConfig: aiRule.extraConfig,
      isActive: aiRule.isActive,
      createdAt: aiRule.createdAt,
      updatedAt: aiRule.updatedAt,
    };
  }

  private mapToListDTO(aiRule: AIRule): AIRuleListDTO {
    return {
      id: aiRule.id,
      name: aiRule.name,
      modelId: aiRule.modelId,
      rubricId: aiRule.rubricId,
      strictness: aiRule.strictness,
      isActive: aiRule.isActive,
      createdAt: aiRule.createdAt,
    };
  }
}

export const aiRuleService = new AIRuleService();
