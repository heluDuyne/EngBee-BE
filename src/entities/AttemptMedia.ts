import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { Attempt } from "./Attempt";
import { MediaType } from "../enums";

@Entity("attempt_media")
@Index("idx_attempt_media_attempt", ["attemptId"])
@Index("idx_attempt_media_uploaded", ["uploadedAt"])
export class AttemptMedia {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  attemptId!: string;

  @Column({
    type: "enum",
    enum: MediaType,
    default: MediaType.AUDIO,
  })
  mediaType!: MediaType;

  @Column({ type: "varchar" })
  storageUrl!: string;

  @Column({ type: "varchar" })
  fileName!: string;

  @Column({ type: "integer", nullable: true, comment: "Duration in seconds" })
  duration?: number;

  @Column({ type: "integer", nullable: true, comment: "File size in bytes" })
  fileSize?: number;

  @Column({ type: "varchar", nullable: true })
  mimeType?: string;

  @CreateDateColumn({ name: "uploaded_at" })
  uploadedAt!: Date;

  // Relations
  @ManyToOne(() => Attempt, (attempt) => attempt.media, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "attempt_id" })
  attempt!: Attempt;
}
