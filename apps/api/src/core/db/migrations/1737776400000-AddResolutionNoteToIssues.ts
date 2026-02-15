import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddResolutionNoteToIssues1737776400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "issues" ADD COLUMN "resolution_note" text
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "issues" DROP COLUMN "resolution_note"
    `);
  }
}
