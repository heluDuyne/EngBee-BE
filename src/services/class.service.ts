import { AppDataSource } from "../data-source";
import {
  CreateClassDTO,
  UpdateClassDTO,
  ClassResponseDTO,
  ClassListDTO,
  ClassDetailDTO,
  ClassLearnerDTO,
  EnrollLearnerDTO,
  EnrollByCodeDTO,
  RemoveLearnerDTO,
  ClassFilterDTO,
} from "../dtos/class.dto";
import { Class } from "../entities/Class";
import { User } from "../entities/User";
import { createPaginatedResponse } from "../utils/pagination.utils";
import { PaginatedResponseDTO } from "../dtos/pagination.dto";
import { NotFoundException, ConflictException, InternalServerErrorException } from "../exceptions/HttpException";
import { TaskAssignment } from "../entities/TaskAssignment";
import { AssigneeType, TaskStatus } from "../enums";
import { NotificationService } from "./notification.service";
import { NotificationType } from "../enums";

export class ClassService {
  private classRepository = AppDataSource.getRepository(Class);
  private userRepository = AppDataSource.getRepository(User);
  private notificationService = new NotificationService();

  // Create class
  async createClass(dto: CreateClassDTO): Promise<ClassResponseDTO> {
    // Check if teacher exists
    const teacher = await this.userRepository.findOne({ where: { id: dto.teacherId } });
    if (!teacher) {
      throw new NotFoundException(`Teacher with ID '${dto.teacherId}' not found`);
    }

    // Check if code is unique (if provided)
    if (dto.code) {
      const existingClass = await this.classRepository.findOne({ where: { code: dto.code } });
      if (existingClass) {
        throw new ConflictException(`Class code '${dto.code}' already exists`);
      }
    }

    const classs = this.classRepository.create({
      teacherId: dto.teacherId,
      name: dto.name,
      description: dto.description,
      code: dto.code,
    });

    const saved = await this.classRepository.save(classs);
    return this.mapToResponseDTO(saved);
  }

  // Get class by ID
  async getClassById(id: string): Promise<ClassDetailDTO> {
    const classs = await this.classRepository.findOne({
      where: { id },
      relations: ["teacher", "learners"],
    });
    if (!classs) {
      throw new NotFoundException(`Class with ID '${id}' not found`);
    }
    return this.mapToDetailDTO(classs);
  }

  // Get all classes
  async getAllClasses(limit: number = 10, offset: number = 0): Promise<PaginatedResponseDTO<ClassListDTO>> {
    const [classes, total] = await this.classRepository.findAndCount({
      relations: ["learners"],
      take: limit,
      skip: offset,
    });
    return createPaginatedResponse(
      classes.map((c) => this.mapToListDTO(c)),
      total,
      limit,
      offset
    );
  }

  // Get classes by teacher
  async getClassesByTeacher(teacherId: string, limit: number = 10, offset: number = 0): Promise<PaginatedResponseDTO<ClassListDTO>> {
    const [classes, total] = await this.classRepository.findAndCount({
      where: { teacherId },
      relations: ["learners"],
      take: limit,
      skip: offset,
    });
    return createPaginatedResponse(
      classes.map((c) => this.mapToListDTO(c)),
      total,
      limit,
      offset
    );
  }

  // Get class by code
  async getClassByCode(code: string): Promise<ClassDetailDTO> {
    const classs = await this.classRepository.findOne({
      where: { code },
      relations: ["teacher", "learners"],
    });
    if (!classs) {
      throw new NotFoundException(`Class with code '${code}' not found`);
    }
    return this.mapToDetailDTO(classs);
  }

  // Get classes with filter
  async getClassesByFilter(filter: ClassFilterDTO): Promise<PaginatedResponseDTO<ClassListDTO>> {
    const limit = filter.limit || 10;
    const offset = filter.offset || 0;
    return this.getAllClasses(limit, offset);
  }

