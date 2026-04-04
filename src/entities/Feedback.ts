import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { Attempt } from "./Attempt";
import { User } from "./User";

export enum FeedbackType {
  AI_GENERATED = "ai_generated",
  TEACHER_COMMENT = "teacher_comment",
}

export enum FeedbackVisibility {
  PRIVATE_TO_TEACHER = "private_to_teacher",
  TEACHER_AND_LEARNER = "teacher_and_learner",
}

@Entity("feedbacks")
@Index("idx_feedback_attempt", ["attemptId"])
@Index("idx_feedback_author", ["authorId"])
@Index("idx_feedback_created", ["createdAt"])
export class Feedback {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  attemptId!: string;

  @Column({ type: "uuid" })
  authorId!: string;

  @Column({
    type: "enum",
    enum: FeedbackType,
  })
  type!: FeedbackType;

  @Column({ type: "text" })
  content!: string;

  @Column({
    type: "enum",
    enum: FeedbackVisibility,
  })
  visibility!: FeedbackVisibility;

  @Column({ type: "jsonb", nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => Attempt, (attempt) => attempt.feedbacks, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "attempt_id" })
  attempt!: Attempt;

  @ManyToOne(() => User, (user) => user.feedbacks, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "author_id" })
  author!: User;
}
