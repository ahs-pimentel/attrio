import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCheckinTokenToAssembly1737775700000 implements MigrationInterface {
  name = 'AddCheckinTokenToAssembly1737775700000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Adicionar coluna de token para check-in
    await queryRunner.query(`
      ALTER TABLE "assemblies"
      ADD COLUMN "checkin_token" varchar(64) UNIQUE
    `);

    // Criar índice para busca rápida por token
    await queryRunner.query(`
      CREATE INDEX "IDX_assemblies_checkin_token" ON "assemblies" ("checkin_token")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_assemblies_checkin_token"`);
    await queryRunner.query(`ALTER TABLE "assemblies" DROP COLUMN "checkin_token"`);
  }
}
