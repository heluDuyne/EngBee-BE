import { SkillType, DifficultyLevel } from "../enums";

/**
 * Prompt DTOs
 */

/**
 * @example {
 *   "skillType": "SPEAKING",
 *   "content": "Describe your hometown in 2 minutes",
 *   "difficulty": "INTERMEDIATE",
 *   "prepTime": 60,
 *   "responseTime": 120,
 *   "description": "Speaking cue card about hometown",
 *   "followUpQuestions": "What changes have you seen in your hometown?"
 * }
 */
export class CreatePromptDTO {
  skillType!: SkillType;

  /**
   * Question or prompt text
   */
  content!: string;

  difficulty!: DifficultyLevel;

  /**
   * Preparation time in seconds
   * @min 0
   */
  prepTime!: number;

  /**
   * Response time in seconds
   * @min 0
   */
  responseTime!: number;

  description?: string;
  followUpQuestions?: string;
}

/**
 * @example {
 *   "difficulty": "ADVANCED",
 *   "responseTime": 180
 * }
 */
export class UpdatePromptDTO {
  skillType?: SkillType;
  content?: string;
  difficulty?: DifficultyLevel;
  prepTime?: number;
  responseTime?: number;
  description?: string;
  followUpQuestions?: string;
}

/**
 * @example {
 *   "id": "prompt-123",
 *   "createdBy": "teacher-1",
 *   "skillType": "SPEAKING",
 *   "content": "Describe your hometown in 2 minutes",
 *   "difficulty": "INTERMEDIATE",
 *   "prepTime": 60,
 *   "responseTime": 120,
 *   "description": "Speaking cue card about hometown",
 *   "followUpQuestions": "What changes have you seen in your hometown?",
 *   "createdAt": "2024-11-14T10:00:00Z",
 *   "updatedAt": "2024-11-14T10:00:00Z"
 * }
 */
export class PromptResponseDTO {
  id!: string;
  createdBy!: string;
  skillType!: SkillType;
  content!: string;
  difficulty!: DifficultyLevel;
  prepTime!: number;
  responseTime!: number;
  description?: string;
  followUpQuestions?: string;
  createdAt!: Date;
  updatedAt!: Date;
}

/**
 * @example {
 *   "id": "prompt-123",
 *   "skillType": "SPEAKING",
 *   "difficulty": "INTERMEDIATE",
 *   "content": "Describe your hometown in 2 minutes",
 *   "prepTime": 60,
 *   "responseTime": 120,
 *   "createdAt": "2024-11-14T10:00:00Z"
 * }
 */
export class PromptListDTO {
  id!: string;
  skillType!: SkillType;
  difficulty!: DifficultyLevel;
  content!: string;
  prepTime!: number;
  responseTime!: number;
  createdAt!: Date;
}

/**
 * Prompt with creator and usage statistics
 * @example {
 *   "id": "prompt-123",
 *   "createdBy": "teacher-1",
 *   "skillType": "SPEAKING",
 *   "content": "Describe your hometown in 2 minutes",
 *   "difficulty": "INTERMEDIATE",
 *   "prepTime": 60,
 *   "responseTime": 120,
 *   "description": "Speaking cue card about hometown",
 *   "followUpQuestions": "What changes have you seen in your hometown?",
 *   "creatorName": "John Doe",
 *   "creatorEmail": "teacher@example.com",
 *   "attemptCount": 150,
 *   "createdAt": "2024-11-14T10:00:00Z",
 *   "updatedAt": "2024-11-14T10:00:00Z"
 * }
 */
export class PromptDetailDTO extends PromptResponseDTO {
  creatorName?: string;
  creatorEmail?: string;
  attemptCount?: number;
}

/**
 * Query filter for prompts
 * @example {
 *   "skillType": "SPEAKING",
 *   "difficulty": "INTERMEDIATE",
 *   "limit": 10,
 *   "offset": 0
 * }
 */
export class PromptFilterDTO {
  skillType?: SkillType;
  difficulty?: DifficultyLevel;
  limit?: number;
  offset?: number;
}
