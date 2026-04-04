import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { Attempt } from "./Attempt";
import { ScoringJobStatus } from "../enums";

@Entity("scoring_jobs")
@Index("idx_scoring_job_attempt", ["attemptId"], { unique: true })
@Index("idx_scoring_jobs_status_created", ["status", "createdAt"])
export class ScoringJob {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid", unique: true })
  attemptId!: string;

  @Column({
    type: "enum",
    enum: ScoringJobStatus,
    default: ScoringJobStatus.QUEUED,
  })
  status!: ScoringJobStatus;

  @Column({ type: "text", nullable: true })
  errorMessage?: string;

  @Column({ type: "integer", default: 0 })
  retryCount!: number;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @Column({ type: "timestamp", nullable: true })
  startedAt?: Date;

  @Column({ type: "timestamp", nullable: true })
  completedAt?: Date;

  // Relations
  @OneToOne(() => Attempt, (attempt) => attempt.scoringJob, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "attempt_id" })
  attempt!: Attempt;
}
