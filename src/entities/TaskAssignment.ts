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
import { Task } from "./Task";
import { AssigneeType } from "../enums";
import { TaskSubmission } from "./TaskSubmission";

@Entity("task_assignments")
@Index("idx_task_assign_task", ["taskId"])
@Index("idx_task_assign_assignee", ["assigneeId"])
export class TaskAssignment {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  taskId!: string;

  @Column({
    type: "enum",
    enum: AssigneeType,
  })
  assigneeType!: AssigneeType;

  @Column({ type: "uuid" })
  assigneeId!: string; // ID of Course, Class, or User

  @Column({ type: "timestamp" })
  dueDate!: Date;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => Task, (task) => task.assignments, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "taskId" })
  task!: Task;

  @OneToMany(() => TaskSubmission, (submission) => submission.assignment)
  submissions?: TaskSubmission[];
}
