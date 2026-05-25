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
import { User } from "./User";

export enum PracticeStatus {
  DRAFT = "DRAFT",
  PUBLISHED = "PUBLISHED",
  ARCHIVED = "ARCHIVED",
}

@Entity("practices")
@Index("idx_practices_creator", ["creatorId"])
@Index("idx_practices_status", ["status"])
export class Practice {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 255 })
  title!: string;

  @Column({ type: "text", nullable: true })
  description?: string;

  @Column({ type: "varchar", length: 50 })
  level!: string;

  @Column({ type: "varchar", length: 50 })
  skillType!: string;

  @Column({ type: "jsonb", nullable: true })
  tags?: string[];

  @Column({ type: "int", default: 45 })
  duration!: number;

  @Column({ type: "text", nullable: true })
  content?: string;

  @Column({ type: "varchar", length: 1000, nullable: true })
  audioUrl?: string;

  @Column({ type: "jsonb", nullable: true })
  questions?: any[];

  @Column({
    type: "enum",
    enum: PracticeStatus,
    default: PracticeStatus.DRAFT,
  })
  status!: PracticeStatus;

  @Column({ type: "uuid" })
  creatorId!: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "creator_id" })
  creator!: User;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
