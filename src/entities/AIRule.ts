import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  Index,
  JoinColumn,
} from "typeorm";
import { User } from "./User";

export interface ScoringWeights {
  fluency: number;
  coherence: number;
  lexical: number;
  grammar: number;
  pronunciation?: number;
}

@Entity("ai_rules")
@Index("idx_ai_rule_teacher", ["teacherId"])
@Index("idx_ai_rule_status", ["isActive"])
export class AIRule {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 255 })
  name!: string;

  @Column({ type: "text", nullable: true })
  description?: string;

  @Column({ type: "varchar", length: 255 })
  modelId!: string; // e.g., "qwen2-7b-finetuned", "gpt-4", "claude-3"

  @Column({ type: "varchar", length: 255, default: "ielts_speaking" })
  rubricId!: string; // Rubric template to use

  @Column({ type: "jsonb" })
  weights!: ScoringWeights; // {fluency: 0.25, coherence: 0.25, lexical: 0.25, grammar: 0.25}

  @Column({ type: "float", default: 1.0 })
  strictness!: number; // Multiplier for stricter/looser scoring (1.0 = standard)

  @Column({ type: "jsonb", nullable: true })
  extraConfig?: Record<string, any>; // Additional model parameters like temperature, top_p, etc.

  @Column({ type: "boolean", default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;

  // Foreign key
  @Column({ type: "uuid" })
  teacherId!: string;

  // Relations
  @ManyToOne(() => User, (user) => user.aiRules, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "teacher_id" })
  teacher?: User;
}
