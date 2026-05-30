import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import { ChatParticipant } from "./ChatParticipant";
import { ChatMessage } from "./ChatMessage";

export enum ConversationType {
  DIRECT = "DIRECT",
  CLASS = "CLASS",
}

@Entity("chat_conversations")
export class ChatConversation {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({
    type: "enum",
    enum: ConversationType,
    default: ConversationType.DIRECT,
  })
  type!: ConversationType;

  @Column({ type: "uuid", nullable: true })
  classId?: string; // Links to Class if type is CLASS

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;

  @OneToMany(() => ChatParticipant, (participant) => participant.conversation)
  participants!: ChatParticipant[];

  @OneToMany(() => ChatMessage, (message) => message.conversation)
  messages!: ChatMessage[];
}