  // Update class
  async updateClass(id: string, dto: UpdateClassDTO): Promise<ClassResponseDTO> {
    const classs = await this.classRepository.findOne({ where: { id } });
    if (!classs) {
      throw new NotFoundException(`Class with ID '${id}' not found`);
    }

    // Check if code is being changed and already exists
    if (dto.code && dto.code !== classs.code) {
      const existingClass = await this.classRepository.findOne({ where: { code: dto.code } });
      if (existingClass) {
        throw new ConflictException(`Class code '${dto.code}' already exists`);
      }
    }

    await this.classRepository.update(id, dto);
    const updated = await this.classRepository.findOne({ where: { id } });
    if (!updated) {
      throw new InternalServerErrorException(`Failed to update class with ID '${id}'`);
    }

    return this.mapToResponseDTO(updated);
  }

  // Delete class
  async deleteClass(id: string): Promise<boolean> {
    const classs = await this.classRepository.findOne({ where: { id } });
    if (!classs) {
      throw new NotFoundException(`Class with ID '${id}' not found`);
    }
    const result = await this.classRepository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  // Enroll learner
  async enrollLearner(classId: string, dto: EnrollLearnerDTO): Promise<ClassDetailDTO> {
    const classs = await this.classRepository.findOne({ where: { id: classId } });
    if (!classs) {
      throw new NotFoundException(`Class with ID '${classId}' not found`);
    }

    const learner = await this.userRepository.findOne({ where: { id: dto.learnerId } });
    if (!learner) {
      throw new NotFoundException(`Learner with ID '${dto.learnerId}' not found`);
    }

    // Add learner to class using the many-to-many relationship
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      await queryRunner.query(
        `INSERT INTO class_learners (class_id, learner_id) VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [classId, dto.learnerId]
      );
    } finally {
      await queryRunner.release();
    }

    const updated = await this.classRepository.findOne({
      where: { id: classId },
      relations: ["teacher", "learners"],
    });
    if (!updated) {
      throw new InternalServerErrorException(`Failed to enroll learner in class with ID '${classId}'`);
    }

    // Notify teacher asynchronously
    (async () => {
      try {
        await this.notificationService.createNotification({
          userId: classs.teacherId,
          title: "New Student Enrolled",
          message: `${learner.firstName || learner.email} has enrolled in your class "${classs.name}".`,
          type: NotificationType.CLASS_ENROLLED,
          link: `/teacher/class/${classs.id}`,
        });
      } catch (err) {
        console.error("Failed to send enroll notification", err);
      }
    })();

    return this.mapToDetailDTO(updated);
  }

  // Enroll by code
  async enrollByCode(learnerId: string, dto: EnrollByCodeDTO): Promise<ClassDetailDTO> {
    const classs = await this.classRepository.findOne({ where: { code: dto.code } });
    if (!classs) {
      throw new NotFoundException(`Class with code '${dto.code}' not found`);
    }

    const learner = await this.userRepository.findOne({ where: { id: learnerId } });
    if (!learner) {
      throw new NotFoundException(`Learner with ID '${learnerId}' not found`);
    }

    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      await queryRunner.query(
        `INSERT INTO class_learners (class_id, learner_id) VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [classs.id, learnerId]
      );
    } finally {
      await queryRunner.release();
    }

    const updated = await this.classRepository.findOne({
      where: { id: classs.id },
      relations: ["teacher", "learners"],
    });
    if (!updated) {
      throw new InternalServerErrorException(`Failed to enroll learner in class with code '${dto.code}'`);
    }

    // Notify teacher asynchronously
    (async () => {
      try {
        await this.notificationService.createNotification({
          userId: classs.teacherId,
          title: "New Student Enrolled",
          message: `${learner.firstName || learner.email} has enrolled in your class "${classs.name}".`,
          type: NotificationType.CLASS_ENROLLED,
          link: `/teacher/class/${classs.id}`,
        });
      } catch (err) {
        console.error("Failed to send enroll notification", err);
      }
    })();

    return this.mapToDetailDTO(updated);
  }

  // Remove learner
  async removeLearner(classId: string, dto: RemoveLearnerDTO): Promise<ClassDetailDTO> {
    const classs = await this.classRepository.findOne({ where: { id: classId } });
    if (!classs) {
      throw new NotFoundException(`Class with ID '${classId}' not found`);
    }

    const learner = await this.userRepository.findOne({ where: { id: dto.learnerId } });
    if (!learner) {
      throw new NotFoundException(`Learner with ID '${dto.learnerId}' not found`);
    }

    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      await queryRunner.query(
        `DELETE FROM class_learners WHERE class_id = $1 AND learner_id = $2`,
        [classId, dto.learnerId]
      );
    } finally {
      await queryRunner.release();
    }

