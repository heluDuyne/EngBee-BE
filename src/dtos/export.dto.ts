/**
 * Export DTOs for report generation
 */

/**
 * Class Progress Export DTO
 * @example {
 *   "classId": "class-uuid-123",
 *   "className": "IELTS Speaking Preparation - Batch A",
 *   "teacherEmail": "teacher@example.com",
 *   "exportDate": "2024-12-06T11:00:00Z",
 *   "totalLearners": 25,
 *   "rows": [...]
 * }
 */
export class ClassProgressExportDTO {
  classId!: string;
  className!: string;
  teacherEmail!: string;
  exportDate!: Date;
  totalLearners!: number;
  rows!: ClassProgressRowDTO[];
}

/**
 * Class Progress Row DTO
 * @example {
 *   "learnerName": "John Doe",
 *   "learnerEmail": "john@example.com",
 *   "totalAttempts": 5,
 *   "submittedAttempts": 4,
 *   "scoredAttempts": 3,
 *   "averageScore": 7.5,
 *   "speakingScore": 7.5,
 *   "writingScore": 7.2,
 *   "lastAttemptDate": "2024-12-05T15:30:00Z",
 *   "status": "completed"
 * }
 */
export class ClassProgressRowDTO {
  learnerName!: string;
  learnerEmail!: string;
  totalAttempts!: number;
  submittedAttempts!: number;
  scoredAttempts!: number;
  averageScore?: number;
  speakingScore?: number;
  writingScore?: number;
  lastAttemptDate?: Date;
  status!: "completed" | "in_progress" | "not_started";
}

/**
 * Learner Report Export DTO
 * @example {
 *   "learnerId": "learner-uuid-456",
 *   "learnerName": "Jane Smith",
 *   "learnerEmail": "jane@example.com",
 *   "exportDate": "2024-12-06T11:00:00Z",
 *   "enrolledClasses": [...],
 *   "overallStats": {...},
 *   "attemptDetails": [...]
 * }
 */
export class LearnerReportExportDTO {
  learnerId!: string;
  learnerName!: string;
  learnerEmail!: string;
  exportDate!: Date;
  enrolledClasses!: ClassEnrollmentDTO[];
  overallStats!: LearnerStatsDTO;
  attemptDetails!: AttemptDetailRowDTO[];
}

/**
 * Class Enrollment DTO
 * @example {
 *   "classId": "class-uuid-1",
 *   "className": "IELTS Speaking Preparation",
 *   "teacherEmail": "teacher@example.com",
 *   "enrolledAt": "2024-11-01T10:00:00Z"
 * }
 */
export class ClassEnrollmentDTO {
  classId!: string;
  className!: string;
  teacherEmail!: string;
  enrolledAt!: Date;
}

/**
 * Learner Stats DTO
 * @example {
 *   "totalAttempts": 6,
 *   "submittedAttempts": 5,
 *   "scoredAttempts": 4,
 *   "averageSpeakingScore": 7.5,
 *   "averageWritingScore": 7.2,
 *   "overallAverageBand": 7.35
 * }
 */
export class LearnerStatsDTO {
  totalAttempts!: number;
  submittedAttempts!: number;
  scoredAttempts!: number;
  averageSpeakingScore?: number;
  averageWritingScore?: number;
  overallAverageBand?: number;
}

/**
 * Attempt Detail Row DTO
 * @example {
 *   "promptId": "prompt-uuid-1",
 *   "promptTitle": "Describe a memorable journey",
 *   "skillType": "speaking",
 *   "attemptDate": "2024-12-04T10:00:00Z",
 *   "submittedDate": "2024-12-04T14:20:00Z",
 *   "status": "scored",
 *   "overallBand": 7.5,
 *   "fluency": 7.5,
 *   "coherence": 7.5,
 *   "lexical": 7.5,
 *   "grammar": 7.5,
 *   "pronunciation": 7.5
 * }
 */
export class AttemptDetailRowDTO {
  promptId!: string;
  promptTitle!: string;
  skillType!: "speaking" | "writing";
  attemptDate!: Date;
  submittedDate?: Date;
  status!: "in_progress" | "submitted" | "scored";
  overallBand?: number | null;
  fluency?: number | null;
  coherence?: number | null;
  lexical?: number | null;
  grammar?: number | null;
  pronunciation?: number | null;
  taskResponse?: number | null;
}

/**
 * Export Metadata DTO
 * @example {
 *   "exportDate": "2024-12-06T11:00:00Z",
 *   "exportedBy": "teacher-uuid-123",
 *   "fileFormat": "csv",
 *   "reportType": "class_progress"
 * }
 */
export class ExportMetadataDTO {
  exportDate!: Date;
  exportedBy!: string;
  fileFormat!: "csv" | "pdf";
  reportType!: "class_progress" | "learner_report";
}
