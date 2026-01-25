import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUnitsTable1737775400000 implements MigrationInterface {
  name = 'CreateUnitsTable1737775400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar enum de status
    await queryRunner.query(`
      CREATE TYPE "unit_status_enum" AS ENUM ('ACTIVE', 'INACTIVE')
    `);

    // Criar tabela de unidades
    await queryRunner.query(`
      CREATE TABLE "units" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "block" character varying(50) NOT NULL,
        "number" character varying(50) NOT NULL,
        "identifier" character varying(100) NOT NULL,
        "status" "unit_status_enum" NOT NULL DEFAULT 'ACTIVE',
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_units" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_units_tenant_identifier" UNIQUE ("tenant_id", "identifier"),
        CONSTRAINT "FK_units_tenant" FOREIGN KEY ("tenant_id")
          REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);

    // Criar indices
    await queryRunner.query(`
      CREATE INDEX "idx_units_tenant_id" ON "units" ("tenant_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_units_identifier" ON "units" ("identifier")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "idx_units_identifier"`);
    await queryRunner.query(`DROP INDEX "idx_units_tenant_id"`);
    await queryRunner.query(`DROP TABLE "units"`);
    await queryRunner.query(`DROP TYPE "unit_status_enum"`);
  }
}
