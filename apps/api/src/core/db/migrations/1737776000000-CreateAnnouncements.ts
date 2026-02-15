import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAnnouncements1737776000000 implements MigrationInterface {
  name = 'CreateAnnouncements1737776000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar enum de tipo de comunicado
    await queryRunner.query(`
      CREATE TYPE "announcement_type_enum" AS ENUM ('GENERAL', 'ASSEMBLY')
    `);

    // Criar tabela de comunicados
    await queryRunner.query(`
      CREATE TABLE "announcements" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "title" varchar(255) NOT NULL,
        "content" text NOT NULL,
        "type" "announcement_type_enum" NOT NULL DEFAULT 'GENERAL',
        "assembly_id" uuid,
        "published" boolean NOT NULL DEFAULT true,
        "created_by" uuid,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_announcements" PRIMARY KEY ("id"),
        CONSTRAINT "FK_announcements_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_announcements_assembly" FOREIGN KEY ("assembly_id") REFERENCES "assemblies"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_announcements_user" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);

    // Indice por tenant para consultas
    await queryRunner.query(`
      CREATE INDEX "IDX_announcements_tenant_id" ON "announcements" ("tenant_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_announcements_tenant_id"`);
    await queryRunner.query(`DROP TABLE "announcements"`);
    await queryRunner.query(`DROP TYPE "announcement_type_enum"`);
  }
}
