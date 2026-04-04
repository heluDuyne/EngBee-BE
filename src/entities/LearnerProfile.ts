import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { User } from "./User";

@Entity("learner_profiles")
@Index("idx_learner_profile_user", ["userId"], { unique: true })
export class LearnerProfile {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  userId!: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  firstName?: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  lastName?: string;

  @Column({ type: "integer", nullable: true })
  targetBand?: number; // 5-9

  @Column({ type: "integer", nullable: true })
  currentBand?: number;

  @Column({ type: "varchar", length: 100, nullable: true })
  nativeLanguage?: string;

  @Column({ type: "text", nullable: true })
  learningGoals?: string;

  // Inverse relation to User
  @OneToOne(() => User, (user) => user.learnerProfile, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "user_id" })
  user!: User;
}
