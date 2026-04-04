/**
 * Score DTOs
 */

/**
 * @example {
 *   "attemptId": "attempt-123",
 *   "fluency": 7,
 *   "coherence": 7,
 *   "pronunciation": 6.5,
 *   "lexical": 7.5,
 *   "grammar": 7,
 *   "overallBand": 7,
 *   "feedback": "Good overall performance with room for improvement in pronunciation",
 *   "detailedFeedback": {"areas_strength": ["good_vocabulary"], "areas_improvement": ["pronunciation"]}
 * }
 */
export class CreateScoreDTO {
  /**
   * ID of the attempt being scored
   */
  attemptId!: string;

  /**
   * Fluency score
   * @min 0
   * @max 9
   */
  fluency!: number;

  /**
   * Coherence score
   * @min 0
   * @max 9
   */
  coherence!: number;

  /**
   * Pronunciation score
   * @min 0
   * @max 9
   */
  pronunciation!: number;

  /**
   * Lexical score
   * @min 0
   * @max 9
   */
  lexical!: number;

  /**
   * Grammar score
   * @min 0
   * @max 9
   */
  grammar!: number;

  /**
   * Overall IELTS band score
   * @min 5
   * @max 9
   */
  overallBand!: number;

  /**
   * General feedback comment
   */
  feedback!: string;

  /**
   * Detailed feedback object with analysis
   */
  detailedFeedback?: Record<string, any>;
}

/**
 * @example {
 *   "fluency": 7.5,
 *   "coherence": 7.5,
 *   "overallBand": 7.5
 * }
 */
export class UpdateScoreDTO {
  fluency?: number;
  coherence?: number;
  pronunciation?: number;
  lexical?: number;
  grammar?: number;
  overallBand?: number;
  feedback?: string;
  detailedFeedback?: Record<string, any>;
}

/**
 * @example {
 *   "id": "score-123",
 *   "attemptId": "attempt-123",
 *   "fluency": 7,
 *   "coherence": 7,
 *   "pronunciation": 6.5,
 *   "lexical": 7.5,
 *   "grammar": 7,
 *   "overallBand": 7,
 *   "feedback": "Good overall performance with room for improvement in pronunciation",
 *   "createdAt": "2024-11-14T11:00:00Z"
 * }
 */
export class ScoreResponseDTO {
  id!: string;
  attemptId!: string;
  fluency!: number;
  coherence!: number;
  pronunciation!: number;
  lexical!: number;
  grammar!: number;
  overallBand!: number;
  feedback!: string;
  detailedFeedback?: Record<string, any>;
  createdAt!: Date;
}

/**
 * @example {
 *   "id": "score-123",
 *   "attemptId": "attempt-123",
 *   "overallBand": 7,
 *   "createdAt": "2024-11-14T11:00:00Z"
 * }
 */
export class ScoreListDTO {
  id!: string;
  attemptId!: string;
  overallBand!: number;
  createdAt!: Date;
}

/**
 * Score with attempt and prompt details
 * @example {
 *   "id": "score-123",
 *   "attemptId": "attempt-123",
 *   "fluency": 7,
 *   "coherence": 7,
 *   "pronunciation": 6.5,
 *   "lexical": 7.5,
 *   "grammar": 7,
 *   "overallBand": 7,
 *   "feedback": "Good overall performance",
 *   "attemptDate": "2024-11-14T10:00:00Z",
 *   "promptContent": "Describe your hometown",
 *   "skillType": "SPEAKING",
 *   "createdAt": "2024-11-14T11:00:00Z"
 * }
 */
export class ScoreDetailDTO extends ScoreResponseDTO {
  attemptDate?: Date;
  promptContent?: string;
  skillType?: string;
}

/**
 * Pagination parameters
 * @example {
 *   "limit": 10,
 *   "offset": 0
 * }
 */
export class ScorePaginationDTO {
  limit?: number;
  offset?: number;
}
