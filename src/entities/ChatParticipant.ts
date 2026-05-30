import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  UpdateDateColumn,
} from "typeorm";
import { User } from "./User";
import { ChatConversation } from "./ChatConversation";

@Entity("chat_participants")
export class ChatParticipant {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid", name: "conversation_id" })
  conversationId!: string;

  @Column({ type: "uuid", name: "user_id" })
  userId!: string;

  @Column({ type: "int", default: 0 })
  unreadCount!: number;

  @Column({ type: "timestamp", nullable: true })
  lastReadAt?: Date;

  @CreateDateColumn({ name: "joined_at" })
  joinedAt!: Date;
  
  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => ChatConversation, (conv) => conv.participants, { onDelete: "CASCADE" })
  @JoinColumn({ name: "conversation_id" })
  conversation!: ChatConversation;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;
}
