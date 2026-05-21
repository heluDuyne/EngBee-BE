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
import { User } from "./User";
import { Task } from "./Task";
import { CourseStatus, CourseLevel } from "../enums";

@Entity("courses")
@Index("idx_courses_creator", ["creatorId"])
@Index("idx_courses_status", ["status"])
export class Course {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 255 })
  title!: string;

  @Column({ type: "text", nullable: true })
  description?: string;

  @Column({
    type: "enum",
    enum: CourseLevel,
    default: CourseLevel.BEGINNER,
  })
  level!: CourseLevel;

  @Column({
    type: "enum",
    enum: CourseStatus,
    default: CourseStatus.DRAFT,
  })
  status!: CourseStatus;

  @Column({ type: "text", nullable: true })
  rejectionReason?: string;

  @Column({ type: "timestamp", nullable: true })
  deletedAt?: Date;

  @Column({ type: "uuid" })
  creatorId!: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.createdCourses, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "creator_id" })
  creator!: User;

  @OneToMany(() => Task, (task) => task.course)
  tasks?: Task[];
}
