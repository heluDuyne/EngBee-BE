import { AppDataSource } from "../data-source";
import { In, IsNull, Brackets } from "typeorm";
import {
  CreateAttemptDTO,
  UpdateAttemptDTO,
  SubmitAttemptDTO,
  AttemptResponseDTO,
  AttemptListDTO,
  AttemptReviewDTO,
  AttemptDetailDTO,
  AttemptFilterDTO,
  GradeAttemptDTO,
} from "../dtos/attempt.dto";
import { Attempt } from "../entities/Attempt";
import { AttemptStatus, SkillType } from "../enums";
import { Prompt } from "../entities/Prompt";
import { User } from "../entities/User";
import { Score } from "../entities/Score";
import { createPaginatedResponse } from "../utils/pagination.utils";
import { PaginatedResponseDTO } from "../dtos/pagination.dto";
import { langchainService } from "./langchain.service";
import { aiRuleService } from "./ai-rule.service";
import { NotFoundException, InternalServerErrorException, BadRequestException } from "../exceptions/HttpException";
import { assignmentService } from "./assignment.service";
import { geminiService } from "./gemini.service";

export class AttemptService {
  private attemptRepository = AppDataSource.getRepository(Attempt);
  private userRepository = AppDataSource.getRepository(User);
  private promptRepository = AppDataSource.getRepository(Prompt);
  private scoreRepository = AppDataSource.getRepository(Score);

  // Create attempt
  async createAttempt(dto: CreateAttemptDTO): Promise<AttemptResponseDTO> {
    // Check if learner exists
    const learner = await this.userRepository.findOne({ where: { id: dto.learnerId } });
    if (!learner) {
      throw new NotFoundException(`Learner with ID '${dto.learnerId}' not found`);
    }

    // Check if prompt exists
    const prompt = await this.promptRepository.findOne({ where: { id: dto.promptId } });
    if (!prompt) {
      throw new NotFoundException(`Prompt with ID '${dto.promptId}' not found`);
    }

    // Check for existing attempt
    const existingAttempt = await this.attemptRepository.findOne({
        where: {
            learnerId: dto.learnerId,
            assignment: dto.assignmentId ? { id: dto.assignmentId } : undefined,
            prompt: { id: dto.promptId }
        },
        relations: ['score', 'feedbacks', 'assignment', 'prompt']
    });

    if (existingAttempt) {
        return this.mapToResponseDTO(existingAttempt);
    }
    
    // Fallback: If strict match failed but assignmentId is provided, try to find an orphaned attempt for this prompt
    if (dto.assignmentId) {
         const orphanedAttempt = await this.attemptRepository.findOne({
             where: {
                 learnerId: dto.learnerId,
                 prompt: { id: dto.promptId },
                 assignment: IsNull()
             },
             relations: ['score', 'feedbacks', 'assignment', 'prompt']
         });
         
         if (orphanedAttempt) {
             console.log(`[AttemptService] Found orphaned attempt ${orphanedAttempt.id}. Linking to assignment ${dto.assignmentId}`);
             orphanedAttempt.assignment = { id: dto.assignmentId } as any; // Cast to avoid type issues with partial
             await this.attemptRepository.save(orphanedAttempt);
             return this.mapToResponseDTO(orphanedAttempt);
         }
    }

    const attempt = this.attemptRepository.create({
      learnerId: dto.learnerId,
      learner: { id: dto.learnerId }, // Explicitly link relation
      promptId: dto.promptId,
      prompt: { id: dto.promptId }, // Explicitly link relation
      assignment: dto.assignmentId ? { id: dto.assignmentId } : undefined,
      skillType: dto.skillType,
      status: AttemptStatus.IN_PROGRESS,
      startedAt: new Date(),
    });

    const saved = await this.attemptRepository.save(attempt);

    if (saved.assignment) {
         // Use the ID from the relation or DTO
         const assignmentId = saved.assignment.id || dto.assignmentId;
         if (assignmentId) {
             await assignmentService.updateAssignmentStats(assignmentId);
         }
    }
    
    return this.mapToResponseDTO(saved);
  }

