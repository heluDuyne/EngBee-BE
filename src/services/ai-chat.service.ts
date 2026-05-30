import { AppDataSource } from "../data-source";
import { User } from "../entities/User";
import { Attempt } from "../entities/Attempt";

export class AIChatService {
  async generateResponse(userId: string, message: string, history: { role: string; content: string }[]): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured on the server");
    }

    // Fetch user context
    const userRepository = AppDataSource.getRepository(User);
    const attemptRepository = AppDataSource.getRepository(Attempt);
    
    const user = await userRepository.findOne({
      where: { id: userId },
      relations: ["enrolledClasses", "enrolledCourses"]
    });

    const recentAttempts = await attemptRepository.find({
      where: { learnerId: userId },
      order: { createdAt: "DESC" },
      take: 5,
      relations: ["practice", "assignment", "score"]
    });

    // Build the context string
    let contextStr = "Here is some context about the student you are helping:\n";
    if (user) {
      if (user.firstName || user.lastName) contextStr += `- Name: ${user.firstName || ''} ${user.lastName || ''}\n`;
      if (user.enrolledClasses && user.enrolledClasses.length > 0) {
        contextStr += `- Enrolled Classes: ${user.enrolledClasses.map(c => c.name).join(", ")}\n`;
      }
      if (user.enrolledCourses && user.enrolledCourses.length > 0) {
        contextStr += `- Enrolled Courses: ${user.enrolledCourses.map(c => c.title).join(", ")}\n`;
      }
    }
    
    if (recentAttempts.length > 0) {
      contextStr += `- Recent Practice/Assignments:\n`;
      recentAttempts.forEach((attempt, index) => {
        const title = attempt.practice?.title || attempt.assignment?.title || 'Unknown Task';
        const scoreStr = attempt.score ? `Score: ${attempt.score.overallBand}` : 'Not scored yet';
        contextStr += `  ${index + 1}. ${title} (${attempt.skillType}) - Status: ${attempt.status} - ${scoreStr}\n`;
      });
    }

    const contents = history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    contents.push({
      role: 'user',
      parts: [{ text: message }],
    });

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        systemInstruction: {
          parts: [{ text: "You are a friendly and knowledgeable AI English Tutor. You help users improve their English grammar, vocabulary, writing, and listening skills. Keep your answers concise, encouraging, and formatted clearly.\n\n" + contextStr }]
        }
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API Error: ${errText}`);
    }

    const data: any = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!reply) {
      throw new Error('Invalid response from Gemini API');
    }

    return reply;
  }
}

export const aiChatService = new AIChatService();
