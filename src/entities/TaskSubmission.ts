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
import { TaskAssignment } from "./TaskAssignment";
import { User } from "./User";
import { TaskSubmissionStatus } from "../enums";

@Entity("task_submissions")
@Index("idx_task_sub_assignment", ["assignmentId"])
@Index("idx_task_sub_learner", ["learnerId"])
export class TaskSubmission {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  assignmentId!: string;

  @Column({ type: "uuid" })
  learnerId!: string;

  @Column({ type: "text", nullable: true })
  content?: string; // Text answer for WRITING

  @Column({ type: "text", nullable: true })
  audioUrl?: string; // Audio answer for SPEAKING

  @Column({ type: "text", array: true, nullable: true })
  attachments?: string[];

  @Column({
    type: "enum",
    enum: TaskSubmissionStatus,
    default: TaskSubmissionStatus.PENDING,
  })
  status!: TaskSubmissionStatus;

  @Column({ type: "decimal", precision: 5, scale: 2, nullable: true })
  score?: number;

  @Column({ type: "text", nullable: true })
  textFeedback?: string;

  @Column({ type: "text", nullable: true })
  audioFeedbackUrl?: string;

  @Column({ type: "timestamp", nullable: true })
  submittedAt?: Date;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => TaskAssignment, (assignment) => assignment.submissions, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "assignmentId" })
  assignment!: TaskAssignment;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "learnerId" })
  learner!: User;
}