  // Get attempt by ID
  async getAttemptById(id: string): Promise<AttemptDetailDTO> {
    const attempt = await this.attemptRepository.findOne({
      where: { id },
      relations: ["prompt", "media", "score", "feedbacks", "feedbacks.author", "learner", "assignment", "assignment.class"],
    });
    if (!attempt) {
      throw new NotFoundException(`Attempt with ID '${id}' not found`);
    }
    console.log(`[DEBUG] getAttemptById ${id} - Content length: ${attempt.content?.length}, Score: ${attempt.score?.id}`);
    if (attempt.score) {
        console.log(`[DEBUG] Score details:`, JSON.stringify(attempt.score));
    }
    return this.mapToDetailDTO(attempt);
  }

  // ... (lines skipped)



  // Get all attempts
  async getAllAttempts(limit: number = 10, offset: number = 0): Promise<PaginatedResponseDTO<AttemptListDTO>> {
    const [attempts, total] = await this.attemptRepository.findAndCount({
      take: limit,
      skip: offset,
    });
    return createPaginatedResponse(
      attempts.map((a) => this.mapToListDTO(a)),
      total,
      limit,
      offset
    );
  }

  // Get attempts by learner
  async getAttemptsByLearner(learnerId: string, limit: number = 10, offset: number = 0): Promise<PaginatedResponseDTO<AttemptListDTO>> {
    const [attempts, total] = await this.attemptRepository.findAndCount({
      where: { learnerId },
      relations: ["assignment", "prompt", "score"],
      order: { createdAt: "DESC" },
      take: limit,
      skip: offset,
    });
    return createPaginatedResponse(
      attempts.map((a) => this.mapToListDTO(a)),
      total,
      limit,
      offset
    );
  }

  // Get attempts by learner and status
  async getAttemptsByLearnerAndStatus(
    learnerId: string,
    status: AttemptStatus,
    limit: number = 10,
    offset: number = 0
  ): Promise<PaginatedResponseDTO<AttemptListDTO>> {
    const [attempts, total] = await this.attemptRepository.findAndCount({
      where: { learnerId, status },
      take: limit,
      skip: offset,
    });
    return createPaginatedResponse(
      attempts.map((a) => this.mapToListDTO(a)),
      total,
      limit,
      offset
    );
  }

  // Get attempts by prompt
  async getAttemptsByPrompt(promptId: string, limit: number = 10, offset: number = 0): Promise<PaginatedResponseDTO<AttemptListDTO>> {
    const [attempts, total] = await this.attemptRepository.findAndCount({
      where: { promptId },
      take: limit,
      skip: offset,
    });
    return createPaginatedResponse(
      attempts.map((a) => this.mapToListDTO(a)),
      total,
      limit,
      offset
    );
  }

  // Get attempts by status
  async getAttemptsByStatus(status: AttemptStatus, limit: number = 10, offset: number = 0): Promise<PaginatedResponseDTO<AttemptListDTO>> {
    const [attempts, total] = await this.attemptRepository.findAndCount({
      where: { status },
      take: limit,
      skip: offset,
    });
    return createPaginatedResponse(
      attempts.map((a) => this.mapToListDTO(a)),
      total,
      limit,
      offset
    );
  }

  // Get attempts by skill type
  async getAttemptsBySkillType(skillType: SkillType, limit: number = 10, offset: number = 0): Promise<PaginatedResponseDTO<AttemptListDTO>> {
    const [attempts, total] = await this.attemptRepository.findAndCount({
      where: { skillType },
      take: limit,
      skip: offset,
    });
    return createPaginatedResponse(
      attempts.map((a) => this.mapToListDTO(a)),
      total,
      limit,
      offset
    );
  }

  // Get attempts with filter
  async getAttemptsByFilter(learnerId: string, filter: AttemptFilterDTO): Promise<PaginatedResponseDTO<AttemptListDTO>> {
    const limit = filter.limit || 10;
    const offset = filter.offset || 0;

    if (filter.status) {
      return this.getAttemptsByLearnerAndStatus(learnerId, filter.status, limit, offset);
    }

    return this.getAttemptsByLearner(learnerId, limit, offset);
  }

