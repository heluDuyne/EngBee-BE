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
import { assignmentService } from "../services/assignment.service";
import {
  CreateAssignmentDTO,
  UpdateAssignmentDTO,
  AssignmentResponseDTO,
  AssignmentListDTO,
  AssignmentDetailDTO,
  AssignmentFilterDTO,
  AssignmentStudentSubmissionDTO,
} from "../dtos/assignment.dto";
import { PaginatedResponseDTO } from "../dtos/pagination.dto";
import { AssignmentStatus } from "../enums";
import { TeacherOnly, Authenticated } from "../decorators/auth.decorator";
import { AuthRequest } from "../middleware/auth.middleware";

/**
 * Assignment Controller
 * Manages assignments for classes (prompt assignments with deadlines)
 *
 * Routes:
 * - POST /api/assignments - Create new assignment
 * - GET /api/assignments - List all assignments
 * - GET /api/assignments/{id} - Get assignment details
 * - PUT /api/assignments/{id} - Update assignment
 * - DELETE /api/assignments/{id} - Delete assignment
 * - GET /api/assignments/class/{classId} - Get assignments by class
 * - GET /api/assignments/status/{status} - Get assignments by status
 * - POST /api/assignments/filter - Filter assignments
 * - GET /api/assignments/{id}/submissions - Get student submissions
 */
@Route("/assignments")
@Tags("Assignment")
export class AssignmentController extends Controller {
  /**
   * Create a new assignment
   * Teacher assigns a prompt to a class with a deadline
   * Requires: Teacher or Admin role
   */
  @Post()
  @Response(201, "Assignment created successfully")
  @Response(400, "Invalid assignment data")
  @Response(401, "Unauthorized - must be logged in")
  @Response(403, "Forbidden - only teachers and admins can create assignments")
  @Security("bearer")
  @TeacherOnly()
  async createAssignment(
    @Body() dto: CreateAssignmentDTO
  ): Promise<AssignmentResponseDTO> {
    return await assignmentService.createAssignment(dto);
  }

  /**
   * Get assignments for the logged-in learner
   */
  @Get("my-assignments")
  @Security("bearer")
  @Response(200, "Assignments retrieved")
  @Response(401, "Unauthorized")
  async getLearnerAssignments(
    @Request() request: AuthRequest,
    @Query() limit: number = 10,
    @Query() offset: number = 0
  ): Promise<PaginatedResponseDTO<AssignmentListDTO>> {
    const user = request.user;
    if (!user) {
      throw new Error("User not found in request");
    }
    
    return await assignmentService.getLearnerAssignments(
      user.id,
      limit,
      offset
    );
  }

  /**
   * Get assignments created by the logged-in teacher
   */
  @Get("teacher/my-created")
  @Security("bearer")
  @Response(200, "Assignments retrieved")
  @Response(401, "Unauthorized")
  @TeacherOnly()
  async getCreatedAssignments(
    @Request() request: AuthRequest,
    @Query() limit: number = 10,
    @Query() offset: number = 0
  ): Promise<PaginatedResponseDTO<AssignmentListDTO>> {
    const user = request.user;
    if (!user) {
      throw new Error("User not found in request");
    }
    
    return await assignmentService.getTeacherAssignments(
      user.id,
      limit,
      offset
    );
  }

  /**
   * Get all assignments with pagination
   */
  @Get()
  async getAllAssignments(
    @Query() limit: number = 10,
    @Query() offset: number = 0
  ): Promise<PaginatedResponseDTO<AssignmentListDTO>> {
    return await assignmentService.getAllAssignments(limit, offset);
  }

  /**
   * Get assignments for a specific class
   */
  @Get("class/{classId}")
  async getAssignmentsByClass(
    @Path() classId: string,
    @Query() limit: number = 10,
    @Query() offset: number = 0
  ): Promise<PaginatedResponseDTO<AssignmentListDTO>> {
    return await assignmentService.getAssignmentsByClass(
      classId,
      limit,
      offset
    );
  }

  /**
   * Get assignments by status
   */
  @Get("by-status/{status}")
  async getAssignmentsByStatus(
    @Path() status: AssignmentStatus,
    @Query() limit: number = 10,
    @Query() offset: number = 0
  ): Promise<PaginatedResponseDTO<AssignmentListDTO>> {
    return await assignmentService.getAssignmentsByStatus(
      status,
      limit,
      offset
    );
  }

  /**
   * Get assignment by ID
   */
  @Get("{id}")
  @Security("bearer")
  @Response(200, "Assignment found")
  @Response(404, "Assignment not found")
  async getAssignmentById(
    @Path() id: string,
    @Request() request: AuthRequest
  ): Promise<AssignmentDetailDTO> {
    return await assignmentService.getAssignmentById(id, request.user?.id);
  }

  /**
   * Filter assignments with multiple criteria
   */
  @Post("filter")
  async getAssignmentsByFilter(
    @Body() filter: AssignmentFilterDTO
  ): Promise<PaginatedResponseDTO<AssignmentListDTO>> {
    return await assignmentService.getAssignmentsByFilter(filter);
  }

  /**
   * Get student submissions for an assignment
   * Shows all learners in the class and their submission status
   */
  @Get("{id}/submissions")
  @Response(200, "Submissions retrieved")
  @Response(404, "Assignment not found")
  async getStudentSubmissions(
    @Path() id: string
  ): Promise<AssignmentStudentSubmissionDTO[]> {
    return await assignmentService.getStudentSubmissions(id);
  }



  /**
   * Update assignment details
   */
  @Put("{id}")
  @Response(200, "Assignment updated successfully")
  @Response(404, "Assignment not found")
  @Response(401, "Unauthorized - must be logged in")
  @Response(403, "Forbidden - only teachers and admins can update assignments")
  @Security("bearer")
  @TeacherOnly()
  async updateAssignment(
    @Path() id: string,
    @Body() dto: UpdateAssignmentDTO
  ): Promise<AssignmentResponseDTO> {
    return await assignmentService.updateAssignment(id, dto);
  }

  /**
   * Update assignment status
   */
  @Put("{id}/status/{status}")
  @Response(200, "Assignment status updated")
  @Response(404, "Assignment not found")
  @Response(401, "Unauthorized - must be logged in")
  @Response(
    403,
    "Forbidden - only teachers and admins can update assignment status"
  )
  @Security("bearer")
  @TeacherOnly()
  async updateAssignmentStatus(
    @Path() id: string,
    @Path() status: AssignmentStatus
  ): Promise<AssignmentResponseDTO> {
    return await assignmentService.updateAssignmentStatus(id, status);
  }

  /**
   * Delete assignment
   */
  @Delete("{id}")
  @Response(204, "Assignment deleted successfully")
  @Response(404, "Assignment not found")
  @Response(401, "Unauthorized - must be logged in")
  @Response(403, "Forbidden - only teachers and admins can delete assignments")
  @Security("bearer")
  @TeacherOnly()
  async deleteAssignment(@Path() id: string): Promise<void> {
    await assignmentService.deleteAssignment(id);
    this.setStatus(204);
  }

  /**
    Recalculate stats for all assignments
   */
  @Post("admin/recalculate-all")
  @Response(200, "Recalculation started")
  async recalculateAllStats(): Promise<{ message: string }> {
     const assignments = await assignmentService.getAllAssignments(1000, 0); // Fetch up to 1000
     let count = 0;
     for (const a of assignments.data) {
         await assignmentService.updateAssignmentStats(a.id);
         count++;
     }
     return { message: `Recalculated stats for ${count} assignments` };
  }
}
