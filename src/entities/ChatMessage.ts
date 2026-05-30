import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { User } from "./User";
import { ChatConversation } from "./ChatConversation";

@Entity("chat_messages")
@Index("idx_chat_messages_created_at", ["createdAt"])
export class ChatMessage {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid", name: "sender_id" })
  senderId!: string;

  @Column({ type: "uuid", name: "conversation_id" })
  conversationId!: string;

  @Column({ type: "text" })
  content!: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  // Relations
  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "sender_id" })
  sender!: User;

  @ManyToOne(() => ChatConversation, (conv) => conv.messages, { onDelete: "CASCADE" })
  @JoinColumn({ name: "conversation_id" })
  conversation!: ChatConversation;
}
