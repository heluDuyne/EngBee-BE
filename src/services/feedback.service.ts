import { AppDataSource } from "../data-source";
import {
  CreateFeedbackDTO,
  UpdateFeedbackDTO,
  FeedbackResponseDTO,
  FeedbackListDTO,
  FeedbackDetailDTO,
  FeedbackFilterDTO,
} from "../dtos/feedback.dto";
import { Feedback, FeedbackType, FeedbackVisibility } from "../entities/Feedback";
import { Attempt } from "../entities/Attempt";
import { User } from "../entities/User";
import { createPaginatedResponse } from "../utils/pagination.utils";
import { PaginatedResponseDTO } from "../dtos/pagination.dto";
import { NotFoundException, ConflictException, InternalServerErrorException, BadRequestException } from "../exceptions/HttpException";

export class FeedbackService {
  private feedbackRepository = AppDataSource.getRepository(Feedback);
  private attemptRepository = AppDataSource.getRepository(Attempt);
  private userRepository = AppDataSource.getRepository(User);

  // Create feedback
  async createFeedback(dto: CreateFeedbackDTO): Promise<FeedbackResponseDTO> {
    // Check if attempt exists
    const attempt = await this.attemptRepository.findOne({ where: { id: dto.attemptId } });
    if (!attempt) {
      throw new NotFoundException(`Attempt with ID '${dto.attemptId}' not found`);
    }

    // Check if author exists
    const author = await this.userRepository.findOne({ where: { id: dto.authorId } });
    if (!author) {
      throw new NotFoundException(`Author user with ID '${dto.authorId}' not found`);
    }

    const feedback = this.feedbackRepository.create({
      attemptId: dto.attemptId,
      authorId: dto.authorId,
      type: dto.type,
      content: dto.content,
      visibility: dto.visibility,
      metadata: dto.metadata,
    });

    const saved = await this.feedbackRepository.save(feedback);
    return this.mapToResponseDTO(saved);
  }

  // Get feedback by ID
  async getFeedbackById(id: string): Promise<FeedbackDetailDTO> {
    const feedback = await this.feedbackRepository.findOne({
      where: { id },
      relations: ["author", "attempt"],
    });
    if (!feedback) {
      throw new NotFoundException(`Feedback with ID '${id}' not found`);
    }
    return this.mapToDetailDTO(feedback);
  }

  // Get all feedback
  async getAllFeedback(limit: number = 10, offset: number = 0): Promise<PaginatedResponseDTO<FeedbackListDTO>> {
    const [feedbacks, total] = await this.feedbackRepository.findAndCount({
      take: limit,
      skip: offset,
    });
    return createPaginatedResponse(
      feedbacks.map((f) => this.mapToListDTO(f)),
      total,
      limit,
      offset
    );
  }

  // Get feedback by attempt
  async getFeedbackByAttempt(attemptId: string): Promise<FeedbackResponseDTO[]> {
    const feedbacks = await this.feedbackRepository.find({
      where: { attemptId },
    });
    return feedbacks.map((f) => this.mapToResponseDTO(f));
  }

  // Get feedback by attempt and visibility
  async getFeedbackByAttemptAndVisibility(
    attemptId: string,
    visibility: FeedbackVisibility
  ): Promise<FeedbackResponseDTO[]> {
    const feedbacks = await this.feedbackRepository.find({
      where: { attemptId, visibility },
    });
    return feedbacks.map((f) => this.mapToResponseDTO(f));
  }

  // Get feedback by author
  async getFeedbackByAuthor(authorId: string, limit: number = 10, offset: number = 0): Promise<PaginatedResponseDTO<FeedbackListDTO>> {
    const [feedbacks, total] = await this.feedbackRepository.findAndCount({
      where: { authorId },
      take: limit,
      skip: offset,
    });
    return createPaginatedResponse(
      feedbacks.map((f) => this.mapToListDTO(f)),
      total,
      limit,
      offset
    );
  }

  // Get feedback by type
  async getFeedbackByType(type: FeedbackType, limit: number = 10, offset: number = 0): Promise<PaginatedResponseDTO<FeedbackListDTO>> {
    const [feedbacks, total] = await this.feedbackRepository.findAndCount({
      where: { type },
      take: limit,
      skip: offset,
    });
    return createPaginatedResponse(
      feedbacks.map((f) => this.mapToListDTO(f)),
      total,
      limit,
      offset
    );
  }

