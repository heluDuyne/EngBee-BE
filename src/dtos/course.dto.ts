import { CourseStatus, CourseLevel } from "../enums";

export interface CreateCourseDTO {
  title: string;
  description?: string;
  level: CourseLevel;
  category?: string;
  duration?: string;
  color?: string;
  icon?: string;
  skills?: string[];
  price?: number;
  isFree?: boolean;
  isFeatured?: boolean;
  curriculum?: any[];
}

export interface UpdateCourseDTO {
  title?: string;
  description?: string;
  level?: CourseLevel;
  category?: string;
  duration?: string;
  color?: string;
  icon?: string;
  skills?: string[];
  price?: number;
  isFree?: boolean;
  isFeatured?: boolean;
  curriculum?: any[];
  status?: CourseStatus;
}

export interface ReviewCourseDTO {
  action: "APPROVE" | "REJECT";
  reason?: string;
}

export interface ReviewInputDTO {
  rating: number;
  comment: string;
}

export interface ReviewReplyInputDTO {
  comment: string;
}

export interface CourseResponseDTO {
  id: string;
  title: string;
  description?: string;
  level: CourseLevel;
  category?: string;
  lessonCount: number;
  duration?: string;
  rating: number;
  reviewCount: number;
  enrolled: number;
  color?: string;
  icon?: string;
  skills?: string[];
  price: number;
  isFree: boolean;
  isFeatured: boolean;
  curriculum?: any[];
  reviews?: any[];
  status: CourseStatus;
  rejectionReason?: string;
  isEnrolled?: boolean;
  creatorId: string;
  createdAt: Date;
  updatedAt: Date;
  tasks?: any[];
  progress?: number;
}
