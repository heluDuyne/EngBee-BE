import {
  SkillType,
  TaskLevel,
  TaskSkillFocus,
  AssigneeType,
  TaskSubmissionStatus,
  TaskStatus,
} from "../enums";

export interface TaskQuestion {
  id: string;
  text: string;
  options?: string[];
  correctAnswer: string;
}

export interface CreateTaskDTO {
  title: string;
  description?: string;
  instructions?: string;
  readingText?: string;
  questions?: TaskQuestion[];
  type: SkillType;
  level?: TaskLevel;
  skillFocus?: TaskSkillFocus[];
  maxScore?: number;
  rubric?: string;
  files?: string[];
  sampleAnswers?: string[];
  referenceMedia?: string[];
  courseId?: string;
}

export type UpdateTaskDTO = Partial<CreateTaskDTO>;


export interface AssignTaskDTO {
  assigneeType: AssigneeType;
  assigneeId: string;
  dueDate: Date;
}

export interface SubmitTaskDTO {
  content?: string;
  audioUrl?: string;
  attachments?: string[];
}

export interface GradeTaskDTO {
  score: number;
  textFeedback?: string;
  audioFeedbackUrl?: string;
  status: TaskSubmissionStatus;
}

export interface ReviewTaskDTO {
  status: TaskStatus; // APPROVED or REJECTED
  rejectionReason?: string;
}

export interface TaskResponseDTO {
  id: string;
  title: string;
  description?: string;
  instructions?: string;
  readingText?: string;
  questions?: TaskQuestion[];
  type: SkillType;
  level?: TaskLevel;
  skillFocus?: TaskSkillFocus[];
  maxScore: number;
  rubric?: string;
  files?: string[];
  sampleAnswers?: string[];
  referenceMedia?: string[];
  courseId?: string;
  creatorId: string;
  status: TaskStatus;
  rejectionReason?: string;
  createdAt: Date;
  isAssigned?: boolean;
}

export interface LearnerTaskResponseDTO {
  assignmentId: string;
  assigneeId: string;
  dueDate?: Date;
  task: TaskResponseDTO;
  submitted: boolean;
  submission?: any;
}