  // Get pending attempts for a teacher's classes
  async getTeacherPendingAttempts(
    teacherId: string,
    limit: number = 10,
    offset: number = 0
  ): Promise<PaginatedResponseDTO<AttemptReviewDTO>> {
    console.log(`[AttemptService] getTeacherPendingAttempts for teacher ${teacherId}`);
    
    // Use QueryBuilder to handle complex OR logic with relations
    const builder = this.attemptRepository.createQueryBuilder("attempt")
      .leftJoinAndSelect("attempt.assignment", "assignment")
      .leftJoinAndSelect("assignment.class", "class")
      .leftJoinAndSelect("attempt.learner", "learner")
      .leftJoinAndSelect("attempt.prompt", "prompt")
      .leftJoinAndSelect("attempt.score", "score")
      .where("class.teacherId = :teacherId", { teacherId })
      .andWhere(new Brackets(qb => {
        // Include SUBMITTED (waiting for ANY grading)
        qb.where("attempt.status = :submitted", { submitted: AttemptStatus.SUBMITTED })
          // OR SCORED (AI graded) but NOT "gradedByTeacher"
          .orWhere(new Brackets(subQb => {
              subQb.where("attempt.status = :scored", { scored: AttemptStatus.SCORED })
                   .andWhere("score.detailedFeedback ->> 'gradedByTeacher' IS DISTINCT FROM 'true'");
          }));
      }))
      .orderBy("attempt.submittedAt", "DESC")
      .take(limit)
      .skip(offset);

    const [attempts, total] = await builder.getManyAndCount();
    
    console.log(`[AttemptService] Found ${total} pending assignments for teacher ${teacherId}`);

    return createPaginatedResponse(
      attempts.map((a) => {
        const studentName = a.learner?.firstName || a.learner?.lastName
          ? `${a.learner.firstName || ''} ${a.learner.lastName || ''}`.trim()
          : a.learner?.email || "Unknown Student";

        const assignmentTitle = a.assignment?.title 
          ? a.assignment.title 
          : (a.prompt?.content ? a.prompt.content.substring(0, 30) + "..." : "Untitled Task");

        return {
          ...this.mapToListDTO(a),
          studentName,
          studentEmail: a.learner?.email,
          className: a.assignment?.class?.name || "Unknown Class",
          assignmentId: a.assignment?.id,
          classId: a.assignment?.class?.id,
          assignmentTitle
        };
      }),
      total,
      limit,
      offset
    );
  }

  // Update attempt
  async updateAttempt(id: string, dto: UpdateAttemptDTO): Promise<AttemptResponseDTO> {
    const attempt = await this.attemptRepository.findOne({ where: { id } });
    if (!attempt) {
      throw new NotFoundException(`Attempt with ID '${id}' not found`);
    }

    await this.attemptRepository.update(id, dto);
    const updated = await this.attemptRepository.findOne({ where: { id } });
    if (!updated) {
      throw new InternalServerErrorException(`Failed to update attempt with ID '${id}'`);
    }

    return this.mapToResponseDTO(updated);
  }

