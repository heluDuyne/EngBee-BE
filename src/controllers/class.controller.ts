import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Route,
  Body,
  Path,
  Query,
  Response,
  Tags,
  Request,
  Security,
} from "tsoa";
import {
  CreateClassDTO,
  UpdateClassDTO,
  ClassResponseDTO,
  ClassListDTO,
  ClassDetailDTO,
  ClassFilterDTO,
  EnrollLearnerDTO,
  EnrollByCodeDTO,
  RemoveLearnerDTO,
} from "../dtos/class.dto";
import { PaginatedResponseDTO } from "../dtos/pagination.dto";
import { ClassService } from "../services/class.service";
import { TeacherOnly, Authenticated } from "../decorators/auth.decorator";
import { AuthRequest } from "../middleware/auth.middleware";

@Route("/classes")
@Tags("Class")
export class ClassController extends Controller {
  private classService = new ClassService();

  /**
   * Create a new class
   */
  @Post()
  @Response(201, "Class created successfully")
  @Response(401, "Unauthorized - must be logged in")
  @Response(403, "Forbidden - only teachers and admins can create classes")
  @Security("bearer")
  @TeacherOnly()
  async createClass(@Body() dto: CreateClassDTO): Promise<ClassResponseDTO> {
    return await this.classService.createClass(dto);
  }

  /**
   * Get class by ID
   */
  @Get("{id}")
  @Response(200, "Class found")
  @Response(404, "Class not found")
  @Security("bearer")
  @Authenticated()
  async getClassById(@Path() id: string): Promise<ClassDetailDTO> {
    return await this.classService.getClassById(id);
  }

  /**
   * Get all classes with pagination
   */
  @Get()
  @Security("bearer")
  @Authenticated()
  async getAllClasses(
    @Query() limit: number = 10,
    @Query() offset: number = 0
  ): Promise<PaginatedResponseDTO<ClassListDTO>> {
    return await this.classService.getAllClasses(limit, offset);
  }

  /**
   * Get classes by teacher
   */
  @Get("teacher/{teacherId}")
  @Security("bearer")
  @Authenticated() 
  async getClassesByTeacher(
    @Path() teacherId: string,
    @Query() limit: number = 10,
    @Query() offset: number = 0
  ): Promise<PaginatedResponseDTO<ClassListDTO>> {
    return await this.classService.getClassesByTeacher(
      teacherId,
      limit,
      offset
    );
  }

  /**
   * Get class by code
   */
  @Get("code/{code}")
  @Response(200, "Class found")
  @Response(404, "Class not found")
  async getClassByCode(@Path() code: string): Promise<ClassDetailDTO> {
    return await this.classService.getClassByCode(code);
  }

  /**
   * Get classes with filter
   */
  @Post("filter")
  async getClassesByFilter(
    @Body() filter: ClassFilterDTO
  ): Promise<PaginatedResponseDTO<ClassListDTO>> {
    return await this.classService.getClassesByFilter(filter);
  }

  /**
   * Search classes by name
   */
  @Get("search/{query}")
  async searchClasses(
    @Path() query: string,
    @Query() limit: number = 10
  ): Promise<ClassListDTO[]> {
    return await this.classService.searchClasses(query, limit);
  }

  /**
   * Update class
   */
  @Put("{id}")
  @Response(200, "Class updated successfully")
  @Response(404, "Class not found")
  @Response(401, "Unauthorized - must be logged in")
  @Response(403, "Forbidden - only teachers and admins can update classes")
  @Security("bearer")
  @TeacherOnly()
  async updateClass(
    @Path() id: string,
    @Body() dto: UpdateClassDTO
  ): Promise<ClassResponseDTO> {
    return await this.classService.updateClass(id, dto);
  }

  /**
   * Enroll learner by ID
   */
  @Post("{id}/enroll")
  @Response(200, "Learner enrolled successfully")
  @Response(404, "Class or learner not found")
  @Response(401, "Unauthorized - must be logged in")
  @Response(403, "Forbidden - only teachers and admins can enroll learners")
  @Security("bearer")
  @TeacherOnly()
  async enrollLearner(
    @Path() id: string,
    @Body() dto: EnrollLearnerDTO
  ): Promise<ClassDetailDTO> {
    return await this.classService.enrollLearner(id, dto);
  }

  /**
   * Enroll learner by code
   */
  @Post("enroll-by-code/{learnerId}")
  @Response(200, "Learner enrolled successfully")
  @Response(404, "Class or learner not found")
  @Response(401, "Unauthorized - must be logged in")
  @Security("bearer")
  @Authenticated()
  async enrollByCode(
    @Path() learnerId: string,
    @Body() dto: EnrollByCodeDTO
  ): Promise<ClassDetailDTO> {
    return await this.classService.enrollByCode(learnerId, dto);
  }

  /**
   * Remove learner from class
   */
  @Post("{id}/remove-learner")
  @Response(200, "Learner removed successfully")
  @Response(404, "Class or learner not found")
  @Response(401, "Unauthorized - must be logged in")
  @Response(403, "Forbidden - only teachers and admins can remove learners")
  @Security("bearer")
  @TeacherOnly()
  async removeLearner(
    @Path() id: string,
    @Body() dto: RemoveLearnerDTO
  ): Promise<ClassDetailDTO> {
    return await this.classService.removeLearner(id, dto);
  }

  /**
   * Get learner count in class
   */
  @Get("{id}/learner-count")
  async getLearnerCount(@Path() id: string): Promise<{ count: number }> {
    const count = await this.classService.getLearnerCount(id);
    return { count };
  }

  /**
   * Get class count by teacher
   */
  @Get("teacher/{teacherId}/count")
  async getClassCountByTeacher(
    @Path() teacherId: string
  ): Promise<{ count: number }> {
    const count = await this.classService.getClassCountByTeacher(teacherId);
    return { count };
  }

  /**
   * Delete class
   */
  @Delete("{id}")
  @Response(204, "Class deleted successfully")
  @Response(404, "Class not found")
  @Response(401, "Unauthorized - must be logged in")
  @Response(403, "Forbidden - only teachers and admins can delete classes")
  @Security("bearer")
  @TeacherOnly()
  async deleteClass(@Path() id: string): Promise<void> {
    await this.classService.deleteClass(id);
    this.setStatus(204);
  }
}
