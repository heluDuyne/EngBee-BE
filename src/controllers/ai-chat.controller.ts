import { Controller, Post, Route, Body, Tags, Response, Security, Request } from "tsoa";
import { aiChatService } from "../services/ai-chat.service";
import { ChatRequestDTO, ChatResponseDTO } from "../dtos/ai-chat.dto";
import { AuthRequest } from "../middleware/auth.middleware";

@Route("/ai-chat")
@Tags("AIChat")
export class AIChatController extends Controller {
  @Post()
  @Security("bearer")
  @Response(200, "Success")
  @Response(401, "Unauthorized")
  @Response(500, "Internal Server Error")
  async chat(@Body() requestDTO: ChatRequestDTO, @Request() request: AuthRequest): Promise<ChatResponseDTO> {
    try {
      const userId = request.user?.id;
      if (!userId) {
        this.setStatus(401);
        throw new Error("Unauthorized");
      }
      
      const reply = await aiChatService.generateResponse(userId, requestDTO.message, requestDTO.history);
      return { reply };
    } catch (error: any) {
      this.setStatus(error.status || 500);
      throw new Error(error.message || "Failed to generate AI response");
    }
  }
}
