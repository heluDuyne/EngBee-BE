import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { User } from "./User";

@Entity("teacher_profiles")
@Index("idx_teacher_profile_user", ["userId"], { unique: true })
export class TeacherProfile {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  userId!: string;

  @Column("simple-array", { nullable: true })
  specializations?: string[];

  // Inverse relation to User
  @OneToOne(() => User, (user) => user.teacherProfile, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "user_id" })
  user!: User;
}
