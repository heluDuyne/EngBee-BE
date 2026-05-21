import {
  Controller,
  Get,
  Patch,
  Route,
  Path,
  Tags,
  Security,
  Request,
} from "tsoa";
import { NotificationResponseDTO } from "../dtos/notification.dto";
import { NotificationService } from "../services/notification.service";
import { Authenticated } from "../decorators/auth.decorator";

@Route("/notifications")
@Tags("Notification")
export class NotificationController extends Controller {
  private notificationService = new NotificationService();

  @Get()
  @Security("bearer")
  @Authenticated()
  async getMyNotifications(
    @Request() req: any
  ): Promise<NotificationResponseDTO[]> {
    return await this.notificationService.getUserNotifications(req.user.id);
  }

  @Patch("{id}/read")
  @Security("bearer")
  @Authenticated()
  async markAsRead(
    @Path() id: string,
    @Request() req: any
  ): Promise<NotificationResponseDTO> {
    return await this.notificationService.markAsRead(id, req.user.id);
  }
}
