import { Repository, Between, In } from "typeorm";
import { AppDataSource } from "../data-source";
import { Assignment } from "../entities/Assignment";
import { AssignmentStatus, AttemptStatus } from "../enums";
import {
  CreateAssignmentDTO,
  UpdateAssignmentDTO,
  AssignmentResponseDTO,
  AssignmentDetailDTO,
  AssignmentListDTO,
  AssignmentFilterDTO,
  AssignmentStudentSubmissionDTO,
} from "../dtos/assignment.dto";
import { PaginatedResponseDTO } from "../dtos/pagination.dto";
import { HttpException } from "../exceptions/HttpException";
import { Attempt } from "../entities/Attempt";

export class AssignmentService {
  private assignmentRepository: Repository<Assignment>;
  private attemptRepository: Repository<Attempt>;

  constructor() {
    this.assignmentRepository = AppDataSource.getRepository(Assignment);
    this.attemptRepository = AppDataSource.getRepository(Attempt);
  }

  async createAssignment(dto: CreateAssignmentDTO): Promise<AssignmentResponseDTO> {
    const assignment = this.assignmentRepository.create({
      classId: dto.classId,
      promptId: dto.promptId,
      title: dto.title,
      description: dto.description,
      deadline: dto.deadline,
      status: dto.status || AssignmentStatus.DRAFT,
      allowLateSubmission: dto.allowLateSubmission || false,
      lateDeadline: dto.lateDeadline,
    });

    const savedAssignment = await this.assignmentRepository.save(assignment);
    return this.mapToResponseDTO(savedAssignment);
  }

  async getAssignmentById(id: string, learnerId?: string): Promise<AssignmentDetailDTO> {
    try {
        const query = this.assignmentRepository
          .createQueryBuilder("assignment")
          .leftJoinAndSelect("assignment.class", "class")
          .leftJoinAndSelect("assignment.prompt", "prompt")
          .where("assignment.id = :id", { id });

        if (learnerId) {
          query.leftJoinAndSelect(
            "assignment.attempts",
            "attempt",
            "attempt.learnerId = :learnerId",
            { learnerId }
          );
        }

        const assignment = await query.getOne();

        if (!assignment) {
          console.error(`[AssignmentService] Assignment ${id} NOT FOUND`);
          throw new HttpException("Assignment not found", 404);
        }

        // Explicitly fetch the attempt to ensure relations load safely
        let myAttempt: Attempt | null = null;
        if (learnerId) {
            try {
                console.log(`[AssignmentService] Fetching attempt for Assignment: ${id}, Learner: ${learnerId}`);
                
                // Fetch ALL potential candidates: Linked to Assignment OR Linked to Prompt (orphaned)
                const candidates = await this.attemptRepository.find({
                   where: [
                       { assignment: { id: id }, learnerId: learnerId },
                       { prompt: { id: assignment.promptId }, learnerId: learnerId }
                   ],
                   relations: ['score', 'feedbacks', 'assignment', 'prompt']
                });

                if (candidates.length > 0) {
                     // Rank candidates to find the "best" one
                     const statusWeight = {
                         [AttemptStatus.SCORED]: 3,
                         [AttemptStatus.SUBMITTED]: 2,
                         [AttemptStatus.IN_PROGRESS]: 1
                     };

                     candidates.sort((a, b) => {
                         const weightA = statusWeight[a.status] || 0;
                         const weightB = statusWeight[b.status] || 0;
                         if (weightA !== weightB) return weightB - weightA; // Higher weight first
                         
                         // Tie-breaker: Recency
                         // Use submittedAt, scoredAt, startedAt, or createdAt
                         const dateA = new Date(a.scoredAt || a.submittedAt || a.startedAt || a.createdAt).getTime();
                         const dateB = new Date(b.scoredAt || b.submittedAt || b.startedAt || b.createdAt).getTime();
                         return dateB - dateA; // Newer first
                     });
                     
                     myAttempt = candidates[0];
                     console.log(`[AssignmentService] Selected best attempt: ${myAttempt.id} (Status: ${myAttempt.status}, Linked: ${!!myAttempt.assignment})`);
                     
                     // Self-healing: If the best attempt is orphaned, link it now
                     if (!myAttempt.assignment) {
                         console.log(`[AssignmentService] Self-healing: Linking attempt ${myAttempt.id} to assignment ${id}`);
                         // Cast to any to avoid partial update issues if strict typing complains
                         await this.attemptRepository.update(myAttempt.id, { assignment: { id: id } } as any);
                     }
                } else {
                    console.log(`[AssignmentService] No attempts found.`);
                }
            } catch (attemptError) {
                console.error(`[AssignmentService] Failed to fetch attempt:`, attemptError);
                // Don't fail the whole request if attempt fetch fails, just log it
            }
        }

        return {
          ...this.mapToDetailDTO(assignment),
          attemptId: myAttempt?.id,
          submissionStatus: myAttempt?.status,
          score: myAttempt?.score?.overallBand,
          feedback: myAttempt?.score?.feedback,
        };
    } catch (error) {
        console.error(`[AssignmentService] Error in getAssignmentById:`, error);
        throw error;
    }
  }

