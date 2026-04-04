import {
  Post,
  Route,
  Body,
  Response,
  Tags,
  Example,
} from "tsoa";
import { BaseController, ApiResponse } from "./base.controller";
import { langchainService, AIScoreResponse } from "../services/langchain.service";
import { AIRule } from "../entities/AIRule";
import {
  TestScoringRequestDTO,
  TestScoringResponseDTO,
  AIScoreResponseDTO,
} from "../dtos/langchain-test.dto";

/**
 * Sample request body for testing
 */
const SAMPLE_REQUEST: TestScoringRequestDTO = {
  transcript: "I think technology is important because it helps us communicate better and work more efficiently every day.",
  aiRule: {
    name: "Test Rule",
    modelId: "gpt-3.5-turbo",
    rubricId: "ielts_speaking",
    weights: {
      fluency: 0.2,
      coherence: 0.2,
      lexical: 0.2,
      grammar: 0.2,
      pronunciation: 0.2,
    },
    strictness: 1.0,
  },
  additionalPrompt: "Focus on grammar and vocabulary.",
};

@Route("/langchain")
@Tags("LangChain Test")
export class LangchainController extends BaseController {
  /**
   * Test IELTS Speaking Scoring
   *
   * This endpoint allows direct testing of the AI scoring function without
   * requiring an existing AIRule in the database. Useful for:
   * - Testing different scoring configurations
   * - Experimenting with additional prompts
   * - Debugging scoring behavior
   *
   * @summary Test the IELTS speaking scoring function directly
   */
  @Post("/test-scoring")
  @Response(200, "Scoring completed successfully")
  @Response(400, "Invalid request - check transcript or AI rule configuration")
  @Response(500, "AI service error")
  @Example<TestScoringRequestDTO>(SAMPLE_REQUEST)
  async testScoring(
    @Body() dto: TestScoringRequestDTO
  ): Promise<ApiResponse<TestScoringResponseDTO | null>> {
    return this.handleAsync(async () => {
      const startTime = Date.now();

      // Build AIRule-like object from DTO
      const aiRule: AIRule = {
        id: "test-rule-" + Date.now(),
        name: dto.aiRule.name || "Test Rule",
        description: dto.aiRule.description,
        modelId: dto.aiRule.modelId || "gpt-3.5-turbo",
        rubricId: dto.aiRule.rubricId || "ielts_speaking",
        weights: dto.aiRule.weights,
        strictness: dto.aiRule.strictness ?? 1.0,
        extraConfig: dto.aiRule.extraConfig,
        isActive: true,
        teacherId: "test-teacher",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Call the scoring service
      const result = await langchainService.scoreIELTSSpeaking(
        dto.transcript,
        aiRule,
        dto.additionalPrompt
      );

      const processingTimeMs = Date.now() - startTime;

      // Build response
      const response: TestScoringResponseDTO = {
        result: result as AIScoreResponseDTO,
        ruleUsed: {
          name: aiRule.name,
          modelId: aiRule.modelId,
          rubricId: aiRule.rubricId,
          weights: aiRule.weights,
          strictness: aiRule.strictness,
        },
        metadata: {
          processingTimeMs,
          scoredAt: new Date().toISOString(),
          additionalPromptApplied: !!dto.additionalPrompt,
        },
      };

      return response;
    }, "Scoring completed successfully");
  }

  /**
   * Test Scoring with Minimal Config
   *
   * Simplified endpoint that uses default AI rule settings.
   * Only requires the transcript - useful for quick testing.
   *
   * @summary Quick test with default scoring configuration
   */
  @Post("/test-scoring/quick")
  @Response(200, "Scoring completed successfully")
  @Response(400, "Invalid request - transcript required")
  @Response(500, "AI service error")
  async quickTestScoring(
    @Body() body: { transcript: string; additionalPrompt?: string }
  ): Promise<ApiResponse<AIScoreResponse | null>> {
    return this.handleAsync(async () => {
      // Use default AIRule configuration
      const defaultAiRule: AIRule = {
        id: "default-test-rule",
        name: "Default Test Rule",
        description: "Default configuration for quick testing",
        modelId: "gpt-3.5-turbo",
        rubricId: "ielts_speaking",
        weights: {
          fluency: 0.2,
          coherence: 0.2,
          lexical: 0.2,
          grammar: 0.2,
          pronunciation: 0.2,
        },
        strictness: 1.0,
        isActive: true,
        teacherId: "test-teacher",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await langchainService.scoreIELTSSpeaking(
        body.transcript,
        defaultAiRule,
        body.additionalPrompt
      );

      return result;
    }, "Quick scoring completed successfully");
  }

  /**
   * Get Sample Request Body
   *
   * Returns a sample request body that can be used with the test-scoring endpoint.
   * Useful for understanding the expected request format.
   *
   * @summary Get a sample request body for testing
   */
  @Post("/sample-request")
  @Response(200, "Sample request returned")
  async getSampleRequest(): Promise<ApiResponse<TestScoringRequestDTO>> {
    return this.successResponse(SAMPLE_REQUEST, "Sample request body");
  }
}
