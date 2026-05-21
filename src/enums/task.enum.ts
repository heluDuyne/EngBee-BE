export enum TaskLevel {
  BEGINNER = "Beginner",
  INTERMEDIATE = "Intermediate",
  ADVANCED = "Advanced",
  IELTS = "IELTS",
  TOEIC = "TOEIC",
}

export enum TaskSkillFocus {
  GRAMMAR = "Grammar",
  VOCABULARY = "Vocabulary",
  FLUENCY = "Fluency",
  PRONUNCIATION = "Pronunciation",
  COHERENCE = "Coherence",
  TASK_ACHIEVEMENT = "Task Achievement",
}

export enum AssigneeType {
  COURSE = "COURSE",
  CLASS = "CLASS",
  INDIVIDUAL = "INDIVIDUAL",
}

export enum TaskSubmissionStatus {
  PENDING = "PENDING",
  SUBMITTED = "SUBMITTED",
  GRADED = "GRADED",
  RESUBMISSION_REQUESTED = "RESUBMISSION_REQUESTED",
}

export enum TaskStatus {
  DRAFT = "DRAFT",
  PENDING_APPROVAL = "PENDING_APPROVAL",
  APPROVED = "APPROVED",
  PUBLISHED = "PUBLISHED",
  REJECTED = "REJECTED",
  ARCHIVED = "ARCHIVED",
}
