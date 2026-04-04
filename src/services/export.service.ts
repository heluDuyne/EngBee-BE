import { Repository } from "typeorm";
import { AppDataSource } from "../data-source";
import { Class } from "../entities/Class";
import { User } from "../entities/User";
import { Attempt } from "../entities/Attempt";
import { AttemptStatus } from "../enums";
import { Score } from "../entities/Score";
import {
  ClassProgressExportDTO,
  ClassProgressRowDTO,
  LearnerReportExportDTO,
  LearnerStatsDTO,
  AttemptDetailRowDTO,
} from "../dtos/export.dto";
import { HttpException } from "../exceptions/HttpException";

/**
 * Export Service
 * Generates reports in CSV and PDF formats
 * Handles data aggregation for class progress and learner reports
 */
export class ExportService {
  private classRepository: Repository<Class>;
  private userRepository: Repository<User>;
  private attemptRepository: Repository<Attempt>;
  private scoreRepository: Repository<Score>;

  constructor() {
    this.classRepository = AppDataSource.getRepository(Class);
    this.userRepository = AppDataSource.getRepository(User);
    this.attemptRepository = AppDataSource.getRepository(Attempt);
    this.scoreRepository = AppDataSource.getRepository(Score);
  }

  /**
   * Generate class progress report data
   */
  async generateClassProgressReport(classId: string): Promise<ClassProgressExportDTO> {
    const classs = await this.classRepository.findOne({
      where: { id: classId },
      relations: ["teacher", "learners"],
    });

    if (!classs) {
      throw new HttpException("Class not found", 404);
    }

    const learners = classs.learners || [];
    const rows: ClassProgressRowDTO[] = [];

    for (const learner of learners) {
      const attempts = await this.attemptRepository.find({
        where: { learnerId: learner.id },
        relations: ["score"],
      });

      const submittedAttempts = attempts.filter((a) => a.status === AttemptStatus.SUBMITTED).length;
      const scoredAttempts = attempts.filter((a) => a.status === AttemptStatus.SCORED).length;

      const scores = attempts
        .filter((a) => a.score)
        .map((a) => a.score!.overallBand)
        .filter((s) => s !== undefined);

      const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : undefined;

      const speakingAttempts = attempts.filter((a) => a.skillType === "speaking");
      const writingAttempts = attempts.filter((a) => a.skillType === "writing");

      const speakingScores = speakingAttempts
        .filter((a) => a.score)
        .map((a) => a.score!.overallBand)
        .filter((s) => s !== undefined);
      const writingScores = writingAttempts
        .filter((a) => a.score)
        .map((a) => a.score!.overallBand)
        .filter((s) => s !== undefined);

      const speakingScore = speakingScores.length > 0 ? speakingScores.reduce((a, b) => a + b, 0) / speakingScores.length : undefined;
      const writingScore = writingScores.length > 0 ? writingScores.reduce((a, b) => a + b, 0) / writingScores.length : undefined;

      const lastAttempt = attempts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];

      rows.push({
        learnerName: learner.email.split("@")[0],
        learnerEmail: learner.email,
        totalAttempts: attempts.length,
        submittedAttempts,
        scoredAttempts,
        averageScore,
        speakingScore,
        writingScore,
        lastAttemptDate: lastAttempt?.submittedAt,
        status: scoredAttempts > 0 ? "completed" : submittedAttempts > 0 ? "in_progress" : "not_started",
      });
    }

