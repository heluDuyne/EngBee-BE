import { NotificationType } from "../enums";

export interface CreateNotificationDTO {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  link?: string;
}

export interface NotificationResponseDTO {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  link?: string;
  isRead: boolean;
  createdAt: Date;
}
