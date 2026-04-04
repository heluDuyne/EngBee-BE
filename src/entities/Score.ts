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

@Entity("scores")
@Index("idx_score_attempt", ["attemptId"], { unique: true })
export class Score {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid", unique: true })
  attemptId!: string;

  @Column({ type: "numeric", precision: 3, scale: 1, nullable: true })
  fluency!: number | null; // 0-9 (Nullable for Writing)

  @Column({ type: "numeric", precision: 3, scale: 1, nullable: true })
  pronunciation!: number | null; // 0-9 (Nullable for Writing)

  @Column({ type: "numeric", precision: 3, scale: 1 })
  lexical!: number; // 0-9

  @Column({ type: "numeric", precision: 3, scale: 1 })
  grammar!: number; // 0-9

  @Column({ type: "numeric", precision: 3, scale: 1 })
  coherence!: number; // 0-9

  @Column({ type: "numeric", precision: 3, scale: 1, nullable: true })
  taskResponse!: number | null; // 0-9 (For Writing)

  @Column({ type: "numeric", precision: 3, scale: 1, nullable: true })
  overallBand!: number; // 0-9

  @Column({ type: "text" })
  feedback!: string;

  @Column({ type: "jsonb", nullable: true })
  detailedFeedback?: Record<string, any>;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  // Relations
  @OneToOne(() => Attempt, (attempt) => attempt.score, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "attemptId" })
  attempt!: Attempt;
}
