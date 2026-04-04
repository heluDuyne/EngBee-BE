import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  ManyToMany,
  OneToMany,
  JoinTable,
  JoinColumn,
  Index,
} from "typeorm";
import { User } from "./User";
import { Assignment } from "./Assignment";

@Entity("classes")
@Index("idx_class_teacher", ["teacherId"])
@Index("idx_class_code", ["code"], { unique: true, where: 'code IS NOT NULL' })
export class Class {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  teacherId!: string;

  @Column({ type: "varchar", length: 255 })
  name!: string;

  @Column({ type: "text", nullable: true })
  description?: string;

  @Column({ type: "varchar", length: 50, nullable: true, unique: true })
  code?: string; // Unique code for learners to join

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => User, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "teacher_id" })
  teacher!: User;

  @ManyToMany(() => User, (user) => user.enrolledClasses, {
    cascade: true,
    onDelete: "CASCADE",
  })
  @JoinTable({
    name: "class_learners",
    joinColumn: { name: "class_id", referencedColumnName: "id" },
    inverseJoinColumn: { name: "learner_id", referencedColumnName: "id" },
  })
  learners?: User[];

  @OneToMany(() => Assignment, (assignment) => assignment.class)
  assignments?: Assignment[];
}
