import { AppDataSource } from "../data-source";
import { Task } from "../entities/Task";
import { TaskAssignment } from "../entities/TaskAssignment";
import { TaskSubmission } from "../entities/TaskSubmission";
import { Course } from "../entities/Course";
import { Class } from "../entities/Class";
import { User } from "../entities/User";
import {
  CreateTaskDTO,
  AssignTaskDTO,
  SubmitTaskDTO,
  GradeTaskDTO,
  ReviewTaskDTO,
  TaskResponseDTO,
  LearnerTaskResponseDTO,
} from "../dtos/task.dto";
import { BadRequestException, NotFoundException, ForbiddenException } from "../exceptions/HttpException";
import { AssigneeType, TaskSubmissionStatus, TaskStatus, NotificationType, UserRole, SkillType } from "../enums";
import { NotificationService } from "./notification.service";
import { geminiService } from "./gemini.service";

export class TaskService {
  private taskRepository = AppDataSource.getRepository(Task);
  private assignmentRepository = AppDataSource.getRepository(TaskAssignment);
  private submissionRepository = AppDataSource.getRepository(TaskSubmission);
  private courseRepository = AppDataSource.getRepository(Course);
  private classRepository = AppDataSource.getRepository(Class);
  private userRepository = AppDataSource.getRepository(User);
  private notificationService = new NotificationService();

  async createTask(creatorId: string, dto: CreateTaskDTO, isAdmin: boolean = false): Promise<TaskResponseDTO> {
    let course: Course | null = null;
    if (dto.courseId) {
      course = await this.courseRepository.findOne({ where: { id: dto.courseId } });
      if (!course) throw new NotFoundException("Course not found");
      if (!isAdmin && course.creatorId !== creatorId) throw new ForbiddenException("Not authorized");
    }

    const task = this.taskRepository.create({
      ...dto,
      creatorId,
    });
    
    if (course) {
      task.course = course;
    }
    
    if (dto.maxScore === undefined) {
      task.maxScore = (dto.type === SkillType.SPEAKING || dto.type === SkillType.WRITING) ? 9.0 : 100;
    }

    await this.taskRepository.save(task);

    if (dto.courseId) {
      const assignment = this.assignmentRepository.create({
        taskId: task.id,
        assigneeType: AssigneeType.COURSE,
        assigneeId: dto.courseId,
        dueDate: new Date(new Date().setFullYear(new Date().getFullYear() + 10)),
      });
      await this.assignmentRepository.save(assignment);

      // Notify enrolled students
      const courseWithStudents = await this.courseRepository.findOne({
        where: { id: dto.courseId },
        relations: ["enrolledStudents"]
      });
      if (courseWithStudents?.enrolledStudents) {
        courseWithStudents.enrolledStudents.forEach(student => {
          this.notificationService.createNotification({
            userId: student.id,
            title: "New Lesson Added",
            message: `A new lesson "${task.title}" has been added to the course "${courseWithStudents.title}".`,
            type: NotificationType.SYSTEM,
            link: `/course/${dto.courseId}`
          }).catch(console.error);
        });
      }
    }

    return this.mapToResponseDTO(task);
  }

  async updateTask(taskId: string, creatorId: string, dto: Partial<CreateTaskDTO>): Promise<TaskResponseDTO> {
    const task = await this.taskRepository.findOne({ where: { id: taskId } });
    if (!task) throw new NotFoundException("Task not found");
    if (task.creatorId !== creatorId) throw new ForbiddenException("Not authorized");
    if (task.status !== TaskStatus.DRAFT && task.status !== TaskStatus.REJECTED) {
      throw new BadRequestException("Only tasks in DRAFT or REJECTED state can be edited");
    }

    // Update fields
    if (dto.title !== undefined) task.title = dto.title;
    if (dto.description !== undefined) task.description = dto.description;
    if (dto.instructions !== undefined) task.instructions = dto.instructions;
    if (dto.type !== undefined) task.type = dto.type;
    if (dto.level !== undefined) task.level = dto.level;
    if (dto.skillFocus !== undefined) task.skillFocus = dto.skillFocus;
    if (dto.maxScore !== undefined) task.maxScore = dto.maxScore;
    if (dto.rubric !== undefined) task.rubric = dto.rubric;
    if (dto.readingText !== undefined) task.readingText = dto.readingText;
    if (dto.questions !== undefined) task.questions = dto.questions;

    await this.taskRepository.save(task);
    return this.mapToResponseDTO(task);
  }

