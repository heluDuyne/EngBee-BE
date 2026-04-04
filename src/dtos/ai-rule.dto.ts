/**
 * AI Rule DTOs
 * Scoring rules configured by teachers for AI-powered assessment
 */

/**
 * Scoring weights for AI evaluation
 * @example {
 *   "fluency": 0.25,
 *   "coherence": 0.25,
 *   "lexical": 0.25,
 *   "grammar": 0.25
 * }
 */
export class ScoringWeightsDTO {
  /**
   * Fluency score weight (0-1)
   * @min 0
   * @max 1
   */
  fluency!: number;

  /**
   * Coherence score weight (0-1)
   * @min 0
   * @max 1
   */
  coherence!: number;

  /**
   * Lexical score weight (0-1)
   * @min 0
   * @max 1
   */
  lexical!: number;

  /**
   * Grammar score weight (0-1)
   * @min 0
   * @max 1
   */
  grammar!: number;

  /**
   * Pronunciation score weight (0-1, optional)
   * @min 0
   * @max 1
   */
  pronunciation?: number;
}

/**
 * Create AI Rule DTO
 * @example {
 *   "name": "Standard IELTS Speaking Rule",
 *   "modelId": "gpt-4",
 *   "rubricId": "ielts_speaking",
 *   "weights": {
 *     "fluency": 0.25,
 *     "coherence": 0.25,
 *     "lexical": 0.25,
 *     "grammar": 0.25
 *   },
 *   "strictness": 1.0,
 *   "extraConfig": {
 *     "temperature": 0.7,
 *     "top_p": 0.9
 *   }
 * }
 */
export class CreateAIRuleDTO {
  /**
   * Rule name
   * @minLength 1
   * @maxLength 255
   */
  name!: string;

  /**
   * Rule description
   */
  description?: string;

  /**
   * Model ID (e.g., "qwen2-7b-finetuned", "gpt-4", "claude-3")
   * @minLength 1
   * @maxLength 255
   */
  modelId!: string;

  /**
   * Rubric ID (e.g., "ielts_speaking", default: "ielts_speaking")
   * @minLength 1
   * @maxLength 255
   */
  rubricId?: string;

  /**
   * Scoring weights - must sum to approximately 1.0 (tolerance: ±0.1)
   */
  weights!: ScoringWeightsDTO;

  /**
   * Strictness multiplier (default: 1.0)
   * @min 0.1
   * @max 2.0
   */
  strictness?: number;

  /**
   * Extra model configuration (e.g., temperature, top_p)
   */
  extraConfig?: Record<string, any>;
}


export class UpdateAIRuleDTO {
  name?: string;
  description?: string;
  modelId?: string;
  rubricId?: string;
  weights?: ScoringWeightsDTO;
  strictness?: number;
  extraConfig?: Record<string, any>;
  isActive?: boolean;
}

export class AIRuleResponseDTO {
  id!: string;
  teacherId!: string;
  name!: string;
  description?: string;
  modelId!: string;
  rubricId!: string;
  weights!: ScoringWeightsDTO;
  strictness!: number;
  extraConfig?: Record<string, any>;
  isActive!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
}

export class AIRuleListDTO {
  id!: string;
  name!: string;
  modelId!: string;
  rubricId!: string;
  strictness!: number;
  isActive!: boolean;
  createdAt!: Date;
}


export class AIRuleFilterDTO {
  teacherId?: string;
  isActive?: boolean;
  modelId?: string;
  limit?: number;
  offset?: number;
}
