import { AppDataSource } from "../data-source";
import { CreatePracticeDTO, UpdatePracticeDTO, PracticeResponseDTO } from "../dtos/practice.dto";
import { Practice, PracticeStatus } from "../entities/Practice";
import { User } from "../entities/User";
import { NotFoundException, ForbiddenException, BadRequestException } from "../exceptions/HttpException";

export class PracticeService {
  private practiceRepository = AppDataSource.getRepository(Practice);
  private userRepository = AppDataSource.getRepository(User);

  async createPractice(creatorId: string, dto: CreatePracticeDTO): Promise<PracticeResponseDTO> {
    const creator = await this.userRepository.findOne({ where: { id: creatorId } });
    if (!creator) {
      throw new NotFoundException(`User with ID '${creatorId}' not found`);
    }

    const practice = this.practiceRepository.create({
      creatorId,
      title: dto.title,
      description: dto.description,
      level: dto.level,
      skillType: dto.skillType,
      tags: dto.tags,
      duration: dto.duration || 45,
      content: dto.content,
      audioUrl: dto.audioUrl,
      questions: dto.questions || [],
      status: PracticeStatus.PUBLISHED, // Auto-publish for now to match mock data behavior
    });

    const saved = await this.practiceRepository.save(practice);
    return this.mapToResponseDTO(saved);
  }

  async getPracticeById(id: string): Promise<PracticeResponseDTO> {
    const practice = await this.practiceRepository.findOne({ where: { id } });
    if (!practice) {
      throw new NotFoundException(`Practice with ID '${id}' not found`);
    }
    return this.mapToResponseDTO(practice);
  }

  async getAllPractices(status?: PracticeStatus): Promise<PracticeResponseDTO[]> {
    const query = this.practiceRepository.createQueryBuilder("practice");
    if (status) {
      query.andWhere("practice.status = :status", { status });
    }
    const practices = await query.getMany();
    return practices.map(this.mapToResponseDTO);
  }

  async updatePractice(id: string, userId: string, dto: UpdatePracticeDTO, isAdmin: boolean = false): Promise<PracticeResponseDTO> {
    const practice = await this.practiceRepository.findOne({ where: { id } });
    if (!practice) {
      throw new NotFoundException(`Practice with ID '${id}' not found`);
    }

    if (!isAdmin && practice.creatorId !== userId) {
      throw new ForbiddenException("You can only update your own practices.");
    }

    await this.practiceRepository.update(id, dto);
    const updated = await this.practiceRepository.findOne({ where: { id } });
    return this.mapToResponseDTO(updated!);
  }

  async deletePractice(id: string, userId: string, isAdmin: boolean): Promise<boolean> {
    const practice = await this.practiceRepository.findOne({ where: { id } });
    if (!practice) {
      throw new NotFoundException(`Practice with ID '${id}' not found`);
    }

    if (!isAdmin && practice.creatorId !== userId) {
      throw new ForbiddenException("You can only delete your own practices.");
    }

    await this.practiceRepository.delete(id);
    return true;
  }

  private mapToResponseDTO(practice: Practice): PracticeResponseDTO {
    return {
      id: practice.id,
      title: practice.title,
      description: practice.description,
      level: practice.level,
      skillType: practice.skillType,
      tags: practice.tags,
      duration: practice.duration,
      content: practice.content,
      audioUrl: practice.audioUrl,
      questions: practice.questions,
      status: practice.status,
      creatorId: practice.creatorId,
      createdAt: practice.createdAt,
      updatedAt: practice.updatedAt,
    };
  }
}
