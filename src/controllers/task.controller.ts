import {
  Controller,
  Get,
  Post,
  Patch,
  Route,
  Body,
  Path,
  Response,
  Tags,
  Security,
  Request,
  Query,
} from "tsoa";
import {
  CreateTaskDTO,
  AssignTaskDTO,
  SubmitTaskDTO,
  GradeTaskDTO,
  ReviewTaskDTO,
  TaskResponseDTO,
  UpdateTaskDTO,
  LearnerTaskResponseDTO,
} from "../dtos/task.dto";
import { TaskService } from "../services/task.service";
import { TeacherOnly, Authenticated, AdminOnly } from "../decorators/auth.decorator";
import { TaskStatus } from "../enums";

@Route("/tasks")
@Tags("Task")
export class TaskController extends Controller {
  private taskService = new TaskService();

  @Post()
  @Response(201, "Task created successfully")
  @Security("bearer")
  @TeacherOnly()
  async createTask(
    @Request() req: any,
    @Body() dto: CreateTaskDTO
  ): Promise<TaskResponseDTO> {
    const isAdmin = req.user.role === 'admin';
    return await this.taskService.createTask(req.user.id, dto, isAdmin);
  }

  @Patch("{id}")
  @Response(200, "Task updated successfully")
  @Security("bearer")
  @TeacherOnly()
  async updateTask(
    @Path() id: string,
    @Request() req: any,
    @Body() dto: UpdateTaskDTO
  ): Promise<TaskResponseDTO> {
    return await this.taskService.updateTask(id, req.user.id, dto);
  }

  @Get("teacher")
  @Security("bearer")
  @TeacherOnly()
  async getTeacherTasks(
    @Request() req: any
  ): Promise<TaskResponseDTO[]> {
    return await this.taskService.getTeacherTasks(req.user.id);
  }

  @Get("learner")
  @Security("bearer")
  @Authenticated()
  async getLearnerTasks(
    @Request() req: any
  ): Promise<LearnerTaskResponseDTO[]> {
    return await this.taskService.getLearnerTasks(req.user.id);
  }

  @Get("{id}")
  @Security("bearer")
  @Authenticated()
  async getTaskById(
    @Path() id: string
  ): Promise<TaskResponseDTO> {
    return await this.taskService.getTaskById(id);
  }

  @Get("admin/all")
  @Security("bearer")
  @AdminOnly()
  async getAllTasks(
    @Query() status?: TaskStatus
  ): Promise<TaskResponseDTO[]> {
    return await this.taskService.getAllTasks(status);
  }

  @Post("{id}/assign")
  @Security("bearer")
  @TeacherOnly()
  async assignTask(
    @Path() id: string,
    @Request() req: any,
    @Body() dto: AssignTaskDTO
  ): Promise<any> {
    return await this.taskService.assignTask(id, req.user.id, dto);
  }

  @Patch("{id}/submit")
  @Security("bearer")
  @TeacherOnly()
  async submitForReview(
    @Path() id: string,
    @Request() req: any
  ): Promise<TaskResponseDTO> {
    return await this.taskService.submitForReview(id, req.user.id);
  }

  @Patch("{id}/review")
  @Security("bearer")
  @AdminOnly()
  async reviewTask(
    @Path() id: string,
    @Body() dto: ReviewTaskDTO
  ): Promise<TaskResponseDTO> {
    return await this.taskService.reviewTask(id, dto);
  }

  @Patch("{id}/publish")
  @Security("bearer")
  @TeacherOnly()
  async publishTask(
    @Path() id: string,
    @Request() req: any
  ): Promise<TaskResponseDTO> {
    return await this.taskService.publishTask(id, req.user.id);
  }

  @Patch("{id}/archive")
  @Security("bearer")
  @AdminOnly()
  async archiveTask(
    @Path() id: string
  ): Promise<TaskResponseDTO> {
    return await this.taskService.archiveTask(id);
  }

  @Post("assignments/{assignmentId}/submit")
  @Security("bearer")
  @Authenticated()
  async submitTask(
    @Path() assignmentId: string,
    @Request() req: any,
    @Body() dto: SubmitTaskDTO
  ): Promise<any> {
    return await this.taskService.submitTask(assignmentId, req.user.id, dto);
  }

  @Get("{id}/submissions")
  @Security("bearer")
  @TeacherOnly()
  async getTaskSubmissions(
    @Path() id: string,
    @Request() req: any
  ): Promise<any[]> {
    return await this.taskService.getTaskSubmissions(id, req.user.id);
  }

  @Patch("submissions/{submissionId}/grade")
  @Security("bearer")
  @TeacherOnly()
  async gradeTask(
    @Path() submissionId: string,
    @Request() req: any,
    @Body() dto: GradeTaskDTO
  ): Promise<any> {
    return await this.taskService.gradeTask(submissionId, req.user.id, dto);
  }
}
