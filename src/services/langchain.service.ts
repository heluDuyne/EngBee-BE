import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { JsonOutputParser } from "@langchain/core/output_parsers";
import { AIRule } from "../entities/AIRule";
import { NotFoundException, ConflictException, InternalServerErrorException, BadRequestException } from "../exceptions/HttpException";

/**
 * Score response structure from the AI model
 */
export interface AIScoreResponse {
  overallBand: number;
  fluency: number;
  coherence: number;
  lexical: number;
  grammar: number;
  pronunciation: number;
  feedback: {
    strengths: string;
    issues: string;
    actions: string;
  };
}

export class LangchainService {
  private model: ChatOpenAI;

  constructor() {
    this.model = new ChatOpenAI({
      modelName: "gpt-3.5-turbo",
      temperature: 0.7,
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Score an IELTS speaking transcript using the AI model with teacher-defined rules
   */
  async scoreIELTSSpeaking(
    transcript: string,
    aiRule: AIRule,
    promptContent?: string
  ): Promise<AIScoreResponse> {
    // Create the prompt template with LangChain
    const promptTemplate = PromptTemplate.fromTemplate(`You are an IELTS Speaking examiner.

Use the official IELTS Speaking Public Band Descriptors.

Apply the following teacher-defined scoring rule:
- Fluency & Coherence weight: {fluency_weight}
- Lexical Resource weight: {lexical_weight}
- Grammatical Range & Accuracy weight: {grammar_weight}
- Pronunciation weight: {pronunciation_weight}
- Strictness multiplier: {strictness}

Rubric: {rubric_id}

Prompt/Question:
{prompt_content}

Evaluate the student's performance based on the transcript below:

TRANSCRIPT:
{transcript}

IMPORTANT:
- Your scoring MUST follow IELTS criteria (bands 0-9).
- You MUST return JSON only.
- Do NOT include explanations outside JSON.
- Apply strictness by reducing each band slightly based on strictness value.
  - strictness 1.0 = normal scoring
  - strictness > 1.0 = stricter (reduce bands by (strictness - 1) * 0.5)
  - strictness < 1.0 = more lenient (increase bands proportionally)
- Ensure all band scores are between 0 and 9.
- Weights represent relative importance; use them to calibrate your assessment focus.

Return JSON with this exact structure:

{
  "overallBand": number,
  "fluency": number,
  "lexical": number,
  "grammar": number,
  "pronunciation": number,
  "feedback": {
    "strengths": string,
    "issues": string,
    "actions": string
  }
}`);

    // Parse the output as JSON
    const parser = new JsonOutputParser<AIScoreResponse>();

    // Create the chain
    const chain = promptTemplate.pipe(this.model).pipe(parser);

    // Format the weights from AIRule
    const weights = aiRule.weights as any;

    // Execute the chain with the AI rule configuration
    const result = await chain.invoke({
      fluency_weight: weights.fluency,
      // coherence_weight removed/merged
      lexical_weight: weights.lexical,
      grammar_weight: weights.grammar,
      pronunciation_weight: weights.pronunciation || 0.2,
      strictness: aiRule.strictness,
      rubric_id: aiRule.rubricId,
      transcript,
      prompt_content: promptContent || "No specific prompt provided.",
    });

    // Validate the response structure
    this.validateScoreResponse(result);

    return result as AIScoreResponse;
  }

  /**
   * Score an IELTS writing submission (Task 1 or Task 2)
   */
  async scoreIELTSWriting(
    submissionText: string,
    aiRule: AIRule,
    promptContent?: string
  ): Promise<any> {
    const promptTemplate = PromptTemplate.fromTemplate(`You are an IELTS Writing examiner.

Use the official IELTS Writing Band Descriptors.

Apply the following teacher-defined scoring rule:
- Task Achievement/Response weight: {task_response_weight}
- Coherence & Cohesion weight: {coherence_weight}
- Lexical Resource weight: {lexical_weight}
- Grammatical Range & Accuracy weight: {grammar_weight}
- Strictness multiplier: {strictness}

Rubric: {rubric_id}

Prompt/Question:
{prompt_content}

Evaluate the student's writing submission below:

SUBMISSION:
{submission_text}

IMPORTANT:
- Your scoring MUST follow IELTS criteria (bands 0-9).
- You MUST return JSON only.
- Do NOT include explanations outside JSON.
- Apply strictness logic as defined.
- Ensure all band scores are between 0 and 9.

Return JSON with this exact structure:

{
  "overallBand": number,
  "task_achievement": number,
  "coherence_cohesion": number,
  "lexical": number,
  "grammatical": number,
  "feedback": {
    "strengths": string,
    "issues": string,
    "actions": string
  }
}`);

    const parser = new JsonOutputParser<any>();
    const chain = promptTemplate.pipe(this.model).pipe(parser);
    const weights = aiRule.weights as any;

    const result = await chain.invoke({
        task_response_weight: weights.taskResponse || 0.25,
        coherence_weight: weights.coherence || 0.25,
        lexical_weight: weights.lexical || 0.25,
        grammar_weight: weights.grammar || 0.25,
        strictness: aiRule.strictness,
        rubric_id: aiRule.rubricId,
        submission_text: submissionText,
        prompt_content: promptContent || "No specific prompt provided.",
    });

    // Basic validation
    if (!result.overallBand || !result.feedback) {
         throw new BadRequestException("AI returned incomplete scoring data.");
    }

    return result;
  }

  /**
   * Validate that the score response has the required structure and valid values
   */
  private validateScoreResponse(response: any): void {
    const requiredFields = ["overallBand", "fluency", "lexical", "grammar", "pronunciation", "feedback"];

    for (const field of requiredFields) {
      if (!(field in response)) {
        throw new BadRequestException(`Missing required field in AI response: ${field}`);
      }
    }

    // Validate band scores are between 0-9
    const bandFields = ["overallBand", "fluency", "lexical", "grammar", "pronunciation"];
    for (const field of bandFields) {
      const value = response[field];
      if (typeof value !== "number" || value < 0 || value > 9) {
        throw new BadRequestException(`Invalid band score for ${field}: ${value}. Must be between 0 and 9`);
      }
    }

    // Validate feedback structure
    if (!response.feedback || typeof response.feedback !== "object") {
      throw new BadRequestException("Feedback must be an object");
    }

    const feedbackFields = ["strengths", "issues", "actions"];
    for (const field of feedbackFields) {
      if (typeof response.feedback[field] !== "string") {
        throw new BadRequestException(`Feedback.${field} must be a string`);
      }
    }
  }
}

export const langchainService = new LangchainService();