    const updated = await this.classRepository.findOne({
      where: { id: classId },
      relations: ["teacher", "learners"],
    });
    if (!updated) {
      throw new InternalServerErrorException(`Failed to remove learner from class with ID '${classId}'`);
    }

    return this.mapToDetailDTO(updated);
  }

  // Search classes
  async searchClasses(query: string, limit: number = 10): Promise<ClassListDTO[]> {
    const classes = await this.classRepository
      .createQueryBuilder("class")
      .where("class.name ILIKE :query", { query: `%${query}%` })
      .orWhere("class.description ILIKE :query", { query: `%${query}%` })
      .take(limit)
      .getMany();
    return classes.map((c) => this.mapToListDTO(c));
  }

  // Get class tasks
  async getClassTasks(classId: string): Promise<any[]> {
    const classs = await this.classRepository.findOne({ where: { id: classId } });
    if (!classs) {
      throw new NotFoundException(`Class with ID '${classId}' not found`);
    }

    const assignments = await AppDataSource.getRepository(TaskAssignment).find({
      where: { assigneeType: AssigneeType.CLASS, assigneeId: classId },
      relations: ["task"],
      order: { createdAt: "DESC" },
    });

    const validAssignments = assignments.filter(
      (a) => a.task && (a.task.status === TaskStatus.APPROVED || a.task.status === TaskStatus.PUBLISHED)
    );

    // Map the task to a simple response (re-using Task structure)
    return validAssignments.map((a) => ({
      assignmentId: a.id,
      dueDate: a.dueDate,
      task: a.task,
    }));
  }

  // Get enrolled classes for learner
  async getLearnerClasses(learnerId: string): Promise<any[]> {
    const user = await this.userRepository.findOne({
      where: { id: learnerId },
      relations: ["enrolledClasses", "enrolledClasses.teacher"],
    });
    if (!user) {
      throw new NotFoundException(`Learner with ID '${learnerId}' not found`);
    }
    return (user.enrolledClasses || []).map(c => this.mapToDetailDTO(c));
  }

  // Get learner count
  async getLearnerCount(classId: string): Promise<number> {
    const classs = await this.classRepository.findOne({
      where: { id: classId },
      relations: ["learners"],
    });
    return classs?.learners?.length || 0;
  }

  // Get class count by teacher
  async getClassCountByTeacher(teacherId: string): Promise<number> {
    return await this.classRepository.count({ where: { teacherId } });
  }

  // Mappers
  private mapToResponseDTO(classs: Class): ClassResponseDTO {
    return {
      id: classs.id,
      teacherId: classs.teacherId,
      name: classs.name,
      description: classs.description,
      code: classs.code,
      createdAt: classs.createdAt,
      updatedAt: classs.updatedAt,
    };
  }

  private mapToListDTO(classs: Class): ClassListDTO {
    return {
      id: classs.id,
      name: classs.name,
      code: classs.code,
      createdAt: classs.createdAt,
      learnerCount: classs.learners?.length || 0,
    };
  }

  private mapToDetailDTO(classs: Class): ClassDetailDTO {
    return {
      id: classs.id,
      teacherId: classs.teacherId,
      name: classs.name,
      description: classs.description,
      code: classs.code,
      createdAt: classs.createdAt,
      updatedAt: classs.updatedAt,
      teacherEmail: classs.teacher?.email,
      teacherName: (classs.teacher?.firstName && classs.teacher?.lastName) 
        ? `${classs.teacher.firstName} ${classs.teacher.lastName}`
        : classs.teacher?.firstName 
          ? classs.teacher.firstName 
          : classs.teacher?.email?.split("@")[0] || "?",
      learnerCount: classs.learners?.length || 0,
      learners: classs.learners
        ?.filter(l => l.id !== classs.teacherId)
        .map((l) => ({
          id: l.id,
          email: l.email,
          firstName: l.firstName,
          lastName: l.lastName,
          avatar: l.avatar
        })),
    };
  }
}