  async getTeacherTasks(creatorId: string): Promise<TaskResponseDTO[]> {
    const tasks = await this.taskRepository.find({
      where: { creatorId },
      relations: ["assignments"],
      order: { createdAt: "DESC" },
    });
    return tasks.map(t => ({
      ...this.mapToResponseDTO(t),
      isAssigned: t.assignments && t.assignments.length > 0
    }));
  }

  async getAllTasks(status?: TaskStatus): Promise<TaskResponseDTO[]> {
    const whereCondition = status ? { status } : {};
    const tasks = await this.taskRepository.find({
      where: whereCondition,
      order: { createdAt: "DESC" },
    });
    return tasks.map(this.mapToResponseDTO);
  }

  async getTaskById(taskId: string): Promise<TaskResponseDTO> {
    const task = await this.taskRepository.findOne({ where: { id: taskId } });
    if (!task) throw new NotFoundException("Task not found");
    return this.mapToResponseDTO(task);
  }

  async getLearnerTasks(learnerId: string): Promise<LearnerTaskResponseDTO[]> {
    const user = await this.userRepository.findOne({
      where: { id: learnerId },
      relations: ["enrolledClasses", "enrolledCourses"],
    });
    if (!user) throw new NotFoundException("User not found");

    const classIds = user.enrolledClasses?.map((c) => c.id) || [];
    const courseIds = user.enrolledCourses?.map((c) => c.id) || [];

    const assignments = await this.assignmentRepository.find({
      where: [
        { assigneeType: AssigneeType.INDIVIDUAL, assigneeId: learnerId },
        ...(classIds.length > 0 ? classIds.map(id => ({ assigneeType: AssigneeType.CLASS, assigneeId: id })) : []),
        ...(courseIds.length > 0 ? courseIds.map(id => ({ assigneeType: AssigneeType.COURSE, assigneeId: id })) : []),
      ],
      relations: ["task"],
    });

    const validAssignments = assignments.filter((a) => a.task);

    const submissions = await this.submissionRepository.find({
      where: { learnerId },
    });

    return validAssignments.map((a) => {
      const submission = submissions.find(s => s.assignmentId === a.id);
      return {
        assignmentId: a.id,
        assigneeId: a.assigneeId,
        dueDate: a.dueDate,
        task: this.mapToResponseDTO(a.task),
        submitted: !!submission,
        submission: submission || undefined,
      };
    });
  }

  async submitForReview(taskId: string, creatorId: string): Promise<TaskResponseDTO> {
    const task = await this.taskRepository.findOne({ where: { id: taskId } });
    if (!task) throw new NotFoundException("Task not found");
    if (task.creatorId !== creatorId) throw new ForbiddenException("Not authorized");
    if (task.status !== TaskStatus.DRAFT && task.status !== TaskStatus.REJECTED) {
      throw new BadRequestException("Task must be in DRAFT or REJECTED state to submit for review");
    }

    task.status = TaskStatus.PENDING_APPROVAL;
    task.rejectionReason = undefined;
    await this.taskRepository.save(task);

    // Notify admins
    const admins = await this.userRepository.find({ where: { role: UserRole.ADMIN } });
    for (const admin of admins) {
      await this.notificationService.createNotification({
        userId: admin.id,
        title: "New Task Review Request",
        message: `Task "${task.title}" has been submitted for review.`,
        type: NotificationType.TASK_REVIEW,
      });
    }

    return this.mapToResponseDTO(task);
  }

