import { Controller, Get, Route, Path, Response, Tags } from "tsoa";
import { exportService } from "../services/export.service";
import { ClassProgressExportDTO, LearnerReportExportDTO } from "../dtos/export.dto";

@Route("/exports")
@Tags("Export")
export class ExportController extends Controller {
  /**
   * Get class progress report (as JSON)
   
   */
  @Get("classes/{classId}/progress")
  @Response(200, "Class progress report generated")
  @Response(404, "Class not found")
  async getClassProgressReport(@Path() classId: string): Promise<ClassProgressExportDTO> {
    return await exportService.generateClassProgressReport(classId);
  }

  /**
   * Export class progress as CSV file
   */
  @Get("classes/{classId}/csv")
  @Response(200, "CSV file generated")
  @Response(404, "Class not found")
  async exportClassProgressAsCSV(@Path() classId: string): Promise<string> {
    return await exportService.exportClassProgressAsCSV(classId);
  }

  @Get("learner/{learnerId}/report")
  @Response(200, "Learner report generated")
  @Response(404, "Learner not found")
  async getLearnerReport(@Path() learnerId: string): Promise<LearnerReportExportDTO> {
    return await exportService.generateLearnerReport(learnerId);
  }
  @Get("learner/{learnerId}/csv")
  @Response(200, "CSV file generated")
  @Response(404, "Learner not found")
  async exportLearnerReportAsCSV(@Path() learnerId: string): Promise<string> {
    return await exportService.exportLearnerReportAsCSV(learnerId);
  }
}
