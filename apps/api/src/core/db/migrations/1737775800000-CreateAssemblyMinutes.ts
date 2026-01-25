import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAssemblyMinutes1737775800000 implements MigrationInterface {
  name = 'CreateAssemblyMinutes1737775800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar enum de status da ata
    await queryRunner.query(`
      CREATE TYPE "minutes_status_enum" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'PUBLISHED')
    `);

    // Criar tabela de atas
    await queryRunner.query(`
      CREATE TABLE "assembly_minutes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "assembly_id" uuid NOT NULL UNIQUE,
        "content" text,
        "summary" text,
        "transcription" text,
        "status" "minutes_status_enum" NOT NULL DEFAULT 'DRAFT',
        "pdf_url" varchar(500),
        "vote_summary" jsonb,
        "attendance_summary" jsonb,
        "approved_by" uuid,
        "approved_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_assembly_minutes" PRIMARY KEY ("id"),
        CONSTRAINT "FK_assembly_minutes_assembly" FOREIGN KEY ("assembly_id") REFERENCES "assemblies"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_assembly_minutes_approved_by" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);

    // Criar índices
    await queryRunner.query(`CREATE INDEX "IDX_assembly_minutes_assembly_id" ON "assembly_minutes" ("assembly_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_assembly_minutes_status" ON "assembly_minutes" ("status")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_assembly_minutes_status"`);
    await queryRunner.query(`DROP INDEX "IDX_assembly_minutes_assembly_id"`);
    await queryRunner.query(`DROP TABLE "assembly_minutes"`);
    await queryRunner.query(`DROP TYPE "minutes_status_enum"`);
  }
}