  async reviewTask(taskId: string, dto: ReviewTaskDTO): Promise<TaskResponseDTO> {
    const task = await this.taskRepository.findOne({ where: { id: taskId } });
    if (!task) throw new NotFoundException("Task not found");
    if (task.status !== TaskStatus.PENDING_APPROVAL) {
      throw new BadRequestException("Task is not pending approval");
    }

    if (dto.status === TaskStatus.REJECTED && !dto.rejectionReason) {
      throw new BadRequestException("Rejection reason is required when rejecting a task");
    }

    task.status = dto.status;
    task.rejectionReason = dto.status === TaskStatus.REJECTED ? dto.rejectionReason : undefined;
    
    await this.taskRepository.save(task);

    // Notify teacher
    await this.notificationService.createNotification({
      userId: task.creatorId,
      title: dto.status === TaskStatus.APPROVED ? "Task Approved" : "Task Rejected",
      message: dto.status === TaskStatus.APPROVED 
        ? `Your task "${task.title}" has been approved.` 
        : `Your task "${task.title}" was rejected. Reason: ${dto.rejectionReason}`,
      type: NotificationType.TASK_APPROVAL,
    });

    return this.mapToResponseDTO(task);
  }

  async publishTask(taskId: string, creatorId: string): Promise<TaskResponseDTO> {
    const task = await this.taskRepository.findOne({ where: { id: taskId } });
    if (!task) throw new NotFoundException("Task not found");
    if (task.creatorId !== creatorId) throw new ForbiddenException("Not authorized");
    if (task.status !== TaskStatus.APPROVED) {
      throw new BadRequestException("Only approved tasks can be published");
    }

    task.status = TaskStatus.PUBLISHED;
    await this.taskRepository.save(task);
    return this.mapToResponseDTO(task);
  }

  async archiveTask(taskId: string): Promise<TaskResponseDTO> {
    const task = await this.taskRepository.findOne({ where: { id: taskId } });
    if (!task) throw new NotFoundException("Task not found");
    
    task.status = TaskStatus.ARCHIVED;
    await this.taskRepository.save(task);
    return this.mapToResponseDTO(task);
  }

  async assignTask(
    taskId: string,
    teacherId: string,
    dto: AssignTaskDTO
  ): Promise<TaskAssignment> {
    const task = await this.taskRepository.findOne({ where: { id: taskId } });
    if (!task) throw new NotFoundException("Task not found");
    if (task.creatorId !== teacherId) throw new ForbiddenException("Not authorized");

    // Validate assignee
    if (dto.assigneeType === AssigneeType.COURSE) {
      const course = await this.courseRepository.findOne({ where: { id: dto.assigneeId } });
      if (!course) throw new NotFoundException("Course not found");
    } else if (dto.assigneeType === AssigneeType.CLASS) {
      const cls = await this.classRepository.findOne({ where: { id: dto.assigneeId } });
      if (!cls) throw new NotFoundException("Class not found");
    } else if (dto.assigneeType === AssigneeType.INDIVIDUAL) {
      const user = await this.userRepository.findOne({ where: { id: dto.assigneeId } });
      if (!user) throw new NotFoundException("User not found");
    }

    const assignment = this.assignmentRepository.create({
      taskId,
      assigneeType: dto.assigneeType,
      assigneeId: dto.assigneeId,
      dueDate: dto.dueDate,
    });

    await this.assignmentRepository.save(assignment);

    // Notify learners asynchronously
    (async () => {
      try {
        let learnerIds: string[] = [];
        if (dto.assigneeType === AssigneeType.COURSE) {
          learnerIds = [];
        } else if (dto.assigneeType === AssigneeType.CLASS) {
          const cls = await this.classRepository.findOne({ where: { id: dto.assigneeId }, relations: ["learners"] });
          if (cls && cls.learners) {
            learnerIds = cls.learners.map(l => l.id);
          }
        } else if (dto.assigneeType === AssigneeType.INDIVIDUAL) {
          learnerIds = [dto.assigneeId];
        }

        for (const lid of learnerIds) {
          await this.notificationService.createNotification({
            userId: lid,
            title: "New Task Assigned",
            message: `You have been assigned a new task: "${task.title}".`,
            type: NotificationType.TASK_ASSIGNED,
          });
        }
      } catch (err) {
        console.error("Failed to send task assignment notifications", err);
      }
    })();

    return assignment;
  }