    return {
      classId: classs.id,
      className: classs.name,
      teacherEmail: classs.teacher?.email || "",
      exportDate: new Date(),
      totalLearners: learners.length,
      rows,
    };
  }

  /**
   * Generate learner report data
   */
  async generateLearnerReport(learnerId: string): Promise<LearnerReportExportDTO> {
    const learner = await this.userRepository.findOne({
      where: { id: learnerId },
      relations: ["enrolledClasses", "enrolledClasses.teacher"],
    });

    if (!learner) {
      throw new HttpException("Learner not found", 404);
    }

    const classes = learner.enrolledClasses || [];
    const attempts = await this.attemptRepository.find({
      where: { learnerId },
      relations: ["prompt", "score"],
    });

    // Calculate overall stats
    const submittedAttempts = attempts.filter((a) => a.status === AttemptStatus.SUBMITTED).length;
    const scoredAttempts = attempts.filter((a) => a.status === AttemptStatus.SCORED).length;

    const scores = attempts
      .filter((a) => a.score)
      .map((a) => a.score!.overallBand)
      .filter((s) => s !== undefined);

    const speakingAttempts = attempts.filter((a) => a.skillType === "speaking");
    const writingAttempts = attempts.filter((a) => a.skillType === "writing");

    const speakingScores = speakingAttempts
      .filter((a) => a.score)
      .map((a) => a.score!.overallBand)
      .filter((s) => s !== undefined);
    const writingScores = writingAttempts
      .filter((a) => a.score)
      .map((a) => a.score!.overallBand)
      .filter((s) => s !== undefined);

    const overallStats: LearnerStatsDTO = {
      totalAttempts: attempts.length,
      submittedAttempts,
      scoredAttempts,
      averageSpeakingScore: speakingScores.length > 0 ? speakingScores.reduce((a, b) => a + b, 0) / speakingScores.length : undefined,
      averageWritingScore: writingScores.length > 0 ? writingScores.reduce((a, b) => a + b, 0) / writingScores.length : undefined,
      overallAverageBand: scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : undefined,
    };

    // Build attempt details
    const attemptDetails: AttemptDetailRowDTO[] = attempts
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map((attempt) => ({
        promptId: attempt.promptId,
        promptTitle: attempt.prompt?.content.substring(0, 100) || "",
        skillType: attempt.skillType as "speaking" | "writing",
        attemptDate: attempt.createdAt,
        submittedDate: attempt.submittedAt,
        status: attempt.status as "in_progress" | "submitted" | "scored",
        overallBand: attempt.score?.overallBand,
        fluency: attempt.score?.fluency,
        coherence: attempt.score?.coherence,
        lexical: attempt.score?.lexical,
        grammar: attempt.score?.grammar,
        pronunciation: attempt.score?.pronunciation,
        taskResponse: attempt.score?.taskResponse,
      }));

    return {
      learnerId: learner.id,
      learnerName: learner.email.split("@")[0],
      learnerEmail: learner.email,
      exportDate: new Date(),
      enrolledClasses: classes.map((c) => ({
        classId: c.id,
        className: c.name,
        teacherEmail: c.teacher?.email || "",
        enrolledAt: c.createdAt,
      })),
      overallStats,
      attemptDetails,
    };
  }

  /**
   * Convert class progress data to CSV string
   */
  async exportClassProgressAsCSV(classId: string): Promise<string> {
    const data = await this.generateClassProgressReport(classId);

    const headers = [
      "Learner Name",
      "Email",
      "Total Attempts",
      "Submitted",
      "Scored",
      "Average Score",
      "Speaking Score",
      "Writing Score",
      "Last Attempt Date",
      "Status",
    ];

    const rows = data.rows.map((row) => [
      row.learnerName,
      row.learnerEmail,
      row.totalAttempts,
      row.submittedAttempts,
      row.scoredAttempts,
      row.averageScore?.toFixed(2) || "",
      row.speakingScore?.toFixed(2) || "",
      row.writingScore?.toFixed(2) || "",
      row.lastAttemptDate?.toISOString().split("T")[0] || "",
      row.status,
    ]);

    const csv = [
      `Class: ${data.className}`,
      `Teacher: ${data.teacherEmail}`,
      `Export Date: ${data.exportDate.toISOString().split("T")[0]}`,
      `Total Learners: ${data.totalLearners}`,
      "",
      headers.map((h) => `"${h}"`).join(","),
      ...rows.map((r) => r.map((val) => `"${val}"`).join(",")),
    ].join("\n");

    return csv;
  }

  /**
   * Convert learner report data to CSV string
   */
  async exportLearnerReportAsCSV(learnerId: string): Promise<string> {
    const data = await this.generateLearnerReport(learnerId);

    const headers = [
      "Prompt",
      "Skill Type",
      "Attempt Date",
      "Submitted Date",
      "Status",
      "Overall Band",
      "Fluency",
      "Coherence",
      "Lexical",
      "Grammar",
      "Pronunciation",
      "Task Response",
    ];

    const rows = data.attemptDetails.map((detail) => [
      detail.promptTitle,
      detail.skillType,
      detail.attemptDate.toISOString().split("T")[0],
      detail.submittedDate?.toISOString().split("T")[0] || "",
      detail.status,
      detail.overallBand?.toFixed(2) || "",
      detail.fluency?.toFixed(2) || "",
      detail.coherence?.toFixed(2) || "",
      detail.lexical?.toFixed(2) || "",
      detail.grammar?.toFixed(2) || "",
      detail.pronunciation?.toFixed(2) || "",
      detail.taskResponse?.toFixed(2) || "",
    ]);

    const csv = [
      `Learner: ${data.learnerName}`,
      `Email: ${data.learnerEmail}`,
      `Export Date: ${data.exportDate.toISOString().split("T")[0]}`,
      "",
      "SUMMARY STATISTICS",
      `Total Attempts: ${data.overallStats.totalAttempts}`,
      `Submitted: ${data.overallStats.submittedAttempts}`,
      `Scored: ${data.overallStats.scoredAttempts}`,
      `Average Speaking Score: ${data.overallStats.averageSpeakingScore?.toFixed(2) || "N/A"}`,
      `Average Writing Score: ${data.overallStats.averageWritingScore?.toFixed(2) || "N/A"}`,
      `Overall Average Band: ${data.overallStats.overallAverageBand?.toFixed(2) || "N/A"}`,
      "",
      headers.map((h) => `"${h}"`).join(","),
      ...rows.map((r) => r.map((val) => `"${val}"`).join(",")),
    ].join("\n");

    return csv;
  }

  /**
   * Helper: Format bytes to human readable format
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  }
}

export const exportService = new ExportService();
