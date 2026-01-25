import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTenantsTable1737775300000 implements MigrationInterface {
  name = 'CreateTenantsTable1737775300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar tabela de tenants
    await queryRunner.query(`
      CREATE TABLE "tenants" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" character varying(255) NOT NULL,
        "slug" character varying(100) NOT NULL,
        "active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_tenants" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_tenants_slug" UNIQUE ("slug")
      )
    `);

    // Criar indice no slug
    await queryRunner.query(`
      CREATE INDEX "idx_tenants_slug" ON "tenants" ("slug")
    `);

    // Adicionar FK na tabela users
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD CONSTRAINT "FK_users_tenant"
      FOREIGN KEY ("tenant_id")
      REFERENCES "tenants"("id")
      ON DELETE SET NULL
      ON UPDATE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_users_tenant"`);
    await queryRunner.query(`DROP INDEX "idx_tenants_slug"`);
    await queryRunner.query(`DROP TABLE "tenants"`);
  }
}
