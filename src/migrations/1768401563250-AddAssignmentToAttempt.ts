import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAssignmentToAttempt1768401563250 implements MigrationInterface {
    name = 'AddAssignmentToAttempt1768401563250'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "attempts" ADD "assignment_id" uuid`);
        await queryRunner.query(`ALTER TABLE "attempts" ADD CONSTRAINT "FK_85511f2909ac1fea283a611eac1" FOREIGN KEY ("assignment_id") REFERENCES "assignments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "attempts" DROP CONSTRAINT "FK_85511f2909ac1fea283a611eac1"`);
        await queryRunner.query(`ALTER TABLE "attempts" DROP COLUMN "assignment_id"`);
    }

}
