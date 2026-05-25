import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Route,
  Body,
  Path,
  Query,
  Response,
  Tags,
  Security,
  Request,
} from "tsoa";
import {
  CreateCourseDTO,
  UpdateCourseDTO,
  ReviewCourseDTO,
  ReviewInputDTO,
  ReviewReplyInputDTO,
  CourseResponseDTO,
} from "../dtos/course.dto";
import { CourseService } from "../services/course.service";
import { TeacherOnly, AdminOnly, Authenticated } from "../decorators/auth.decorator";
import { CourseStatus } from "../enums";

@Route("/courses")
@Tags("Course")
export class CourseController extends Controller {
  private courseService = new CourseService();

  @Post()
  @Response(201, "Course created successfully")
  @Security("bearer")
  @TeacherOnly()
  async createCourse(
    @Request() req: any,
    @Body() dto: CreateCourseDTO
  ): Promise<CourseResponseDTO> {
    return await this.courseService.createCourse(req.user.id, dto);
  }

  @Get()
  @Security("bearer")
  @Authenticated()
  async getAllCourses(
    @Request() req: any,
    @Query() teacherId?: string,
    @Query() status?: CourseStatus
  ): Promise<CourseResponseDTO[]> {
    const isStudent = req.user.role === "learner";
    return await this.courseService.getAllCourses(isStudent, teacherId, status, req.user.id);
  }

  @Get("{id}")
  @Security("bearer")
  @Authenticated()
  async getCourseById(@Path() id: string, @Request() req: any): Promise<CourseResponseDTO> {
    return await this.courseService.getCourseById(id, req.user.id);
  }

  @Post("{id}/enroll")
  @Security("bearer")
  @Authenticated()
  async enrollCourse(@Path() id: string, @Request() req: any): Promise<CourseResponseDTO> {
    return await this.courseService.enrollCourse(id, req.user.id);
  }

  @Put("{id}")
  @Security("bearer")
  @TeacherOnly()
  async updateCourse(
    @Path() id: string,
    @Request() req: any,
    @Body() dto: UpdateCourseDTO
  ): Promise<CourseResponseDTO> {
    const isAdmin = req.user.role === "admin";
    return await this.courseService.updateCourse(id, req.user.id, dto, isAdmin);
  }

  @Patch("{id}/submit")
  @Security("bearer")
  @TeacherOnly()
  async submitForReview(
    @Path() id: string,
    @Request() req: any
  ): Promise<CourseResponseDTO> {
    const isAdmin = req.user.role === "admin";
    return await this.courseService.submitForReview(id, req.user.id, isAdmin);
  }

  @Patch("{id}/review")
  @Security("bearer")
  @AdminOnly()
  async reviewCourse(
    @Path() id: string,
    @Body() dto: ReviewCourseDTO
  ): Promise<CourseResponseDTO> {
    return await this.courseService.reviewCourse(id, dto);
  }

  @Patch("{id}/archive")
  @Security("bearer")
  @AdminOnly()
  async archiveCourse(@Path() id: string): Promise<CourseResponseDTO> {
    return await this.courseService.archiveCourse(id);
  }

  @Delete("{id}")
  @Response(204, "Course deleted successfully")
  @Security("bearer")
  @TeacherOnly()
  async deleteCourse(
    @Path() id: string,
    @Request() req: any
  ): Promise<void> {
    const isAdmin = req.user.role === "admin";
    await this.courseService.deleteCourse(id, req.user.id, isAdmin);
    this.setStatus(204);
  }

  @Post("{id}/reviews")
  @Security("bearer")
  @Authenticated()
  async addReview(
    @Path() id: string,
    @Request() req: any,
    @Body() dto: ReviewInputDTO
  ): Promise<CourseResponseDTO> {
    return await this.courseService.addReview(id, req.user.id, dto);
  }

  @Put("{id}/reviews/{reviewId}")
  @Security("bearer")
  @Authenticated()
  async updateReview(
    @Path() id: string,
    @Path() reviewId: string,
    @Request() req: any,
    @Body() dto: ReviewInputDTO
  ): Promise<CourseResponseDTO> {
    const isAdmin = req.user.role === "admin";
    return await this.courseService.updateReview(id, reviewId, req.user.id, isAdmin, dto);
  }

  @Delete("{id}/reviews/{reviewId}")
  @Response(204, "Review deleted successfully")
  @Security("bearer")
  @Authenticated()
  async deleteReview(
    @Path() id: string,
    @Path() reviewId: string,
    @Request() req: any
  ): Promise<void> {
    const isAdmin = req.user.role === "admin";
    await this.courseService.deleteReview(id, reviewId, req.user.id, isAdmin);
    this.setStatus(204);
  }

  @Post("{id}/reviews/{reviewId}/reply")
  @Security("bearer")
  @Authenticated()
  async replyReview(
    @Path() id: string,
    @Path() reviewId: string,
    @Request() req: any,
    @Body() dto: ReviewReplyInputDTO
  ): Promise<CourseResponseDTO> {
    const isAdmin = req.user.role === "admin";
    return await this.courseService.replyReview(id, reviewId, req.user.id, isAdmin, dto);
  }
}
