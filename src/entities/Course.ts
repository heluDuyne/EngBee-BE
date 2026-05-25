import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  ManyToMany,
  JoinColumn,
  JoinTable,
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

  @Column({ type: "varchar", length: 100, nullable: true })
  category?: string;

  @Column({ type: "int", default: 0 })
  lessonCount!: number;

  @Column({ type: "varchar", length: 100, nullable: true })
  duration?: string;

  @Column({ type: "decimal", precision: 3, scale: 1, default: 0 })
  rating!: number;

  @Column({ type: "int", default: 0 })
  reviewCount!: number;

  @Column({ type: "int", default: 0 })
  enrolled!: number;

  @Column({ type: "varchar", length: 50, nullable: true })
  color?: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  icon?: string;

  @Column({ type: "jsonb", nullable: true })
  skills?: string[];

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  price!: number;

  @Column({ type: "boolean", default: true })
  isFree!: boolean;

  @Column({ type: "boolean", default: false })
  isFeatured!: boolean;

  @Column({ type: "jsonb", nullable: true })
  curriculum?: any[];

  @Column({ type: "jsonb", nullable: true })
  reviews?: any[];

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

  @ManyToMany(() => User, (user) => user.enrolledCourses)
  @JoinTable({
    name: "course_enrollments",
    joinColumn: { name: "course_id", referencedColumnName: "id" },
    inverseJoinColumn: { name: "user_id", referencedColumnName: "id" }
  })
  enrolledStudents?: User[];
}
