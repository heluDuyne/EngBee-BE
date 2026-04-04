import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import axios from "axios";
import { InternalServerErrorException } from "../exceptions/HttpException";

export interface AIScoreResponse {
  overallBand: number;
  fluency: number;
  coherence: number;
  lexical: number;
  grammar: number;
  pronunciation: number;
  transcript: string;
  feedback: {
    strengths: string;
    issues: string;
    actions: string;
  };
}

export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not set");
    }
    this.genAI = new GoogleGenerativeAI(apiKey || "");
    this.model = this.genAI.getGenerativeModel({
      model: "gemini-flash-latest",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            overallBand: { type: SchemaType.NUMBER },
            fluency: { type: SchemaType.NUMBER },
            coherence: { type: SchemaType.NUMBER },
            lexical: { type: SchemaType.NUMBER },
            grammar: { type: SchemaType.NUMBER },
            pronunciation: { type: SchemaType.NUMBER },
            transcript: { type: SchemaType.STRING },
            feedback: {
              type: SchemaType.OBJECT,
              properties: {
                strengths: { type: SchemaType.STRING },
                issues: { type: SchemaType.STRING },
                actions: { type: SchemaType.STRING },
              },
              required: ["strengths", "issues", "actions"],
            },
          },
          required: [
            "overallBand",
            "fluency",
            "coherence",
            "lexical",
            "grammar",
            "pronunciation",
            "transcript",
            "feedback",
          ],
        },
      },
    });
  }

  /**
   * Transform Cloudinary URL to request MP3 format
   * Cloudinary supports format transformation via URL manipulation
   */
  private transformToMP3Url(url: string): string {
    // Check if it's a Cloudinary URL
    if (url.includes('cloudinary.com')) {
      // Cloudinary URL pattern: .../upload/v123456/filename.ext
      // Transform to: .../upload/f_mp3/v123456/filename.mp3
      
      // Insert format transformation parameter
      const transformed = url.replace('/upload/', '/upload/f_mp3,q_auto/');
      
      // Also change the file extension to .mp3
      const mp3Url = transformed.replace(/\.(webm|wav|m4a|ogg)$/i, '.mp3');
      
      console.log(`[GeminiService] Transformed URL: ${url} -> ${mp3Url}`);
      return mp3Url;
    }
    
    // If not Cloudinary, return as-is
    return url;
  }

  async evaluateAudio(audioUrl: string, promptText?: string): Promise<AIScoreResponse> {
    try {
      // Transform URL to MP3 format if it's a Cloudinary URL
      const mp3Url = this.transformToMP3Url(audioUrl);
      
      // 1. Fetch audio buffer from URL
      const response = await axios.get(mp3Url, { responseType: "arraybuffer" });
      const audioBuffer = Buffer.from(response.data);
      const base64Audio = audioBuffer.toString("base64");
      console.log(`[GeminiService] Audio Buffer Size: ${audioBuffer.length} bytes, Base64 Length: ${base64Audio.length}`);

      // Force MP3 MIME type for Gemini
      const mimeType = "audio/mp3";
      console.log(`[GeminiService] Using MIME Type: ${mimeType}`);

      // 2. Prepare Part
      const audioPart = {
        inlineData: {
          data: base64Audio,
          mimeType: mimeType, 
        },
      };

      // 3. Prompt
      const prompt = `
       You are an expert IELTS Speaking examiner. Initialize strict grading.
Listen to the student's response carefully.

${promptText ? `Task/Topic: "${promptText}"` : ""}

Task:
1. Transcribe the audio verbatim into a field called "transcript".
2. Evaluate the speaking performance based on official IELTS Speaking criteria:
   - Fluency & Coherence
   - Lexical Resource
   - Grammatical Range & Accuracy
   - Pronunciation
3. Provide discrete scores for EACH criterion (0.0 - 9.0 in 0.5 increments).
4. Calculate overallBand as the exact average of the four scores, rounded to the nearest 0.5.
5. Provide detailed feedback, including:
   - Strengths
   - Weaknesses
   - Specific improvement suggestions
6. If the response is too short, unclear, or off-topic, penalize accordingly.

Output must be strictly JSON matching the schema provided.
ENSURE "fluency", "coherence", "lexical", "grammar", and "pronunciation" are all present and non-null.
      `;

      // 4. Generate Content
      const result = await this.model.generateContent([prompt, audioPart]);
      const responseText = result.response.text();
      
      const parsed = JSON.parse(responseText);
      return parsed as AIScoreResponse;
    } catch (error) {
      console.error("Gemini Evaluation Failed:", error);
      throw new InternalServerErrorException("Failed to evaluate audio with AI");
    }
  }
  async evaluateWriting(text: string, promptText: string): Promise<AIWritingScoreResponse> {
    try {
      const writingModel = this.genAI.getGenerativeModel({
        model: "gemini-flash-latest",
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: SchemaType.OBJECT,
            properties: {
              overallBand: { type: SchemaType.NUMBER },
              taskResponse: { type: SchemaType.NUMBER },
              coherence: { type: SchemaType.NUMBER },
              lexical: { type: SchemaType.NUMBER },
              grammar: { type: SchemaType.NUMBER },
              feedback: {
                type: SchemaType.OBJECT,
                properties: {
                  strengths: { type: SchemaType.STRING },
                  issues: { type: SchemaType.STRING },
                  actions: { type: SchemaType.STRING },
                },
                required: ["strengths", "issues", "actions"],
              },
            },
            required: [
              "overallBand",
              "taskResponse",
              "coherence",
              "lexical",
              "grammar",
              "feedback",
            ],
          },
        },
      });

      const prompt = `
        You are an expert IELTS Writing examiner. Initialize strict grading.
        
        Topic/Prompt: "${promptText}"
        
        Student Submission:
        "${text}"
        
        Task:
        1. Evaluate the writing performance based on official IELTS Writing criteria:
           - Task Response
           - Coherence & Cohesion
           - Lexical Resource
           - Grammatical Range & Accuracy
        2. Provide discrete scores for EACH criterion (0.0 - 9.0 in 0.5 increments).
        3. Calculate overallBand as the exact average of the four scores, rounded to the nearest 0.5.
        4. Provide detailed feedback.
        
        Output must be strictly JSON matching the schema provided.
        ENSURE "taskResponse", "coherence", "lexical", and "grammar" are all present and non-null.
      `;

      const result = await writingModel.generateContent(prompt);
      const responseText = result.response.text();
      
      console.log(`[GeminiService] Writing Evaluation Raw Response: ${responseText}`);

      const parsed = JSON.parse(responseText) as AIWritingScoreResponse;

      // Validation
      const requiredFields = ['taskResponse', 'coherence', 'lexical', 'grammar'];
      const missingFields = requiredFields.filter(field => parsed[field as keyof AIWritingScoreResponse] === undefined);
      
      if (missingFields.length > 0) {
          console.warn(`[GeminiService] Warning: Missing fields in AI response: ${missingFields.join(', ')}`);
          // Could implement fallback or re-try here if critical
      }

      return parsed;
    } catch (error) {
      console.error("Gemini Writing Evaluation Failed:", error);
      throw new InternalServerErrorException("Failed to evaluate writing with AI");
    }
  }
}

export interface AIWritingScoreResponse {
  overallBand: number;
  taskResponse: number;
  coherence: number;
  lexical: number;
  grammar: number;
  feedback: {
    strengths: string;
    issues: string;
    actions: string;
  };
}

export const geminiService = new GeminiService();