  async submitTask(
    assignmentId: string,
    learnerId: string,
    dto: SubmitTaskDTO
  ): Promise<TaskSubmission> {
    let assignment = await this.assignmentRepository.findOne({
      where: { id: assignmentId },
      relations: ["task"],
    });
    
    if (!assignment) {
      const task = await this.taskRepository.findOne({ where: { id: assignmentId } });
      if (task && task.courseId) {
        assignment = await this.assignmentRepository.findOne({
          where: { taskId: task.id, assigneeType: AssigneeType.COURSE, assigneeId: task.courseId },
          relations: ["task"],
        });
        if (!assignment) {
          assignment = this.assignmentRepository.create({
            taskId: task.id,
            assigneeType: AssigneeType.COURSE,
            assigneeId: task.courseId,
            dueDate: new Date(new Date().setFullYear(new Date().getFullYear() + 10)),
          });
          await this.assignmentRepository.save(assignment);
          assignment.task = task;
        }
      }
    }
    
    if (!assignment) throw new NotFoundException("Assignment not found");
    
    // Update assignmentId to the real assignment id if we fell back
    assignmentId = assignment.id;

    // Let's assume the user is allowed to submit for now (could check enrollment)
    const existing = await this.submissionRepository.findOne({
      where: { assignmentId, learnerId },
    });

    if (existing && existing.status !== TaskSubmissionStatus.PENDING) {
      throw new BadRequestException("You have already submitted this task and cannot redo it.");
    }

    const submission = existing || this.submissionRepository.create({
      assignmentId,
      learnerId,
    });

    submission.content = dto.content;
    submission.audioUrl = dto.audioUrl;
    submission.attachments = dto.attachments;
    submission.status = TaskSubmissionStatus.SUBMITTED;
    submission.submittedAt = new Date();

    const taskType = (assignment.task.type || "").toUpperCase();
    if (taskType === "READING" || taskType === "LISTENING") {
      if (assignment.task.questions && Array.isArray(assignment.task.questions)) {
        let correctCount = 0;
        let parsedAnswers: Record<string, string> = {};
        try {
          parsedAnswers = JSON.parse(dto.content || "{}");
        } catch(e) {}
        
        assignment.task.questions.forEach((q: any, idx: number) => {
          const qKey = q.id ? `${q.id}_${idx}` : `q_${idx}`;
          const studentAnswer = parsedAnswers[qKey];
          
          if (studentAnswer !== undefined) {
            // studentAnswer is usually the option text.
            // q.correctAnswer is usually the index (e.g. "0", "1").
            const correctIndex = parseInt(q.correctAnswer, 10);
            let correctText = String(q.correctAnswer);
            
            if (!isNaN(correctIndex) && q.options && q.options[correctIndex]) {
              const opt = q.options[correctIndex];
              correctText = typeof opt === 'string' ? opt : String(opt.id || opt.text);
            }
            
            if (String(studentAnswer) === String(q.correctAnswer) || String(studentAnswer) === correctText) {
              correctCount++;
            }
          }
        });
        
        const total = assignment.task.questions.length;
        submission.score = total > 0 ? (correctCount / total) * assignment.task.maxScore : 0;
        submission.status = TaskSubmissionStatus.GRADED;
      }
    }

    await this.submissionRepository.save(submission);

    // Notify teacher asynchronously
    (async () => {
      try {
        const learner = await this.userRepository.findOne({ where: { id: learnerId } });
        const learnerName = learner ? (learner.firstName || learner.email) : "A student";
        await this.notificationService.createNotification({
          userId: assignment.task.creatorId,
          title: "Task Submitted",
          message: `${learnerName} has submitted their answer for "${assignment.task.title}".`,
          type: NotificationType.TASK_SUBMITTED,
          link: `/task/${assignment.task.id}`,
        });
      } catch (err) {
        console.error("Failed to send submission notification", err);
      }
    })();

    return submission;
  }