  async getAllAssignments(limit: number = 10, offset: number = 0): Promise<PaginatedResponseDTO<AssignmentListDTO>> {
    const [data, total] = await this.assignmentRepository.findAndCount({
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

  async getAssignmentsByClass(
    classId: string,
    limit: number = 10,
    offset: number = 0
  ): Promise<PaginatedResponseDTO<AssignmentListDTO>> {
    const [data, total] = await this.assignmentRepository.findAndCount({
      where: { classId },
      skip: offset,
      take: limit,
      order: { deadline: "ASC" },
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

  async getAssignmentsByStatus(
    status: AssignmentStatus,
    limit: number = 10,
    offset: number = 0
  ): Promise<PaginatedResponseDTO<AssignmentListDTO>> {
    const [data, total] = await this.assignmentRepository.findAndCount({
      where: { status },
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

  async getLearnerAssignments(
    learnerId: string,
    limit: number = 10,
    offset: number = 0
  ): Promise<PaginatedResponseDTO<AssignmentListDTO>> {
    console.log(`[DEBUG] getLearnerAssignments called for learnerId: ${learnerId}`);
    const query = this.assignmentRepository
        .createQueryBuilder("assignment")
        .innerJoinAndSelect("assignment.class", "class")
        .leftJoinAndSelect("assignment.prompt", "prompt")
        .innerJoin("class.learners", "learner")
        .where("learner.id = :learnerId", { learnerId })
        .orderBy("assignment.deadline", "ASC")
        .skip(offset)
        .take(limit);

    const [assignments, total] = await query.getManyAndCount();
    console.log(`[DEBUG] Found ${total} assignments for learner ${learnerId}`);

    // Fetch attempts separately to avoid join issues
    let attemptMap = new Map<string, Attempt>();
    if (assignments.length > 0) {
        const assignmentIds = assignments.map(a => a.id);
        const promptIds = assignments.map(a => a.promptId).filter(id => !!id);

        const attempts = await this.attemptRepository.find({
            where: [
                {
                    learnerId: learnerId,
                    assignment: { id: In(assignmentIds) }
                },
                {
                    learnerId: learnerId,
                    prompt: { id: In(promptIds) }
                }
            ],
            relations: ['assignment', 'prompt', 'score']
        });
        
        // Map attempts to assignments
        const statusWeight = {
             [AttemptStatus.SCORED]: 3,
             [AttemptStatus.SUBMITTED]: 2,
             [AttemptStatus.IN_PROGRESS]: 1
        };

        for (const assignment of assignments) {
             // Find all candidates for this assignment
             const candidates = attempts.filter(a => {
                 const isLinked = a.assignment?.id === assignment.id;
                 const isCompatibleOrphan = a.prompt?.id === assignment.promptId && (!a.assignment || a.assignment.id === assignment.id);
                 return isLinked || isCompatibleOrphan;
             });

             if (candidates.length > 0) {
                 console.log(`[DEBUG] Found ${candidates.length} candidates for Assignment ${assignment.title} (${assignment.id})`);
                 candidates.forEach(c => console.log(` - Candidate: ${c.id} Status: ${c.status} Created: ${c.createdAt} Scored: ${c.scoredAt}`));
                 candidates.sort((a, b) => {
                     // 1. Status Priority
                     const weightA = statusWeight[a.status] || 0;
                     const weightB = statusWeight[b.status] || 0;
                     if (weightA !== weightB) return weightB - weightA;
                     
                     // 2. Recency
                     const dateA = new Date(a.scoredAt || a.submittedAt || a.startedAt || a.createdAt).getTime();
                     const dateB = new Date(b.scoredAt || b.submittedAt || b.startedAt || b.createdAt).getTime();
                     return dateB - dateA;
                 });

                 const bestAttempt = candidates[0];
                 console.log(`[DEBUG] Selected Best Attempt for ${assignment.title}: ${bestAttempt.id} (Status: ${bestAttempt.status})`);
                 attemptMap.set(assignment.id, bestAttempt);
                 
              
             }
        }
    }

    return {
        data: assignments.map((a) => {
        const myAttempt = attemptMap.get(a.id); 
        return {
            ...this.mapToListDTO(a),
            submissionStatus: myAttempt?.status,
            score: myAttempt?.score?.overallBand,
            attemptId: myAttempt?.id
        };
        }),
        pagination: {
        limit,
        offset,
        total,
        },
    };
  }

  async getTeacherAssignments(
    teacherId: string,
    limit: number = 10,
    offset: number = 0
  ): Promise<PaginatedResponseDTO<AssignmentListDTO>> {
    const [data, total] = await this.assignmentRepository.findAndCount({
      where: {
        class: {
          teacherId: teacherId
        }
      },
      relations: ["class", "prompt"],
      order: {
        deadline: "ASC"
      },
      skip: offset,
      take: limit
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

  async getAssignmentsByFilter(filter: AssignmentFilterDTO): Promise<PaginatedResponseDTO<AssignmentListDTO>> {
    const query = this.assignmentRepository.createQueryBuilder("a");

    if (filter.classId) {
      query.andWhere("a.classId = :classId", { classId: filter.classId });
    }

    if (filter.status) {
      query.andWhere("a.status = :status", { status: filter.status });
    }

    if (filter.startDate && filter.endDate) {
      query.andWhere("a.deadline BETWEEN :startDate AND :endDate", {
        startDate: filter.startDate,
        endDate: filter.endDate,
      });
    }

    const total = await query.getCount();
    const data = await query
      .skip(filter.offset || 0)
      .take(filter.limit || 10)
      .orderBy("a.deadline", "ASC")
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

  async updateAssignment(id: string, dto: UpdateAssignmentDTO): Promise<AssignmentResponseDTO> {
    const assignment = await this.assignmentRepository.findOne({
      where: { id },
    });

    if (!assignment) {
      throw new HttpException("Assignment not found", 404);
    }

    Object.assign(assignment, dto);
    const updated = await this.assignmentRepository.save(assignment);

    return this.mapToResponseDTO(updated);
  }

  async updateAssignmentStatus(id: string, status: AssignmentStatus): Promise<AssignmentResponseDTO> {
    const assignment = await this.assignmentRepository.findOne({
      where: { id },
    });

    if (!assignment) {
      throw new HttpException("Assignment not found", 404);
    }

    assignment.status = status;
    const updated = await this.assignmentRepository.save(assignment);

    return this.mapToResponseDTO(updated);
  }

  async getStudentSubmissions(assignmentId: string): Promise<AssignmentStudentSubmissionDTO[]> {
    const assignment = await this.assignmentRepository.findOne({
      where: { id: assignmentId },
      relations: ["class"],
    });

    if (!assignment) {
      throw new HttpException("Assignment not found", 404);
    }

    // Get all attempts for this assignment (via prompt or assignment link)
    const attempts = await this.attemptRepository.find({
      where: [
          { assignment: { id: assignmentId } },
          { prompt: { id: assignment.promptId } }
      ],
      relations: ["learner", "score", "assignment"],
    });

    
    const validAttempts = attempts.filter(a => !!a.learner);

    return validAttempts.map((attempt) => ({
      learnerId: attempt.learnerId,
      learnerEmail: attempt.learner?.email || "",
      learnerName: (attempt.learner?.firstName && attempt.learner?.lastName) 
        ? `${attempt.learner.firstName} ${attempt.learner.lastName}` 
        : (attempt.learner?.firstName || attempt.learner?.lastName || attempt.learner?.email?.split("@")[0]),
      status: attempt.status,
      submittedAt: attempt.submittedAt,
      score: attempt.score?.overallBand,
      attemptId: attempt.id,
    }));
  }

  async deleteAssignment(id: string): Promise<void> {
    const assignment = await this.assignmentRepository.findOne({
      where: { id },
    });

    if (!assignment) {
      throw new HttpException("Assignment not found", 404);
    }

    await this.assignmentRepository.remove(assignment);
  }

  // Helper methods

  private mapToResponseDTO(assignment: Assignment): AssignmentResponseDTO {
    return {
      id: assignment.id,
      classId: assignment.classId,
      promptId: assignment.promptId,
      title: assignment.title,
      description: assignment.description,
      deadline: assignment.deadline,
      status: assignment.status,
      totalEnrolled: assignment.totalEnrolled,
      totalSubmitted: assignment.totalSubmitted,
      totalScored: assignment.totalScored,
      averageScore: Number(assignment.averageScore),
      allowLateSubmission: assignment.allowLateSubmission,
      lateDeadline: assignment.lateDeadline,
      createdAt: assignment.createdAt,
      updatedAt: assignment.updatedAt,
    };
  }

  private mapToDetailDTO(assignment: Assignment): AssignmentDetailDTO {
    return {
      id: assignment.id,
      classId: assignment.classId,
      promptId: assignment.promptId,
      title: assignment.title,
      description: assignment.description,
      deadline: assignment.deadline,
      status: assignment.status,
      totalEnrolled: assignment.totalEnrolled,
      totalSubmitted: assignment.totalSubmitted,
      totalScored: assignment.totalScored,
      averageScore: Number(assignment.averageScore),
      allowLateSubmission: assignment.allowLateSubmission,
      lateDeadline: assignment.lateDeadline,
      createdAt: assignment.createdAt,
      updatedAt: assignment.updatedAt,
      class: assignment.class
        ? {
            id: assignment.class.id,
            name: assignment.class.name,
          }
        : undefined,
      prompt: assignment.prompt
        ? {
            id: assignment.prompt.id,
            title: assignment.prompt.content.substring(0, 100),
            content: assignment.prompt.content,
            skillType: assignment.prompt.skillType,
          }
        : undefined,
    };
  }

  private mapToListDTO(assignment: Assignment): AssignmentListDTO {
    return {
      id: assignment.id,
      title: assignment.title,
      deadline: assignment.deadline,
      status: assignment.status,
      totalSubmitted: assignment.totalSubmitted,
      totalScored: assignment.totalScored,
      totalEnrolled: assignment.totalEnrolled,
      averageScore: Number(assignment.averageScore),
      className: assignment.class?.name,
      type: assignment.prompt?.skillType,
    };
  }

  async updateAssignmentStats(assignmentId: string): Promise<void> {
    const assignment = await this.assignmentRepository.findOne({
      where: { id: assignmentId },
      relations: ["class", "class.learners"],
    });

    if (!assignment) return;

    // Update totalEnrolled based on CURRENT class roster (excludes deleted users)
    const enrolledLearners = assignment.class?.learners || [];
    const enrolledLearnerIds = new Set(enrolledLearners.map(l => l.id));
    const totalEnrolled = enrolledLearners.length;

    // Count submitted and scored attempts
    // Fetch attempts linked to Assignment OR Prompt
    const attempts = await this.attemptRepository.find({
      where: [
          { assignment: { id: assignmentId } },
          { prompt: { id: assignment.promptId } }
      ],
      relations: ["score", "learner", "assignment"], 
    });

    // Cleanup logic: 
    // 1. Remove truly orphaned attempts (no learner) if linked to assignment
    const orphans = attempts.filter(a => !a.learner && a.assignment?.id === assignmentId);
    if (orphans.length > 0) {
        await this.attemptRepository.remove(orphans);
    }

    // Filter valid attempts provided by ENROLLED learners or explicitly linked attempts with valid learners
    const validAttempts = attempts.filter(a => {
        if (!a.learner) return false;
        // Check if learner is enrolled
        return enrolledLearnerIds.has(a.learner.id);
    });

    const totalSubmitted = validAttempts.filter(
      (a) =>
        a.status === AttemptStatus.SUBMITTED || a.status === AttemptStatus.SCORED
    ).length;
    
    const totalScored = validAttempts.filter(
      (a) => a.status === AttemptStatus.SCORED
    ).length;

    // Calculate Average Score
    const scoredAttempts = validAttempts.filter(a => a.status === AttemptStatus.SCORED && a.score?.overallBand);
    const totalScoreVal = scoredAttempts.reduce((sum, a) => sum + Number(a.score!.overallBand), 0);
    const averageScore = scoredAttempts.length > 0 ? totalScoreVal / scoredAttempts.length : 0;

    await this.assignmentRepository.update(assignmentId, {
      totalEnrolled,
      totalSubmitted,
      totalScored,
      averageScore
    });
  }

  async updateClassAssignmentsStats(classId: string): Promise<void> {
    const assignments = await this.assignmentRepository.find({
      where: { classId },
      select: ["id"]
    });

    for (const assignment of assignments) {
        await this.updateAssignmentStats(assignment.id);
    }
  }
}

export const assignmentService = new AssignmentService();