  // Submit attempt
  async submitAttempt(id: string, dto: SubmitAttemptDTO): Promise<AttemptResponseDTO> {
    const attempt = await this.attemptRepository.findOne({
      where: { id },

      relations: ["prompt", "assignment"],
    });
    if (!attempt) {
      throw new NotFoundException(`Attempt with ID '${id}' not found`);
    }

    if (attempt.status === AttemptStatus.SUBMITTED || attempt.status === AttemptStatus.SCORED) {
      throw new BadRequestException("Attempt has already been submitted. Cannot modify");
    }

    // Update attempt status to SUBMITTED
    // Resolve content from DTO or fallback to existing content
    // Debug Logging
    console.log(`[AttemptService.submitAttempt] ID: ${id}`);
    console.log(`[AttemptService.submitAttempt] DTO Content: ${dto.content ? dto.content.substring(0, 50) + "..." : "undefined"}`);
    console.log(`[AttemptService.submitAttempt] DTO ResponseText: ${dto.responseText ? dto.responseText.substring(0, 50) + "..." : "undefined"}`);
    
    const content = dto.content || dto.responseText || attempt.content || "";
    console.log(`[AttemptService.submitAttempt] Final Content to Save: ${content ? content.substring(0, 50) + "..." : "EMPTY STRING"}`);

    // Use save() instead of update() for better reliability and return value
    attempt.status = AttemptStatus.SUBMITTED;
    attempt.submittedAt = new Date();
    attempt.content = content;

    const savedAttempt = await this.attemptRepository.save(attempt);

    // Fire-and-forget AI evaluation
    // Pass 'savedAttempt' content to be sure
    this.handleAIEvaluation(id, attempt.skillType, savedAttempt.content || "", attempt.assignment, attempt.prompt).catch(err => {
        console.error(`[Background] AI Evaluation failed for attempt ${id}:`, err);
    });

    // Return the saved attempt directly
    return this.mapToResponseDTO(savedAttempt);
  }

  // Helper for async AI evaluation
  private async handleAIEvaluation(attemptId: string, skillType: SkillType, content: string, assignment?: any, prompt?: any) {
    if (skillType === 'speaking' && content.startsWith("http")) {
       try {
          console.log(`Evaluating audio with Gemini for attempt ${attemptId}: ${content}`);
          
          const description = assignment?.description ? `Context: ${assignment.description}\n` : "";
          const promptContent = prompt?.content || "No prompt provided";
          const fullContext = `${description}Topic: ${promptContent}`;

          const scoreResponse = await geminiService.evaluateAudio(content, fullContext);
          console.log("Gemini Response:", JSON.stringify(scoreResponse, null, 2));

          const score = this.scoreRepository.create({
              attemptId: attemptId,
              fluency: scoreResponse.fluency,
              coherence: scoreResponse.coherence,
              lexical: scoreResponse.lexical,
              grammar: scoreResponse.grammar,
              pronunciation: scoreResponse.pronunciation,
              overallBand: scoreResponse.overallBand,
              feedback: scoreResponse.feedback.issues + "\n\n" + scoreResponse.feedback.actions,
              detailedFeedback: {
                  ...scoreResponse.feedback,
                  transcript: scoreResponse.transcript,
                  aiScores: {
                      fluency: scoreResponse.fluency,
                      pronunciation: scoreResponse.pronunciation,
                      lexical: scoreResponse.lexical,
                      grammar: scoreResponse.grammar
                  }
              }
          });
          await this.scoreRepository.save(score);

          await this.attemptRepository.update(attemptId, {
              status: AttemptStatus.SCORED,
              scoredAt: new Date()
          });
          console.log(`Attempt ${attemptId} automatically scored by Gemini (Speaking)`);
          
          // Update stats
          if (assignment?.id) await assignmentService.updateAssignmentStats(assignment.id);

       } catch (error) {
           console.error("Gemini evaluation failed", error);
       }
    } else if (skillType === SkillType.WRITING && content) {
       try {
          console.log(`Evaluating writing with Gemini for attempt ${attemptId}`);
          
          const description = assignment?.description ? `Context: ${assignment.description}\n` : "";
          const promptContent = prompt?.content || "No prompt provided";
          const fullContext = `${description}Topic: ${promptContent}`;
          
          const scoreResponse = await geminiService.evaluateWriting(content, fullContext);
          
          const score = this.scoreRepository.create({
              attemptId: attemptId,
              taskResponse: scoreResponse.taskResponse,
              coherence: scoreResponse.coherence,
              lexical: scoreResponse.lexical,
              grammar: scoreResponse.grammar,
              overallBand: scoreResponse.overallBand,
              feedback: scoreResponse.feedback.issues + "\n\n" + scoreResponse.feedback.actions,
              detailedFeedback: {
                  ...scoreResponse.feedback,
                  aiScores: {
                      taskResponse: scoreResponse.taskResponse,
                      coherence: scoreResponse.coherence,
                      lexical: scoreResponse.lexical,
                      grammar: scoreResponse.grammar
                  }
              }
          });
          await this.scoreRepository.save(score);

          await this.attemptRepository.update(attemptId, {
              status: AttemptStatus.SCORED,
              scoredAt: new Date()
          });
          console.log(`Attempt ${attemptId} automatically scored by Gemini (Writing)`);
          
          // Update stats
          if (assignment?.id) await assignmentService.updateAssignmentStats(assignment.id);

       } catch (error) {
           console.error("Gemini writing evaluation failed", error);
       }
    }
  }

