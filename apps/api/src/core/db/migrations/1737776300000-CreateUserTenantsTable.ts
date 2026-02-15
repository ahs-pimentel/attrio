import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUserTenantsTable1737776300000 implements MigrationInterface {
  name = 'CreateUserTenantsTable1737776300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "user_tenants" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "tenant_id" uuid NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_user_tenants" PRIMARY KEY ("id"),
        CONSTRAINT "FK_user_tenants_user" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "FK_user_tenants_tenant" FOREIGN KEY ("tenant_id")
          REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "UQ_user_tenants_user_tenant" UNIQUE ("user_id", "tenant_id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_user_tenants_user_id" ON "user_tenants" ("user_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_user_tenants_tenant_id" ON "user_tenants" ("tenant_id")
    `);

    // Migrar dados existentes: usuarios com tenant_id entram na junction table
    await queryRunner.query(`
      INSERT INTO "user_tenants" ("user_id", "tenant_id")
      SELECT "id", "tenant_id" FROM "users"
      WHERE "tenant_id" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_user_tenants_tenant_id"`);
    await queryRunner.query(`DROP INDEX "IDX_user_tenants_user_id"`);
    await queryRunner.query(`DROP TABLE "user_tenants"`);
  }
}
