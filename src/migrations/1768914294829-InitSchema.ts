import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchema1768914294829 implements MigrationInterface {
    name = 'InitSchema1768914294829'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "learner_profiles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "firstName" character varying(100), "lastName" character varying(100), "targetBand" integer, "currentBand" integer, "nativeLanguage" character varying(100), "learningGoals" text, CONSTRAINT "REL_8e7a057ac438bfa275b7be5a8b" UNIQUE ("userId"), CONSTRAINT "PK_d5c5325dd0d1716cf414f357c08" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "classes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "teacherId" uuid NOT NULL, "name" character varying(255) NOT NULL, "description" text, "code" character varying(50), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_cf7491878e0fca8599438629988" UNIQUE ("code"), CONSTRAINT "PK_e207aa15404e9b2ce35910f9f7f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "prompts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdBy" uuid NOT NULL, "skillType" "public"."prompts_skilltype_enum" NOT NULL, "content" text NOT NULL, "difficulty" "public"."prompts_difficulty_enum" NOT NULL, "prepTime" integer NOT NULL, "responseTime" integer NOT NULL, "description" text, "followUpQuestions" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_21f33798862975179e40b216a1d" PRIMARY KEY ("id")); COMMENT ON COLUMN "prompts"."prepTime" IS 'Prep time in seconds'; COMMENT ON COLUMN "prompts"."responseTime" IS 'Response time in seconds'`);
        await queryRunner.query(`CREATE TABLE "ai_rules" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, "description" text, "modelId" character varying(255) NOT NULL, "rubricId" character varying(255) NOT NULL DEFAULT 'ielts_speaking', "weights" jsonb NOT NULL, "strictness" double precision NOT NULL DEFAULT '1', "extraConfig" jsonb, "isActive" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "teacherId" uuid NOT NULL, CONSTRAINT "PK_986bbab1af6be25a041129990be" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "assignments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "classId" uuid NOT NULL, "promptId" uuid NOT NULL, "title" character varying(255) NOT NULL, "description" text, "deadline" TIMESTAMP NOT NULL, "status" "public"."assignments_status_enum" NOT NULL DEFAULT 'draft', "totalEnrolled" integer NOT NULL DEFAULT '0', "totalSubmitted" integer NOT NULL DEFAULT '0', "totalScored" integer NOT NULL DEFAULT '0', "allowLateSubmission" boolean NOT NULL DEFAULT false, "lateDeadline" TIMESTAMP, "aiRuleId" uuid, "enableAIScoring" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_c54ca359535e0012b04dcbd80ee" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "attempt_media" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "attemptId" uuid NOT NULL, "mediaType" "public"."attempt_media_mediatype_enum" NOT NULL DEFAULT 'audio', "storageUrl" character varying NOT NULL, "fileName" character varying NOT NULL, "duration" integer, "fileSize" integer, "mimeType" character varying, "uploaded_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_d6bf9fad610f7e242f2bf0da5ff" PRIMARY KEY ("id")); COMMENT ON COLUMN "attempt_media"."duration" IS 'Duration in seconds'; COMMENT ON COLUMN "attempt_media"."fileSize" IS 'File size in bytes'`);
        await queryRunner.query(`CREATE TABLE "scoring_jobs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "attemptId" uuid NOT NULL, "status" "public"."scoring_jobs_status_enum" NOT NULL DEFAULT 'queued', "errorMessage" text, "retryCount" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "startedAt" TIMESTAMP, "completedAt" TIMESTAMP, CONSTRAINT "UQ_f605b43ce85cfaad8a6dbf689b3" UNIQUE ("attemptId"), CONSTRAINT "REL_f605b43ce85cfaad8a6dbf689b" UNIQUE ("attemptId"), CONSTRAINT "PK_e3b6717033dc6e17d00d36c1c92" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "scores" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "attemptId" uuid NOT NULL, "scoreMetadata" jsonb NOT NULL, "overallBand" numeric(3,1) NOT NULL, "feedback" text NOT NULL, "detailedFeedback" jsonb, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_9bb3327ba2158d5f20d18d37d32" UNIQUE ("attemptId"), CONSTRAINT "REL_9bb3327ba2158d5f20d18d37d3" UNIQUE ("attemptId"), CONSTRAINT "PK_c36917e6f26293b91d04b8fd521" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "feedbacks" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "attemptId" uuid NOT NULL, "authorId" uuid NOT NULL, "type" "public"."feedbacks_type_enum" NOT NULL, "content" text NOT NULL, "visibility" "public"."feedbacks_visibility_enum" NOT NULL, "metadata" jsonb, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_79affc530fdd838a9f1e0cc30be" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "attempts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "learnerId" uuid NOT NULL, "assignmentId" uuid NOT NULL, "skillType" "public"."attempts_skilltype_enum" NOT NULL, "status" "public"."attempts_status_enum" NOT NULL DEFAULT 'in_progress', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "startedAt" TIMESTAMP, "submittedAt" TIMESTAMP, "scoredAt" TIMESTAMP, "content" text, CONSTRAINT "PK_295ca261e361fd2fd217754dcac" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying(255) NOT NULL, "password" character varying NOT NULL, "role" "public"."users_role_enum" NOT NULL DEFAULT 'learner', "status" "public"."users_status_enum" NOT NULL DEFAULT 'active', "uiLanguage" "public"."users_uilanguage_enum" NOT NULL DEFAULT 'en', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "class_learners" ("class_id" uuid NOT NULL, "learner_id" uuid NOT NULL, CONSTRAINT "PK_8d4cfd7316995490d10bffe9532" PRIMARY KEY ("class_id", "learner_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_bbe804255b33738b3bcaaa4697" ON "class_learners" ("class_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_a195adb5a3972b39c3991badd0" ON "class_learners" ("learner_id") `);
        await queryRunner.query(`ALTER TABLE "learner_profiles" ADD CONSTRAINT "FK_8e7a057ac438bfa275b7be5a8bc" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "classes" ADD CONSTRAINT "FK_4b7ac7a7eb91f3e04229c7c0b6f" FOREIGN KEY ("teacherId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "prompts" ADD CONSTRAINT "FK_8909568aa2c028d13d416bbcaee" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "ai_rules" ADD CONSTRAINT "FK_6391b94a75904226e1aa0b5324d" FOREIGN KEY ("teacherId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "assignments" ADD CONSTRAINT "FK_c5382064b68e93e2ac371de898e" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "assignments" ADD CONSTRAINT "FK_d2b1be6f068ea8508a3651b5c9d" FOREIGN KEY ("promptId") REFERENCES "prompts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "assignments" ADD CONSTRAINT "FK_61219ad1860eb910a8a00ad1e08" FOREIGN KEY ("aiRuleId") REFERENCES "ai_rules"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "attempt_media" ADD CONSTRAINT "FK_66f282b328c562b3d95fe4ae916" FOREIGN KEY ("attemptId") REFERENCES "attempts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "scoring_jobs" ADD CONSTRAINT "FK_f605b43ce85cfaad8a6dbf689b3" FOREIGN KEY ("attemptId") REFERENCES "attempts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "scores" ADD CONSTRAINT "FK_9bb3327ba2158d5f20d18d37d32" FOREIGN KEY ("attemptId") REFERENCES "attempts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "feedbacks" ADD CONSTRAINT "FK_40175c16efb91b8796f54df0966" FOREIGN KEY ("attemptId") REFERENCES "attempts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "feedbacks" ADD CONSTRAINT "FK_0e41cb96ef6f2961420dc3ca6ca" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "attempts" ADD CONSTRAINT "FK_325214be50b5ec2af83d1ab4a02" FOREIGN KEY ("learnerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "attempts" ADD CONSTRAINT "FK_6d5ab7e366d982c5ee55c4c2ed5" FOREIGN KEY ("assignmentId") REFERENCES "assignments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "class_learners" ADD CONSTRAINT "FK_bbe804255b33738b3bcaaa46976" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "class_learners" ADD CONSTRAINT "FK_a195adb5a3972b39c3991badd0e" FOREIGN KEY ("learner_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "class_learners" DROP CONSTRAINT "FK_a195adb5a3972b39c3991badd0e"`);
        await queryRunner.query(`ALTER TABLE "class_learners" DROP CONSTRAINT "FK_bbe804255b33738b3bcaaa46976"`);
        await queryRunner.query(`ALTER TABLE "attempts" DROP CONSTRAINT "FK_6d5ab7e366d982c5ee55c4c2ed5"`);
        await queryRunner.query(`ALTER TABLE "attempts" DROP CONSTRAINT "FK_325214be50b5ec2af83d1ab4a02"`);
        await queryRunner.query(`ALTER TABLE "feedbacks" DROP CONSTRAINT "FK_0e41cb96ef6f2961420dc3ca6ca"`);
        await queryRunner.query(`ALTER TABLE "feedbacks" DROP CONSTRAINT "FK_40175c16efb91b8796f54df0966"`);
        await queryRunner.query(`ALTER TABLE "scores" DROP CONSTRAINT "FK_9bb3327ba2158d5f20d18d37d32"`);
        await queryRunner.query(`ALTER TABLE "scoring_jobs" DROP CONSTRAINT "FK_f605b43ce85cfaad8a6dbf689b3"`);
        await queryRunner.query(`ALTER TABLE "attempt_media" DROP CONSTRAINT "FK_66f282b328c562b3d95fe4ae916"`);
        await queryRunner.query(`ALTER TABLE "assignments" DROP CONSTRAINT "FK_61219ad1860eb910a8a00ad1e08"`);
        await queryRunner.query(`ALTER TABLE "assignments" DROP CONSTRAINT "FK_d2b1be6f068ea8508a3651b5c9d"`);
        await queryRunner.query(`ALTER TABLE "assignments" DROP CONSTRAINT "FK_c5382064b68e93e2ac371de898e"`);
        await queryRunner.query(`ALTER TABLE "ai_rules" DROP CONSTRAINT "FK_6391b94a75904226e1aa0b5324d"`);
        await queryRunner.query(`ALTER TABLE "prompts" DROP CONSTRAINT "FK_8909568aa2c028d13d416bbcaee"`);
        await queryRunner.query(`ALTER TABLE "classes" DROP CONSTRAINT "FK_4b7ac7a7eb91f3e04229c7c0b6f"`);
        await queryRunner.query(`ALTER TABLE "learner_profiles" DROP CONSTRAINT "FK_8e7a057ac438bfa275b7be5a8bc"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a195adb5a3972b39c3991badd0"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_bbe804255b33738b3bcaaa4697"`);
        await queryRunner.query(`DROP TABLE "class_learners"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TABLE "attempts"`);
        await queryRunner.query(`DROP TABLE "feedbacks"`);
        await queryRunner.query(`DROP TABLE "scores"`);
        await queryRunner.query(`DROP TABLE "scoring_jobs"`);
        await queryRunner.query(`DROP TABLE "attempt_media"`);
        await queryRunner.query(`DROP TABLE "assignments"`);
        await queryRunner.query(`DROP TABLE "ai_rules"`);
        await queryRunner.query(`DROP TABLE "prompts"`);
        await queryRunner.query(`DROP TABLE "classes"`);
        await queryRunner.query(`DROP TABLE "learner_profiles"`);
    }

}
