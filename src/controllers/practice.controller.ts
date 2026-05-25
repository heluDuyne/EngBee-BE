import { Body, Controller, Delete, Get, Path, Post, Put, Query, Request, Route, Security, Tags } from "tsoa";
import { PracticeService } from "../services/practice.service";
import { CreatePracticeDTO, PracticeResponseDTO, UpdatePracticeDTO } from "../dtos/practice.dto";
import { PracticeStatus } from "../entities/Practice";
import { UserRole } from "../enums";
import { AdminOnly } from "../decorators/auth.decorator";

@Route("practices")
@Tags("Practices")
export class PracticeController extends Controller {
  private practiceService = new PracticeService();

  @Get()
  public async getPractices(
    @Query() status?: PracticeStatus
  ): Promise<PracticeResponseDTO[]> {
    return this.practiceService.getAllPractices(status);
  }

  @Get("{id}")
  public async getPractice(
    @Path() id: string
  ): Promise<PracticeResponseDTO> {
    return this.practiceService.getPracticeById(id);
  }

  @Post()
  @Security("bearer")
  @AdminOnly()
  public async createPractice(
    @Request() request: any,
    @Body() dto: CreatePracticeDTO
  ): Promise<PracticeResponseDTO> {
    this.setStatus(201);
    return this.practiceService.createPractice(request.user.id, dto);
  }

  @Put("{id}")
  @Security("bearer")
  @AdminOnly()
  public async updatePractice(
    @Path() id: string,
    @Request() request: any,
    @Body() dto: UpdatePracticeDTO
  ): Promise<PracticeResponseDTO> {
    const isAdmin = request.user.role === UserRole.ADMIN;
    return this.practiceService.updatePractice(id, request.user.id, dto, isAdmin);
  }

  @Delete("{id}")
  @Security("bearer")
  @AdminOnly()
  public async deletePractice(
    @Path() id: string,
    @Request() request: any
  ): Promise<void> {
    const isAdmin = request.user.role === UserRole.ADMIN;
    await this.practiceService.deletePractice(id, request.user.id, isAdmin);
    this.setStatus(204);
  }
}
