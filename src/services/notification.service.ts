import { AppDataSource } from "../data-source";
import { Notification } from "../entities/Notification";
import { CreateNotificationDTO, NotificationResponseDTO } from "../dtos/notification.dto";
import { NotFoundException } from "../exceptions/HttpException";

export class NotificationService {
  private notificationRepository = AppDataSource.getRepository(Notification);

  async createNotification(dto: CreateNotificationDTO): Promise<Notification> {
    const notification = this.notificationRepository.create(dto);
    return await this.notificationRepository.save(notification);
  }

  async getUserNotifications(userId: string): Promise<NotificationResponseDTO[]> {
    const notifications = await this.notificationRepository.find({
      where: { userId },
      order: { createdAt: "DESC" },
    });
    return notifications.map(this.mapToResponseDTO);
  }

  async markAsRead(notificationId: string, userId: string): Promise<NotificationResponseDTO> {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId, userId },
    });
    if (!notification) throw new NotFoundException("Notification not found");

    notification.isRead = true;
    await this.notificationRepository.save(notification);
    return this.mapToResponseDTO(notification);
  }

  private mapToResponseDTO(n: Notification): NotificationResponseDTO {
    return {
      id: n.id,
      title: n.title,
      message: n.message,
      type: n.type,
      link: n.link,
      isRead: n.isRead,
      createdAt: n.createdAt,
    };
  }
}