  // Get feedback by visibility
  async getFeedbackByVisibility(
    visibility: FeedbackVisibility,
    limit: number = 10,
    offset: number = 0
  ): Promise<PaginatedResponseDTO<FeedbackListDTO>> {
    const [feedbacks, total] = await this.feedbackRepository.findAndCount({
      where: { visibility },
      take: limit,
      skip: offset,
    });
    return createPaginatedResponse(
      feedbacks.map((f) => this.mapToListDTO(f)),
      total,
      limit,
      offset
    );
  }

  // Get feedback with filter
  async getFeedbackByFilter(attemptId: string, filter: FeedbackFilterDTO): Promise<PaginatedResponseDTO<FeedbackListDTO>> {
    const feedbacks = await this.feedbackRepository.find({
      where: { attemptId },
    });

    let filtered = feedbacks;

    if (filter.type) {
      filtered = filtered.filter((f) => f.type === filter.type);
    }

    if (filter.visibility) {
      filtered = filtered.filter((f) => f.visibility === filter.visibility);
    }

    const limit = filter.limit || 10;
    const offset = filter.offset || 0;
    const paginated = filtered.slice(offset, offset + limit);

    return createPaginatedResponse(
      paginated.map((f) => this.mapToListDTO(f)),
      filtered.length,
      limit,
      offset
    );
  }

  // Update feedback
  async updateFeedback(id: string, dto: UpdateFeedbackDTO): Promise<FeedbackResponseDTO> {
    const feedback = await this.feedbackRepository.findOne({ where: { id } });
    if (!feedback) {
      throw new NotFoundException(`Feedback with ID '${id}' not found`);
    }

    await this.feedbackRepository.update(id, dto);
    const updated = await this.feedbackRepository.findOne({ where: { id } });
    if (!updated) {
      throw new InternalServerErrorException(`Failed to update feedback with ID '${id}'`);
    }

    return this.mapToResponseDTO(updated);
  }

  // Delete feedback
  async deleteFeedback(id: string): Promise<boolean> {
    const feedback = await this.feedbackRepository.findOne({ where: { id } });
    if (!feedback) {
      throw new NotFoundException(`Feedback with ID '${id}' not found`);
    }
    const result = await this.feedbackRepository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  // Delete feedback by attempt
  async deleteFeedbackByAttempt(attemptId: string): Promise<number> {
    const result = await this.feedbackRepository.delete({ attemptId });
    return result.affected ?? 0;
  }

  // Get statistics
  async getFeedbackCountByAttempt(attemptId: string): Promise<number> {
    return await this.feedbackRepository.count({ where: { attemptId } });
  }

  async getFeedbackCountByAuthor(authorId: string): Promise<number> {
    return await this.feedbackRepository.count({ where: { authorId } });
  }

  async getFeedbackCountByType(type: FeedbackType): Promise<number> {
    return await this.feedbackRepository.count({ where: { type } });
  }

  // Mappers
  private mapToResponseDTO(feedback: Feedback): FeedbackResponseDTO {
    return {
      id: feedback.id,
      attemptId: feedback.attemptId,
      authorId: feedback.authorId,
      type: feedback.type,
      content: feedback.content,
      visibility: feedback.visibility,
      metadata: feedback.metadata,
      createdAt: feedback.createdAt,
      updatedAt: feedback.updatedAt,
    };
  }

  private mapToListDTO(feedback: Feedback): FeedbackListDTO {
    return {
      id: feedback.id,
      attemptId: feedback.attemptId,
      type: feedback.type,
      visibility: feedback.visibility,
      createdAt: feedback.createdAt,
    };
  }

  private mapToDetailDTO(feedback: Feedback): FeedbackDetailDTO {
    return {
      id: feedback.id,
      attemptId: feedback.attemptId,
      authorId: feedback.authorId,
      type: feedback.type,
      content: feedback.content,
      visibility: feedback.visibility,
      metadata: feedback.metadata,
      createdAt: feedback.createdAt,
      updatedAt: feedback.updatedAt,
      authorEmail: feedback.author?.email,
      authorName: feedback.author?.email.split("@")[0],
      attemptDate: feedback.attempt?.createdAt,
    };
  }
}
