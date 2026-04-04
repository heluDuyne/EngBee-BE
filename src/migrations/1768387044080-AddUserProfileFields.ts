import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserProfileFields1768387044080 implements MigrationInterface {
    name = 'AddUserProfileFields1768387044080'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "firstName" character varying(100)`);
        await queryRunner.query(`ALTER TABLE "users" ADD "lastName" character varying(100)`);
        await queryRunner.query(`ALTER TABLE "users" ADD "avatar" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "users" ADD "phone" character varying(20)`);
        await queryRunner.query(`ALTER TABLE "users" ADD "location" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "users" ADD "bio" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "bio"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "location"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "phone"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "avatar"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "lastName"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "firstName"`);
    }

}