  async getTaskSubmissions(taskId: string, teacherId: string): Promise<TaskSubmission[]> {
    const task = await this.taskRepository.findOne({ where: { id: taskId } });
    if (!task) throw new NotFoundException("Task not found");
    if (task.creatorId !== teacherId) throw new ForbiddenException("Not authorized");

    const assignments = await this.assignmentRepository.find({
      where: { taskId },
    });
    
    if (assignments.length === 0) return [];

    const submissions = await this.submissionRepository.find({
      where: assignments.map((a) => ({ assignmentId: a.id })),
      relations: ["learner"],
      order: { submittedAt: "DESC" },
    });

    return submissions;
  }

  async gradeTask(
    submissionId: string,
    teacherId: string,
    dto: GradeTaskDTO
  ): Promise<TaskSubmission> {
    const submission = await this.submissionRepository.findOne({
      where: { id: submissionId },
      relations: ["assignment", "assignment.task"],
    });
    if (!submission) throw new NotFoundException("Submission not found");
    
    if (submission.assignment.task.creatorId !== teacherId) {
      throw new ForbiddenException("Not authorized");
    }

    submission.score = dto.score;
    submission.textFeedback = dto.textFeedback;
    submission.audioFeedbackUrl = dto.audioFeedbackUrl;
    submission.status = dto.status;

    await this.submissionRepository.save(submission);

    // Notify learner asynchronously
    (async () => {
      try {
        await this.notificationService.createNotification({
          userId: submission.learnerId,
          title: "Task Graded",
          message: `Your submission for "${submission.assignment.task.title}" has been graded. Score: ${dto.score}`,
          type: NotificationType.TASK_GRADED,
          link: `/task/${submission.assignment.task.id}`,
        });
      } catch (err) {
        console.error("Failed to send grade notification", err);
      }
    })();

    return submission;
  }

  async evaluateSubmissionWithAI(
    submissionId: string,
    teacherId: string
  ): Promise<any> {
    const submission = await this.submissionRepository.findOne({
      where: { id: submissionId },
      relations: ["assignment", "assignment.task"],
    });
    if (!submission) throw new NotFoundException("Submission not found");
    
    if (submission.assignment.task.creatorId !== teacherId) {
      throw new ForbiddenException("Not authorized");
    }

    const taskType = submission.assignment.task.type;
    const promptText = `Task Title: ${submission.assignment.task.title}\nTask Description: ${submission.assignment.task.description || ""}`;
    
    let result: any;
    if (taskType === SkillType.SPEAKING) {
      if (!submission.audioUrl) throw new BadRequestException("No audio URL found for speaking submission");
      result = await geminiService.evaluateAudio(submission.audioUrl, promptText);
    } else if (taskType === SkillType.WRITING) {
      if (!submission.content) throw new BadRequestException("No content found for writing submission");
      result = await geminiService.evaluateWriting(submission.content, promptText);
    } else {
      throw new BadRequestException("AI evaluation is only supported for writing and speaking tasks");
    }

    submission.aiReview = result;
    await this.submissionRepository.save(submission);
    return result;
  }

  private mapToResponseDTO(task: Task): TaskResponseDTO {
    return {
      id: task.id,
      title: task.title,
      description: task.description,
      instructions: task.instructions,
      readingText: task.readingText,
      questions: task.questions,
      type: task.type,
      level: task.level,
      skillFocus: task.skillFocus,
      maxScore: task.maxScore,
      rubric: task.rubric,
      files: task.files,
      sampleAnswers: task.sampleAnswers,
      referenceMedia: task.referenceMedia,
      courseId: task.courseId,
      creatorId: task.creatorId,
      status: task.status,
      rejectionReason: task.rejectionReason,
      createdAt: task.createdAt,
    };
  }
}
