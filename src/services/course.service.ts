import { AppDataSource } from "../data-source";
import { CreateCourseDTO, UpdateCourseDTO, CourseResponseDTO, ReviewCourseDTO } from "../dtos/course.dto";
import { Course } from "../entities/Course";
import { User } from "../entities/User";
import { CourseStatus } from "../enums";
import { NotFoundException, InternalServerErrorException, ForbiddenException, BadRequestException } from "../exceptions/HttpException";
import { IsNull } from "typeorm";

export class CourseService {
  private courseRepository = AppDataSource.getRepository(Course);
  private userRepository = AppDataSource.getRepository(User);

  async createCourse(creatorId: string, dto: CreateCourseDTO): Promise<CourseResponseDTO> {
    const creator = await this.userRepository.findOne({ where: { id: creatorId } });
    if (!creator) {
      throw new NotFoundException(`User with ID '${creatorId}' not found`);
    }

    const course = this.courseRepository.create({
      creatorId,
      title: dto.title,
      description: dto.description,
      level: dto.level,
      status: CourseStatus.DRAFT,
    });

    const saved = await this.courseRepository.save(course);
    return this.mapToResponseDTO(saved);
  }

  async getCourseById(id: string): Promise<CourseResponseDTO> {
    const course = await this.courseRepository.findOne({ where: { id, deletedAt: IsNull() } });
    if (!course) {
      throw new NotFoundException(`Course with ID '${id}' not found`);
    }
    return this.mapToResponseDTO(course);
  }

  async getAllCourses(isStudent: boolean, teacherId?: string, status?: CourseStatus): Promise<CourseResponseDTO[]> {
    const query = this.courseRepository.createQueryBuilder("course")
      .where("course.deletedAt IS NULL");

    if (isStudent) {
      query.andWhere("course.status = :status", { status: CourseStatus.PUBLISHED });
    } else {
      if (teacherId) {
        query.andWhere("course.creatorId = :teacherId", { teacherId });
      }
      if (status) {
        query.andWhere("course.status = :status", { status });
      }
    }

    const courses = await query.getMany();
    return courses.map((c) => this.mapToResponseDTO(c));
  }

  async updateCourse(id: string, teacherId: string, dto: UpdateCourseDTO): Promise<CourseResponseDTO> {
    const course = await this.courseRepository.findOne({ where: { id, deletedAt: IsNull() } });
    if (!course) {
      throw new NotFoundException(`Course with ID '${id}' not found`);
    }

    if (course.creatorId !== teacherId) {
      throw new ForbiddenException("You can only update your own courses.");
    }

    if (course.status !== CourseStatus.DRAFT) {
      throw new BadRequestException("Only courses in DRAFT status can be updated.");
    }

    await this.courseRepository.update(id, dto);
    const updated = await this.courseRepository.findOne({ where: { id } });
    if (!updated) {
      throw new InternalServerErrorException(`Failed to update course with ID '${id}'`);
    }

    return this.mapToResponseDTO(updated);
  }

  async submitForReview(id: string, teacherId: string, isAdmin: boolean = false): Promise<CourseResponseDTO> {
    const course = await this.courseRepository.findOne({ where: { id, deletedAt: IsNull() } });
    if (!course) {
      throw new NotFoundException(`Course with ID '${id}' not found`);
    }

    if (!isAdmin && course.creatorId !== teacherId) {
      throw new ForbiddenException("You can only submit your own courses.");
    }

    if (course.status !== CourseStatus.DRAFT) {
      throw new BadRequestException("Only DRAFT courses can be submitted for review.");
    }

    course.status = CourseStatus.PENDING_REVIEW;
    await this.courseRepository.save(course);
    return this.mapToResponseDTO(course);
  }

  async reviewCourse(id: string, dto: ReviewCourseDTO): Promise<CourseResponseDTO> {
    const course = await this.courseRepository.findOne({ where: { id, deletedAt: IsNull() } });
    if (!course) {
      throw new NotFoundException(`Course with ID '${id}' not found`);
    }

    if (course.status !== CourseStatus.PENDING_REVIEW) {
      throw new BadRequestException("Only PENDING_REVIEW courses can be reviewed.");
    }

    if (dto.action === "REJECT" && !dto.reason) {
      throw new BadRequestException("Rejection reason is required.");
    }

    course.status = dto.action === "APPROVE" ? CourseStatus.PUBLISHED : CourseStatus.DRAFT;
    course.rejectionReason = dto.action === "REJECT" ? dto.reason : undefined;

    await this.courseRepository.save(course);
    return this.mapToResponseDTO(course);
  }

  async archiveCourse(id: string): Promise<CourseResponseDTO> {
    const course = await this.courseRepository.findOne({ where: { id, deletedAt: IsNull() } });
    if (!course) {
      throw new NotFoundException(`Course with ID '${id}' not found`);
    }

    if (course.status !== CourseStatus.PUBLISHED) {
      throw new BadRequestException("Only PUBLISHED courses can be archived.");
    }

    course.status = CourseStatus.ARCHIVED;
    await this.courseRepository.save(course);
    return this.mapToResponseDTO(course);
  }

  async deleteCourse(id: string, userId: string, isAdmin: boolean): Promise<boolean> {
    const course = await this.courseRepository.findOne({ where: { id, deletedAt: IsNull() } });
    if (!course) {
      throw new NotFoundException(`Course with ID '${id}' not found`);
    }

    if (!isAdmin && course.creatorId !== userId) {
      throw new ForbiddenException("You can only delete your own courses.");
    }

    // Soft delete
    await this.courseRepository.update(id, { deletedAt: new Date() });
    return true;
  }

  private mapToResponseDTO(course: Course): CourseResponseDTO {
    return {
      id: course.id,
      title: course.title,
      description: course.description,
      level: course.level,
      status: course.status,
      rejectionReason: course.rejectionReason || undefined,
      creatorId: course.creatorId,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
    };
  }
}
