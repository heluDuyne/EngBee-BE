import { AppDataSource } from "../data-source";
import {
  CreateAttemptMediaDTO,
  UpdateAttemptMediaDTO,
  AttemptMediaResponseDTO,
  AttemptMediaListDTO,
  UploadMediaDTO,
} from "../dtos/attempt-media.dto";
import { AttemptMedia } from "../entities/AttemptMedia";
import { MediaType } from "../enums";
import { Attempt } from "../entities/Attempt";
import { createPaginatedResponse } from "../utils/pagination.utils";
import { PaginatedResponseDTO } from "../dtos/pagination.dto";
import { NotFoundException, ConflictException, InternalServerErrorException, BadRequestException } from "../exceptions/HttpException";

export class AttemptMediaService {
  private attemptMediaRepository = AppDataSource.getRepository(AttemptMedia);
  private attemptRepository = AppDataSource.getRepository(Attempt);

  // Create media
  async createMedia(dto: CreateAttemptMediaDTO): Promise<AttemptMediaResponseDTO> {
    // Check if attempt exists
    const attempt = await this.attemptRepository.findOne({ where: { id: dto.attemptId } });
    if (!attempt) {
      throw new NotFoundException(`Attempt with ID '${dto.attemptId}' not found`);
    }

    // Validate file size
    if (dto.fileSize && dto.fileSize > 100 * 1024 * 1024) {
      // 100MB limit
      throw new BadRequestException(`File size ${dto.fileSize} bytes exceeds 100MB limit`);
    }

    const media = this.attemptMediaRepository.create({
      attemptId: dto.attemptId,
      mediaType: dto.mediaType,
      storageUrl: dto.storageUrl,
      fileName: dto.fileName,
      duration: dto.duration,
      fileSize: dto.fileSize,
      mimeType: dto.mimeType,
    });

    const saved = await this.attemptMediaRepository.save(media);
    return this.mapToResponseDTO(saved);
  }

  // Get media by ID
  async getMediaById(id: string): Promise<AttemptMediaResponseDTO> {
    const media = await this.attemptMediaRepository.findOne({ where: { id } });
    if (!media) {
      throw new NotFoundException(`Media with ID '${id}' not found`);
    }
    return this.mapToResponseDTO(media);
  }

  // Get all media
  async getAllMedia(limit: number = 10, offset: number = 0): Promise<PaginatedResponseDTO<AttemptMediaListDTO>> {
    const [mediaList, total] = await this.attemptMediaRepository.findAndCount({
      take: limit,
      skip: offset,
    });
    return createPaginatedResponse(
      mediaList.map((m) => this.mapToListDTO(m)),
      total,
      limit,
      offset
    );
  }

  // Get media by attempt
  async getMediaByAttempt(attemptId: string): Promise<AttemptMediaResponseDTO[]> {
    const mediaList = await this.attemptMediaRepository.find({
      where: { attemptId },
    });
    return mediaList.map((m) => this.mapToResponseDTO(m));
  }

  // Get media by type
  async getMediaByType(mediaType: MediaType, limit: number = 10, offset: number = 0): Promise<PaginatedResponseDTO<AttemptMediaListDTO>> {
    const [mediaList, total] = await this.attemptMediaRepository.findAndCount({
      where: { mediaType },
      take: limit,
      skip: offset,
    });
    return createPaginatedResponse(
      mediaList.map((m) => this.mapToListDTO(m)),
      total,
      limit,
      offset
    );
  }

  // Update media
  async updateMedia(id: string, dto: UpdateAttemptMediaDTO): Promise<AttemptMediaResponseDTO> {
    const media = await this.attemptMediaRepository.findOne({ where: { id } });
    if (!media) {
      throw new NotFoundException(`Media with ID '${id}' not found`);
    }

    await this.attemptMediaRepository.update(id, dto);
    const updated = await this.attemptMediaRepository.findOne({ where: { id } });
    if (!updated) {
      throw new InternalServerErrorException(`Failed to update media with ID '${id}'`);
    }

    return this.mapToResponseDTO(updated);
  }

  // Delete media
  async deleteMedia(id: string): Promise<boolean> {
    const media = await this.attemptMediaRepository.findOne({ where: { id } });
    if (!media) {
      throw new NotFoundException(`Media with ID '${id}' not found`);
    }
    const result = await this.attemptMediaRepository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  // Delete all media for an attempt
  async deleteMediaByAttempt(attemptId: string): Promise<number> {
    const result = await this.attemptMediaRepository.delete({ attemptId });
    return result.affected ?? 0;
  }

  // Get media count for attempt
  async getMediaCountByAttempt(attemptId: string): Promise<number> {
    return await this.attemptMediaRepository.count({ where: { attemptId } });
  }

  // Mappers
  private mapToResponseDTO(media: AttemptMedia): AttemptMediaResponseDTO {
    return {
      id: media.id,
      attemptId: media.attemptId,
      mediaType: media.mediaType,
      storageUrl: media.storageUrl,
      fileName: media.fileName,
      duration: media.duration,
      fileSize: media.fileSize,
      mimeType: media.mimeType,
      uploadedAt: media.uploadedAt,
    };
  }

  private mapToListDTO(media: AttemptMedia): AttemptMediaListDTO {
    return {
      id: media.id,
      fileName: media.fileName,
      mediaType: media.mediaType,
      duration: media.duration,
      uploadedAt: media.uploadedAt,
    };
  }
}