  // Grade attempt (Teacher)
  async gradeAttempt(id: string, dto: GradeAttemptDTO): Promise<AttemptResponseDTO> {
    const attempt = await this.attemptRepository.findOne({
      where: { id },
      relations: ["assignment"],
    });

    if (!attempt) {
      throw new NotFoundException(`Attempt with ID '${id}' not found`);
    }

    // Upsert Score
    let scoreEntity = await this.scoreRepository.findOne({ where: { attemptId: id } });
    
    if (scoreEntity) {
        if (dto.fluency !== undefined) scoreEntity.fluency = dto.fluency;
        if (dto.pronunciation !== undefined) scoreEntity.pronunciation = dto.pronunciation;
        if (dto.lexical !== undefined) scoreEntity.lexical = dto.lexical;
        if (dto.grammar !== undefined) scoreEntity.grammar = dto.grammar;
        if (dto.coherence !== undefined) scoreEntity.coherence = dto.coherence;
        if (dto.taskResponse !== undefined) scoreEntity.taskResponse = dto.taskResponse;
        
        scoreEntity.overallBand = dto.score;
        scoreEntity.feedback = dto.feedback;
        scoreEntity.detailedFeedback = {
            ...scoreEntity.detailedFeedback,
            gradedByTeacher: true
        };
    } else {
        scoreEntity = this.scoreRepository.create({
            attemptId: id,
            overallBand: dto.score,
            feedback: dto.feedback,
            fluency: dto.fluency ?? dto.score,
            pronunciation: dto.pronunciation ?? dto.score,
            lexical: dto.lexical ?? dto.score,
            grammar: dto.grammar ?? dto.score,
            coherence: dto.coherence ?? dto.score,
            taskResponse: dto.taskResponse ?? dto.score,
            detailedFeedback: { 
                note: "Manually graded by teacher",
                gradedByTeacher: true 
            }
        });
    }
    
    await this.scoreRepository.save(scoreEntity);

    // Update attempt status
    await this.attemptRepository.update(id, {
        status: AttemptStatus.SCORED,
        scoredAt: new Date(),
    });

    if (attempt.assignment) {
        await assignmentService.updateAssignmentStats(attempt.assignment.id);
    }
    
    // Return updated attempt
    const updated = await this.attemptRepository.findOne({ where: { id } });
    if (!updated) throw new InternalServerErrorException("Failed to retrieve updated attempt");
    
    return this.mapToResponseDTO(updated);
  }

