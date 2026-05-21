import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from "typeorm";
import { Course } from "./Course";
import { User } from "./User";
import { SkillType, TaskLevel, TaskSkillFocus, TaskStatus } from "../enums";
import { TaskAssignment } from "./TaskAssignment";

@Entity("tasks")
@Index("idx_tasks_course", ["courseId"])
@Index("idx_tasks_creator", ["creatorId"])
export class Task {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 255 })
  title!: string;

  @Column({ type: "text", nullable: true })
  description?: string;

  @Column({ type: "text", nullable: true })
  instructions?: string;

  @Column({ type: "text", nullable: true })
  readingText?: string;

  @Column({ type: "jsonb", nullable: true })
  questions?: any[];

  @Column({
    type: "enum",
    enum: SkillType,
  })
  type!: SkillType; // WRITING or SPEAKING

  @Column({
    type: "enum",
    enum: TaskLevel,
    nullable: true,
  })
  level?: TaskLevel;

  @Column({
    type: "enum",
    enum: TaskSkillFocus,
    array: true,
    nullable: true,
  })
  skillFocus?: TaskSkillFocus[];

  @Column({ type: "decimal", precision: 5, scale: 2, default: 100 })
  maxScore!: number;

  @Column({ type: "text", nullable: true })
  rubric?: string;

  @Column({ type: "text", array: true, nullable: true })
  files?: string[];

  @Column({ type: "text", array: true, nullable: true })
  sampleAnswers?: string[];

  @Column({ type: "text", array: true, nullable: true })
  referenceMedia?: string[];

  @Column({ type: "uuid", nullable: true })
  courseId?: string; // Optional if created standalone

  @Column({ type: "uuid" })
  creatorId!: string;

  @Column({
    type: "enum",
    enum: TaskStatus,
    default: TaskStatus.DRAFT,
  })
  status!: TaskStatus;

  @Column({ type: "text", nullable: true })
  rejectionReason?: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => Course, (course) => course.tasks, {
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "course_id" })
  course?: Course;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "creator_id" })
  creator!: User;

  @OneToMany(() => TaskAssignment, (assignment) => assignment.task)
  assignments?: TaskAssignment[];
}
