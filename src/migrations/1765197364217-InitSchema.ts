import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchema1765197364217 implements MigrationInterface {
    name = 'InitSchema1765197364217'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create ENUM types first
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('learner', 'teacher', 'admin')`);
        await queryRunner.query(`CREATE TYPE "public"."users_status_enum" AS ENUM('active', 'locked')`);
        await queryRunner.query(`CREATE TYPE "public"."users_uilanguage_enum" AS ENUM('vi', 'en')`);
        await queryRunner.query(`CREATE TYPE "public"."assignments_status_enum" AS ENUM('draft', 'active', 'archived')`);
        await queryRunner.query(`CREATE TYPE "public"."attempts_status_enum" AS ENUM('in_progress', 'submitted', 'scored')`);
        await queryRunner.query(`CREATE TYPE "public"."prompts_skilltype_enum" AS ENUM('speaking', 'writing')`);
        await queryRunner.query(`CREATE TYPE "public"."attempts_skilltype_enum" AS ENUM('speaking', 'writing')`);
        await queryRunner.query(`CREATE TYPE "public"."prompts_difficulty_enum" AS ENUM('easy', 'medium', 'hard')`);
        await queryRunner.query(`CREATE TYPE "public"."scoring_jobs_status_enum" AS ENUM('queued', 'processing', 'completed', 'failed')`);
        await queryRunner.query(`CREATE TYPE "public"."attempt_media_mediatype_enum" AS ENUM('audio', 'video')`);
        await queryRunner.query(`CREATE TYPE "public"."feedbacks_type_enum" AS ENUM('ai_generated', 'teacher_comment')`);
        await queryRunner.query(`CREATE TYPE "public"."feedbacks_visibility_enum" AS ENUM('private_to_teacher', 'teacher_and_learner')`);

        await queryRunner.query(`CREATE TABLE "learner_profiles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "firstName" character varying(100), "lastName" character varying(100), "targetBand" integer, "currentBand" integer, "nativeLanguage" character varying(100), "learningGoals" text, "user_id" uuid, CONSTRAINT "REL_94cd9a55d9923c7f859e683c05" UNIQUE ("user_id"), CONSTRAINT "PK_d5c5325dd0d1716cf414f357c08" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "idx_learner_profile_user" ON "learner_profiles" ("userId") `);
        await queryRunner.query(`CREATE TABLE "classes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "teacherId" uuid NOT NULL, "name" character varying(255) NOT NULL, "description" text, "code" character varying(50), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "teacher_id" uuid, CONSTRAINT "UQ_cf7491878e0fca8599438629988" UNIQUE ("code"), CONSTRAINT "PK_e207aa15404e9b2ce35910f9f7f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "idx_class_code" ON "classes" ("code") WHERE code IS NOT NULL`);
        await queryRunner.query(`CREATE INDEX "idx_class_teacher" ON "classes" ("teacherId") `);
        await queryRunner.query(`CREATE TABLE "assignments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "classId" uuid NOT NULL, "promptId" uuid NOT NULL, "title" character varying(255) NOT NULL, "description" text, "deadline" TIMESTAMP NOT NULL, "status" "public"."assignments_status_enum" NOT NULL DEFAULT 'draft', "totalEnrolled" integer NOT NULL DEFAULT '0', "totalSubmitted" integer NOT NULL DEFAULT '0', "totalScored" integer NOT NULL DEFAULT '0', "allowLateSubmission" boolean NOT NULL DEFAULT false, "lateDeadline" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "class_id" uuid, "prompt_id" uuid, CONSTRAINT "PK_c54ca359535e0012b04dcbd80ee" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_assignment_status" ON "assignments" ("status") `);
        await queryRunner.query(`CREATE INDEX "idx_assignment_prompt" ON "assignments" ("promptId") `);
        await queryRunner.query(`CREATE INDEX "idx_assignment_class" ON "assignments" ("classId") `);
        await queryRunner.query(`CREATE TABLE "prompts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdBy" uuid NOT NULL, "skillType" "public"."prompts_skilltype_enum" NOT NULL, "content" text NOT NULL, "difficulty" "public"."prompts_difficulty_enum" NOT NULL, "prepTime" integer NOT NULL, "responseTime" integer NOT NULL, "description" text, "followUpQuestions" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" uuid, CONSTRAINT "PK_21f33798862975179e40b216a1d" PRIMARY KEY ("id")); COMMENT ON COLUMN "prompts"."prepTime" IS 'Prep time in seconds'; COMMENT ON COLUMN "prompts"."responseTime" IS 'Response time in seconds'`);
        await queryRunner.query(`CREATE INDEX "idx_prompts_created_by" ON "prompts" ("createdBy") `);
        await queryRunner.query(`CREATE INDEX "idx_prompts_skill_difficulty" ON "prompts" ("skillType", "difficulty") `);
        await queryRunner.query(`CREATE TABLE "attempt_media" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "attemptId" uuid NOT NULL, "mediaType" "public"."attempt_media_mediatype_enum" NOT NULL DEFAULT 'audio', "storageUrl" character varying NOT NULL, "fileName" character varying NOT NULL, "duration" integer, "fileSize" integer, "mimeType" character varying, "uploaded_at" TIMESTAMP NOT NULL DEFAULT now(), "attempt_id" uuid, CONSTRAINT "PK_d6bf9fad610f7e242f2bf0da5ff" PRIMARY KEY ("id")); COMMENT ON COLUMN "attempt_media"."duration" IS 'Duration in seconds'; COMMENT ON COLUMN "attempt_media"."fileSize" IS 'File size in bytes'`);
        await queryRunner.query(`CREATE INDEX "idx_attempt_media_uploaded" ON "attempt_media" ("uploaded_at") `);
        await queryRunner.query(`CREATE INDEX "idx_attempt_media_attempt" ON "attempt_media" ("attemptId") `);
        await queryRunner.query(`CREATE TABLE "scoring_jobs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "attemptId" uuid NOT NULL, "status" "public"."scoring_jobs_status_enum" NOT NULL DEFAULT 'queued', "errorMessage" text, "retryCount" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "startedAt" TIMESTAMP, "completedAt" TIMESTAMP, "attempt_id" uuid, CONSTRAINT "UQ_f605b43ce85cfaad8a6dbf689b3" UNIQUE ("attemptId"), CONSTRAINT "REL_6af39a731b99ae86ed03a4550d" UNIQUE ("attempt_id"), CONSTRAINT "PK_e3b6717033dc6e17d00d36c1c92" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_scoring_jobs_status_created" ON "scoring_jobs" ("status", "created_at") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "idx_scoring_job_attempt" ON "scoring_jobs" ("attemptId") `);
        await queryRunner.query(`CREATE TABLE "scores" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "attemptId" uuid NOT NULL, "fluency" numeric(3,1) NOT NULL, "pronunciation" numeric(3,1) NOT NULL, "lexical" numeric(3,1) NOT NULL, "grammar" numeric(3,1) NOT NULL, "coherence" numeric(3,1) NOT NULL, "overallBand" integer NOT NULL, "feedback" text NOT NULL, "detailedFeedback" jsonb, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "attempt_id" uuid, CONSTRAINT "UQ_9bb3327ba2158d5f20d18d37d32" UNIQUE ("attemptId"), CONSTRAINT "REL_1501560e1fc6e152afd8e1881a" UNIQUE ("attempt_id"), CONSTRAINT "PK_c36917e6f26293b91d04b8fd521" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "idx_score_attempt" ON "scores" ("attemptId") `);
        await queryRunner.query(`CREATE TABLE "feedbacks" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "attemptId" uuid NOT NULL, "authorId" uuid NOT NULL, "type" "public"."feedbacks_type_enum" NOT NULL, "content" text NOT NULL, "visibility" "public"."feedbacks_visibility_enum" NOT NULL, "metadata" jsonb, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "attempt_id" uuid, "author_id" uuid, CONSTRAINT "PK_79affc530fdd838a9f1e0cc30be" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_feedback_created" ON "feedbacks" ("created_at") `);
        await queryRunner.query(`CREATE INDEX "idx_feedback_author" ON "feedbacks" ("authorId") `);
        await queryRunner.query(`CREATE INDEX "idx_feedback_attempt" ON "feedbacks" ("attemptId") `);
        await queryRunner.query(`CREATE TABLE "attempts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "learnerId" uuid NOT NULL, "promptId" uuid NOT NULL, "skillType" "public"."attempts_skilltype_enum" NOT NULL, "status" "public"."attempts_status_enum" NOT NULL DEFAULT 'in_progress', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "startedAt" TIMESTAMP, "submittedAt" TIMESTAMP, "scoredAt" TIMESTAMP, "content" text, "learner_id" uuid, "prompt_id" uuid, CONSTRAINT "PK_295ca261e361fd2fd217754dcac" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_attempts_status" ON "attempts" ("status") `);
        await queryRunner.query(`CREATE INDEX "idx_attempts_prompt" ON "attempts" ("promptId") `);
        await queryRunner.query(`CREATE INDEX "idx_attempts_learner_created" ON "attempts" ("learnerId", "created_at") `);
        await queryRunner.query(`CREATE TABLE "ai_rules" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, "description" text, "modelId" character varying(255) NOT NULL, "rubricId" character varying(255) NOT NULL DEFAULT 'ielts_speaking', "weights" jsonb NOT NULL, "strictness" double precision NOT NULL DEFAULT '1', "extraConfig" jsonb, "isActive" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "teacherId" uuid NOT NULL, "teacher_id" uuid, CONSTRAINT "PK_986bbab1af6be25a041129990be" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_ai_rule_status" ON "ai_rules" ("isActive") `);
        await queryRunner.query(`CREATE INDEX "idx_ai_rule_teacher" ON "ai_rules" ("teacherId") `);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying(255) NOT NULL, "password" character varying NOT NULL, "role" "public"."users_role_enum" NOT NULL DEFAULT 'learner', "status" "public"."users_status_enum" NOT NULL DEFAULT 'active', "uiLanguage" "public"."users_uilanguage_enum" NOT NULL DEFAULT 'en', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "idx_user_email" ON "users" ("email") `);
        await queryRunner.query(`CREATE TABLE "class_learners" ("class_id" uuid NOT NULL, "learner_id" uuid NOT NULL, CONSTRAINT "PK_8d4cfd7316995490d10bffe9532" PRIMARY KEY ("class_id", "learner_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_bbe804255b33738b3bcaaa4697" ON "class_learners" ("class_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_a195adb5a3972b39c3991badd0" ON "class_learners" ("learner_id") `);
        await queryRunner.query(`ALTER TABLE "learner_profiles" ADD CONSTRAINT "FK_94cd9a55d9923c7f859e683c051" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "classes" ADD CONSTRAINT "FK_b34c92e413c4debb6e0f23fed46" FOREIGN KEY ("teacher_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "assignments" ADD CONSTRAINT "FK_951fd419e8486c10ba6302a934b" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "assignments" ADD CONSTRAINT "FK_2ca133b238f2cad106ca095c746" FOREIGN KEY ("prompt_id") REFERENCES "prompts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "prompts" ADD CONSTRAINT "FK_9a04bfdad2b1ff887b21642d4ac" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "attempt_media" ADD CONSTRAINT "FK_6891b32ad13073f7f02bacbb3b8" FOREIGN KEY ("attempt_id") REFERENCES "attempts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "scoring_jobs" ADD CONSTRAINT "FK_6af39a731b99ae86ed03a4550dd" FOREIGN KEY ("attempt_id") REFERENCES "attempts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "scores" ADD CONSTRAINT "FK_1501560e1fc6e152afd8e1881a0" FOREIGN KEY ("attempt_id") REFERENCES "attempts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "feedbacks" ADD CONSTRAINT "FK_2785a9d33d19a003298fa266cfc" FOREIGN KEY ("attempt_id") REFERENCES "attempts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "feedbacks" ADD CONSTRAINT "FK_48ed6007e93242a15ccde375b8b" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "attempts" ADD CONSTRAINT "FK_54d258f1bb377045b5d9a478c4d" FOREIGN KEY ("learner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "attempts" ADD CONSTRAINT "FK_3422263266228194d1a0f6526f3" FOREIGN KEY ("prompt_id") REFERENCES "prompts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "ai_rules" ADD CONSTRAINT "FK_fe17ca216ca58b2caf8ae1238ed" FOREIGN KEY ("teacher_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "class_learners" ADD CONSTRAINT "FK_bbe804255b33738b3bcaaa46976" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "class_learners" ADD CONSTRAINT "FK_a195adb5a3972b39c3991badd0e" FOREIGN KEY ("learner_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "class_learners" DROP CONSTRAINT "FK_a195adb5a3972b39c3991badd0e"`);
        await queryRunner.query(`ALTER TABLE "class_learners" DROP CONSTRAINT "FK_bbe804255b33738b3bcaaa46976"`);
        await queryRunner.query(`ALTER TABLE "ai_rules" DROP CONSTRAINT "FK_fe17ca216ca58b2caf8ae1238ed"`);
        await queryRunner.query(`ALTER TABLE "attempts" DROP CONSTRAINT "FK_3422263266228194d1a0f6526f3"`);
        await queryRunner.query(`ALTER TABLE "attempts" DROP CONSTRAINT "FK_54d258f1bb377045b5d9a478c4d"`);
        await queryRunner.query(`ALTER TABLE "feedbacks" DROP CONSTRAINT "FK_48ed6007e93242a15ccde375b8b"`);
        await queryRunner.query(`ALTER TABLE "feedbacks" DROP CONSTRAINT "FK_2785a9d33d19a003298fa266cfc"`);
        await queryRunner.query(`ALTER TABLE "scores" DROP CONSTRAINT "FK_1501560e1fc6e152afd8e1881a0"`);
        await queryRunner.query(`ALTER TABLE "scoring_jobs" DROP CONSTRAINT "FK_6af39a731b99ae86ed03a4550dd"`);
        await queryRunner.query(`ALTER TABLE "attempt_media" DROP CONSTRAINT "FK_6891b32ad13073f7f02bacbb3b8"`);
        await queryRunner.query(`ALTER TABLE "prompts" DROP CONSTRAINT "FK_9a04bfdad2b1ff887b21642d4ac"`);
        await queryRunner.query(`ALTER TABLE "assignments" DROP CONSTRAINT "FK_2ca133b238f2cad106ca095c746"`);
        await queryRunner.query(`ALTER TABLE "assignments" DROP CONSTRAINT "FK_951fd419e8486c10ba6302a934b"`);
        await queryRunner.query(`ALTER TABLE "classes" DROP CONSTRAINT "FK_b34c92e413c4debb6e0f23fed46"`);
        await queryRunner.query(`ALTER TABLE "learner_profiles" DROP CONSTRAINT "FK_94cd9a55d9923c7f859e683c051"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a195adb5a3972b39c3991badd0"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_bbe804255b33738b3bcaaa4697"`);
        await queryRunner.query(`DROP TABLE "class_learners"`);
        await queryRunner.query(`DROP INDEX "public"."idx_user_email"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP INDEX "public"."idx_ai_rule_teacher"`);
        await queryRunner.query(`DROP INDEX "public"."idx_ai_rule_status"`);
        await queryRunner.query(`DROP TABLE "ai_rules"`);
        await queryRunner.query(`DROP INDEX "public"."idx_attempts_learner_created"`);
        await queryRunner.query(`DROP INDEX "public"."idx_attempts_prompt"`);
        await queryRunner.query(`DROP INDEX "public"."idx_attempts_status"`);
        await queryRunner.query(`DROP TABLE "attempts"`);
        await queryRunner.query(`DROP INDEX "public"."idx_feedback_attempt"`);
        await queryRunner.query(`DROP INDEX "public"."idx_feedback_author"`);
        await queryRunner.query(`DROP INDEX "public"."idx_feedback_created"`);
        await queryRunner.query(`DROP TABLE "feedbacks"`);
        await queryRunner.query(`DROP INDEX "public"."idx_score_attempt"`);
        await queryRunner.query(`DROP TABLE "scores"`);
        await queryRunner.query(`DROP INDEX "public"."idx_scoring_job_attempt"`);
        await queryRunner.query(`DROP INDEX "public"."idx_scoring_jobs_status_created"`);
        await queryRunner.query(`DROP TABLE "scoring_jobs"`);
        await queryRunner.query(`DROP INDEX "public"."idx_attempt_media_attempt"`);
        await queryRunner.query(`DROP INDEX "public"."idx_attempt_media_uploaded"`);
        await queryRunner.query(`DROP TABLE "attempt_media"`);
        await queryRunner.query(`DROP INDEX "public"."idx_prompts_skill_difficulty"`);
        await queryRunner.query(`DROP INDEX "public"."idx_prompts_created_by"`);
        await queryRunner.query(`DROP TABLE "prompts"`);
        await queryRunner.query(`DROP INDEX "public"."idx_assignment_class"`);
        await queryRunner.query(`DROP INDEX "public"."idx_assignment_prompt"`);
        await queryRunner.query(`DROP INDEX "public"."idx_assignment_status"`);
        await queryRunner.query(`DROP TABLE "assignments"`);
        await queryRunner.query(`DROP INDEX "public"."idx_class_teacher"`);
        await queryRunner.query(`DROP INDEX "public"."idx_class_code"`);
        await queryRunner.query(`DROP TABLE "classes"`);
        await queryRunner.query(`DROP INDEX "public"."idx_learner_profile_user"`);
        await queryRunner.query(`DROP TABLE "learner_profiles"`);
        
        // Drop ENUM types last
        await queryRunner.query(`DROP TYPE "public"."feedbacks_visibility_enum"`);
        await queryRunner.query(`DROP TYPE "public"."feedbacks_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."attempt_media_mediatype_enum"`);
        await queryRunner.query(`DROP TYPE "public"."scoring_jobs_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."prompts_difficulty_enum"`);
        await queryRunner.query(`DROP TYPE "public"."attempts_skilltype_enum"`);
        await queryRunner.query(`DROP TYPE "public"."prompts_skilltype_enum"`);
        await queryRunner.query(`DROP TYPE "public"."attempts_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."assignments_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."users_uilanguage_enum"`);
        await queryRunner.query(`DROP TYPE "public"."users_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    }

}