  // Delete attempt
  async deleteAttempt(id: string): Promise<boolean> {
    const attempt = await this.attemptRepository.findOne({ where: { id } });
    if (!attempt) {
      throw new NotFoundException(`Attempt with ID '${id}' not found`);
    }
    const result = await this.attemptRepository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  // Get attempt statistics
  async getAttemptCountByLearner(learnerId: string): Promise<number> {
    return await this.attemptRepository.count({ where: { learnerId } });
  }

  async getSubmittedAttemptsCount(learnerId: string): Promise<number> {
    return await this.attemptRepository.count({
      where: { learnerId, status: AttemptStatus.SUBMITTED },
    });
  }

  async getScoredAttemptsCount(learnerId: string): Promise<number> {
    return await this.attemptRepository.count({
      where: { learnerId, status: AttemptStatus.SCORED },
    });
  }



  // Mappers
  private mapToResponseDTO(attempt: Attempt): AttemptResponseDTO {
    return {
      id: attempt.id,
      learnerId: attempt.learnerId,
      promptId: attempt.promptId,
      skillType: attempt.skillType,
      status: attempt.status,
      createdAt: attempt.createdAt,
      startedAt: attempt.startedAt,
      submittedAt: attempt.submittedAt,
      scoredAt: attempt.scoredAt,
      content: attempt.content,
    };
  }

  private mapToListDTO(attempt: Attempt): AttemptListDTO {
    return {
      id: attempt.id,
      promptId: attempt.promptId,
      skillType: attempt.skillType,
      status: attempt.status,
      createdAt: attempt.createdAt,
      submittedAt: attempt.submittedAt,
      deadline: attempt.assignment?.deadline,
      title: attempt.assignment?.title || attempt.prompt?.description || attempt.prompt?.content?.substring(0, 30) || "Untitled Task",
      score: attempt.score ? {
          id: attempt.score.id,
          fluency: attempt.score.fluency !== null ? Number(attempt.score.fluency) : undefined,
          pronunciation: attempt.score.pronunciation !== null ? Number(attempt.score.pronunciation) : undefined,
          lexical: Number(attempt.score.lexical),
          grammar: Number(attempt.score.grammar),
          coherence: Number(attempt.score.coherence),
          taskResponse: attempt.score.taskResponse !== null ? Number(attempt.score.taskResponse) : undefined,
          overallBand: attempt.score.overallBand,
          feedback: attempt.score.feedback,
      } : undefined
    };
  }

  private mapToDetailDTO(attempt: Attempt): AttemptDetailDTO {
    return {
      id: attempt.id,
      learnerId: attempt.learnerId,
      promptId: attempt.promptId,
      skillType: attempt.skillType,
      status: attempt.status,
      createdAt: attempt.createdAt,
      startedAt: attempt.startedAt,
      submittedAt: attempt.submittedAt,
      scoredAt: attempt.scoredAt,
      content: attempt.content,
      promptContent: attempt.prompt?.content,
      promptDifficulty: attempt.prompt?.difficulty,
      media: attempt.media?.map((m) => ({
        id: m.id,
        mediaType: m.mediaType,
        storageUrl: m.storageUrl,
        fileName: m.fileName,
        duration: m.duration,
        fileSize: m.fileSize,
        mimeType: m.mimeType,
        uploadedAt: m.uploadedAt,
      })),
      score: attempt.score
        ? {
            id: attempt.score.id,
            fluency: attempt.score.fluency !== null ? Number(attempt.score.fluency) : undefined,
            pronunciation: attempt.score.pronunciation !== null ? Number(attempt.score.pronunciation) : undefined,
            lexical: Number(attempt.score.lexical),
            grammar: Number(attempt.score.grammar),
            coherence: Number(attempt.score.coherence),
            taskResponse: attempt.score.taskResponse !== null ? Number(attempt.score.taskResponse) : undefined,
            overallBand: attempt.score.overallBand,
            feedback: attempt.score.feedback,
            detailedFeedback: attempt.score.detailedFeedback,
          }
        : undefined,
      feedbacks: attempt.feedbacks?.map((f) => ({
        id: f.id,
        type: f.type,
        content: f.content,
        visibility: f.visibility,
        authorEmail: f.author?.email,
        createdAt: f.createdAt,
      })),
      studentName: attempt.learner?.firstName || attempt.learner?.lastName
        ? `${attempt.learner.firstName || ''} ${attempt.learner.lastName || ''}`.trim()
        : attempt.learner?.email || "Unknown Student",
      studentEmail: attempt.learner?.email,
      assignmentTitle: attempt.assignment?.title || attempt.prompt?.content?.substring(0, 30) || "Untitled Task",
      assignmentDescription: attempt.assignment?.description,
      className: attempt.assignment?.class?.name,
    };
  }
}
