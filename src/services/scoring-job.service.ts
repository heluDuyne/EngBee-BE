import { AppDataSource } from "../data-source";
import {
  CreateScoringJobDTO,
  UpdateScoringJobDTO,
  ScoringJobResponseDTO,
  ScoringJobListDTO,
  ScoringJobFilterDTO,
} from "../dtos/scoring-job.dto";
import { ScoringJob } from "../entities/ScoringJob";
import { ScoringJobStatus } from "../enums";
import { Attempt } from "../entities/Attempt";
import { createPaginatedResponse } from "../utils/pagination.utils";
import { PaginatedResponseDTO } from "../dtos/pagination.dto";
import { NotFoundException, ConflictException, InternalServerErrorException, BadRequestException } from "../exceptions/HttpException";

export class ScoringJobService {
  private scoringJobRepository = AppDataSource.getRepository(ScoringJob);
  private attemptRepository = AppDataSource.getRepository(Attempt);

  // Create scoring job
  async createScoringJob(dto: CreateScoringJobDTO): Promise<ScoringJobResponseDTO> {
    // Check if attempt exists
    const attempt = await this.attemptRepository.findOne({ where: { id: dto.attemptId } });
    if (!attempt) {
      throw new NotFoundException(`Attempt with ID '${dto.attemptId}' not found`);
    }

    // Check if job already exists for this attempt
    const existingJob = await this.scoringJobRepository.findOne({
      where: { attemptId: dto.attemptId },
    });
    if (existingJob) {
      throw new ConflictException(`Scoring job already exists for attempt with ID '${dto.attemptId}'`);
    }

    const job = this.scoringJobRepository.create({
      attemptId: dto.attemptId,
      status: ScoringJobStatus.QUEUED,
      retryCount: 0,
    });

    const saved = await this.scoringJobRepository.save(job);
    return this.mapToResponseDTO(saved);
  }

  // Get job by ID
  async getScoringJobById(id: string): Promise<ScoringJobResponseDTO> {
    const job = await this.scoringJobRepository.findOne({ where: { id } });
    if (!job) {
      throw new NotFoundException(`Scoring job with ID '${id}' not found`);
    }
    return this.mapToResponseDTO(job);
  }

  // Get job by attempt ID
  async getScoringJobByAttemptId(attemptId: string): Promise<ScoringJobResponseDTO> {
    const job = await this.scoringJobRepository.findOne({ where: { attemptId } });
    if (!job) {
      throw new NotFoundException(`Scoring job for attempt with ID '${attemptId}' not found`);
    }
    return this.mapToResponseDTO(job);
  }

  // Get all jobs
  async getAllScoringJobs(limit: number = 10, offset: number = 0): Promise<PaginatedResponseDTO<ScoringJobListDTO>> {
    const [jobs, total] = await this.scoringJobRepository.findAndCount({
      take: limit,
      skip: offset,
    });
    return createPaginatedResponse(
      jobs.map((j) => this.mapToListDTO(j)),
      total,
      limit,
      offset
    );
  }

  // Get jobs by status
  async getScoringJobsByStatus(status: ScoringJobStatus, limit: number = 10, offset: number = 0): Promise<PaginatedResponseDTO<ScoringJobListDTO>> {
    const [jobs, total] = await this.scoringJobRepository.findAndCount({
      where: { status },
      take: limit,
      skip: offset,
    });
    return createPaginatedResponse(
      jobs.map((j) => this.mapToListDTO(j)),
      total,
      limit,
      offset
    );
  }

  // Get pending jobs (for worker processing)
  async getPendingJobs(limit: number = 10): Promise<ScoringJobResponseDTO[]> {
    const jobs = await this.scoringJobRepository.find({
      where: { status: ScoringJobStatus.QUEUED },
      take: limit,
      order: { createdAt: "ASC" },
    });
    return jobs.map((j) => this.mapToResponseDTO(j));
  }

  // Get jobs with filter
  async getScoringJobsByFilter(filter: ScoringJobFilterDTO): Promise<PaginatedResponseDTO<ScoringJobListDTO>> {
    const limit = filter.limit || 10;
    const offset = filter.offset || 0;

    if (filter.status) {
      return this.getScoringJobsByStatus(filter.status, limit, offset);
    }

    return this.getAllScoringJobs(limit, offset);
  }

  // Update job status
  async updateScoringJobStatus(id: string, status: ScoringJobStatus): Promise<ScoringJobResponseDTO> {
    const job = await this.scoringJobRepository.findOne({ where: { id } });
    if (!job) {
      throw new NotFoundException(`Scoring job with ID '${id}' not found`);
    }

    await this.scoringJobRepository.update(id, {
      status,
      startedAt: status === ScoringJobStatus.PROCESSING ? new Date() : undefined,
      completedAt: status === ScoringJobStatus.COMPLETED ? new Date() : undefined,
    });

    const updated = await this.scoringJobRepository.findOne({ where: { id } });
    if (!updated) {
      throw new InternalServerErrorException(`Failed to update scoring job with ID '${id}'`);
    }

    return this.mapToResponseDTO(updated);
  }

  // Update job with error
  async updateScoringJobError(id: string, errorMessage: string): Promise<ScoringJobResponseDTO> {
    const job = await this.scoringJobRepository.findOne({ where: { id } });
    if (!job) {
      throw new NotFoundException(`Scoring job with ID '${id}' not found`);
    }

    const retryCount = (job.retryCount || 0) + 1;
    const maxRetries = 3;

    const status = retryCount >= maxRetries ? ScoringJobStatus.FAILED : ScoringJobStatus.QUEUED;

    await this.scoringJobRepository.update(id, {
      status,
      errorMessage,
      retryCount,
    });

    const updated = await this.scoringJobRepository.findOne({ where: { id } });
    if (!updated) {
      throw new InternalServerErrorException(`Failed to update scoring job with ID '${id}'`);
    }

    return this.mapToResponseDTO(updated);
  }

  // Delete job
  async deleteScoringJob(id: string): Promise<boolean> {
    const job = await this.scoringJobRepository.findOne({ where: { id } });
    if (!job) {
      throw new NotFoundException(`Scoring job with ID '${id}' not found`);
    }
    const result = await this.scoringJobRepository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  // Get statistics
  async getJobCountByStatus(status: ScoringJobStatus): Promise<number> {
    return await this.scoringJobRepository.count({ where: { status } });
  }

  async getFailedJobsCount(): Promise<number> {
    return await this.scoringJobRepository.count({
      where: { status: ScoringJobStatus.FAILED },
    });
  }

  async getQueuedJobsCount(): Promise<number> {
    return await this.scoringJobRepository.count({
      where: { status: ScoringJobStatus.QUEUED },
    });
  }

  // Mappers
  private mapToResponseDTO(job: ScoringJob): ScoringJobResponseDTO {
    return {
      id: job.id,
      attemptId: job.attemptId,
      status: job.status,
      errorMessage: job.errorMessage,
      retryCount: job.retryCount,
      createdAt: job.createdAt,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
    };
  }

  private mapToListDTO(job: ScoringJob): ScoringJobListDTO {
    return {
      id: job.id,
      attemptId: job.attemptId,
      status: job.status,
      createdAt: job.createdAt,
    };
  }
}
