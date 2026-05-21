import { CourseStatus, CourseLevel } from "../enums";

export interface CreateCourseDTO {
  title: string;
  description?: string;
  level: CourseLevel;
}

export interface UpdateCourseDTO {
  title?: string;
  description?: string;
  level?: CourseLevel;
}

export interface ReviewCourseDTO {
  action: "APPROVE" | "REJECT";
  reason?: string;
}

export interface CourseResponseDTO {
  id: string;
  title: string;
  description?: string;
  level: CourseLevel;
  status: CourseStatus;
  rejectionReason?: string;
  creatorId: string;
  createdAt: Date;
  updatedAt: Date;
}
