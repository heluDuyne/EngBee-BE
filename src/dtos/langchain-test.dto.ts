/**
 * LangChain Test DTOs
 * DTOs for testing the AI scoring function directly
 */

import { ScoringWeightsDTO } from "./ai-rule.dto";

/**
 * Inline AI Rule configuration for testing
 * Allows testing without requiring an existing AIRule in the database
 * @example {
 *   "name": "Test Rule",
 *   "modelId": "gpt-3.5-turbo",
 *   "rubricId": "ielts_speaking",
 *   "weights": {
 *     "fluency": 0.2,
 *     "coherence": 0.2,
 *     "lexical": 0.2,
 *     "grammar": 0.2,
 *     "pronunciation": 0.2
 *   },
 *   "strictness": 1.0
 * }
 */
export class TestAIRuleDTO {
  /**
   * Rule name (for identification)
   * @default "Test Rule"
   */
  name?: string;

  /**
   * Description of the test rule
   */
  description?: string;

  /**
   * Model ID to use (e.g., "gpt-3.5-turbo", "gpt-4")
   * @default "gpt-3.5-turbo"
   */
  modelId?: string;

  /**
   * Rubric ID to apply
   * @default "ielts_speaking"
   */
  rubricId?: string;

  /**
   * Scoring weights for each criterion
   */
  weights!: ScoringWeightsDTO;

  /**
   * Strictness multiplier (1.0 = normal, >1.0 = stricter, <1.0 = lenient)
   * @min 0.1
   * @max 2.0
   * @default 1.0
   */
  strictness?: number;

  /**
   * Extra configuration options
   */
  extraConfig?: Record<string, any>;
}

/**
 * Test Scoring Request DTO
 * Request body for testing the IELTS speaking scoring function
 * @example {
 *   "transcript": "Well, I think technology has changed our lives significantly...",
 *   "aiRule": {
 *     "weights": {
 *       "fluency": 0.2,
 *       "coherence": 0.2,
 *       "lexical": 0.2,
 *       "grammar": 0.2,
 *       "pronunciation": 0.2
 *     },
 *     "strictness": 1.0
 *   },
 *   "additionalPrompt": "Focus on vocabulary range and accuracy"
 * }
 */
export class TestScoringRequestDTO {
  /**
   * The student's speaking transcript to evaluate
   * @minLength 10
   */
  transcript!: string;

  /**
   * AI Rule configuration for scoring
   */
  aiRule!: TestAIRuleDTO;

  /**
   * Additional instructions to append to the scoring prompt
   * Use this to customize the evaluation focus or add specific criteria
   * @example "Pay special attention to use of idiomatic expressions"
   */
  additionalPrompt?: string;
}

/**
 * AI Score Response DTO
 * Response structure from the AI scoring function
 */
export class AIScoreResponseDTO {
  /**
   * Overall IELTS band score (0-9)
   */
  overallBand!: number;

  /**
   * Fluency score (0-9)
   */
  fluency!: number;

  /**
   * Coherence score (0-9)
   */
  coherence!: number;

  /**
   * Lexical resource score (0-9)
   */
  lexical!: number;

  /**
   * Grammar score (0-9)
   */
  grammar!: number;

  /**
   * Pronunciation score (0-9)
   */
  pronunciation!: number;

  /**
   * Detailed feedback
   */
  feedback!: {
    /**
     * Identified strengths in the response
     */
    strengths: string;

    /**
     * Issues or areas for improvement
     */
    issues: string;

    /**
     * Recommended actions for improvement
     */
    actions: string;
  };
}

/**
 * Test Scoring Response DTO
 * Complete response for the test scoring endpoint
 */
export class TestScoringResponseDTO {
  /**
   * The scoring result
   */
  result!: AIScoreResponseDTO;

  /**
   * The AI rule configuration used
   */
  ruleUsed!: {
    name: string;
    modelId: string;
    rubricId: string;
    weights: ScoringWeightsDTO;
    strictness: number;
  };

  /**
   * Processing metadata
   */
  metadata!: {
    /**
     * Processing time in milliseconds
     */
    processingTimeMs: number;

    /**
     * Timestamp of the scoring
     */
    scoredAt: string;

    /**
     * Whether additional prompt was applied
     */
    additionalPromptApplied: boolean;
  };
}
