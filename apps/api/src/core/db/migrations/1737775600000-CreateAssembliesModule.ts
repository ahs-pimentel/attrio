import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAssembliesModule1737775600000 implements MigrationInterface {
  name = 'CreateAssembliesModule1737775600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar enum de status da assembleia
    await queryRunner.query(`
      CREATE TYPE "assembly_status_enum" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'FINISHED', 'CANCELLED')
    `);

    // Criar enum de status da pauta
    await queryRunner.query(`
      CREATE TYPE "agenda_item_status_enum" AS ENUM ('PENDING', 'VOTING', 'CLOSED')
    `);

    // Criar enum de escolha de voto
    await queryRunner.query(`
      CREATE TYPE "vote_choice_enum" AS ENUM ('YES', 'NO', 'ABSTENTION')
    `);

    // Criar tabela de assembleias
    await queryRunner.query(`
      CREATE TABLE "assemblies" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "title" varchar(255) NOT NULL,
        "description" text,
        "scheduled_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "started_at" TIMESTAMP WITH TIME ZONE,
        "finished_at" TIMESTAMP WITH TIME ZONE,
        "meeting_url" varchar(500),
        "status" "assembly_status_enum" NOT NULL DEFAULT 'SCHEDULED',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_assemblies" PRIMARY KEY ("id"),
        CONSTRAINT "FK_assemblies_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE
      )
    `);

    // Criar tabela de participantes da assembleia
    await queryRunner.query(`
      CREATE TABLE "assembly_participants" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "assembly_id" uuid NOT NULL,
        "unit_id" uuid NOT NULL,
        "resident_id" uuid,
        "proxy_name" varchar(255),
        "proxy_document" varchar(20),
        "joined_at" TIMESTAMP WITH TIME ZONE,
        "left_at" TIMESTAMP WITH TIME ZONE,
        "voting_weight" decimal(5,2) NOT NULL DEFAULT 1,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_assembly_participants" PRIMARY KEY ("id"),
        CONSTRAINT "FK_assembly_participants_assembly" FOREIGN KEY ("assembly_id") REFERENCES "assemblies"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_assembly_participants_unit" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_assembly_participants_resident" FOREIGN KEY ("resident_id") REFERENCES "residents"("id") ON DELETE SET NULL,
        CONSTRAINT "UQ_assembly_participants_assembly_unit" UNIQUE ("assembly_id", "unit_id")
      )
    `);

    // Criar tabela de pautas
    await queryRunner.query(`
      CREATE TABLE "agenda_items" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "assembly_id" uuid NOT NULL,
        "title" varchar(255) NOT NULL,
        "description" text,
        "order_index" int NOT NULL DEFAULT 0,
        "status" "agenda_item_status_enum" NOT NULL DEFAULT 'PENDING',
        "requires_quorum" boolean NOT NULL DEFAULT true,
        "quorum_type" varchar(50) NOT NULL DEFAULT 'simple',
        "voting_started_at" TIMESTAMP WITH TIME ZONE,
        "voting_ended_at" TIMESTAMP WITH TIME ZONE,
        "result" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_agenda_items" PRIMARY KEY ("id"),
        CONSTRAINT "FK_agenda_items_assembly" FOREIGN KEY ("assembly_id") REFERENCES "assemblies"("id") ON DELETE CASCADE
      )
    `);

    // Criar tabela de votos
    await queryRunner.query(`
      CREATE TABLE "votes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "agenda_item_id" uuid NOT NULL,
        "participant_id" uuid NOT NULL,
        "choice" "vote_choice_enum" NOT NULL,
        "voting_weight" decimal(5,2) NOT NULL DEFAULT 1,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_votes" PRIMARY KEY ("id"),
        CONSTRAINT "FK_votes_agenda_item" FOREIGN KEY ("agenda_item_id") REFERENCES "agenda_items"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_votes_participant" FOREIGN KEY ("participant_id") REFERENCES "assembly_participants"("id") ON DELETE CASCADE,
        CONSTRAINT "UQ_votes_agenda_item_participant" UNIQUE ("agenda_item_id", "participant_id")
      )
    `);

    // Criar indices
    await queryRunner.query(`CREATE INDEX "IDX_assemblies_tenant" ON "assemblies" ("tenant_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_assemblies_status" ON "assemblies" ("status")`);
    await queryRunner.query(`CREATE INDEX "IDX_assemblies_scheduled_at" ON "assemblies" ("scheduled_at")`);
    await queryRunner.query(`CREATE INDEX "IDX_assembly_participants_assembly" ON "assembly_participants" ("assembly_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_assembly_participants_unit" ON "assembly_participants" ("unit_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_agenda_items_assembly" ON "agenda_items" ("assembly_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_agenda_items_status" ON "agenda_items" ("status")`);
    await queryRunner.query(`CREATE INDEX "IDX_votes_agenda_item" ON "votes" ("agenda_item_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_votes_participant" ON "votes" ("participant_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover indices
    await queryRunner.query(`DROP INDEX "IDX_votes_participant"`);
    await queryRunner.query(`DROP INDEX "IDX_votes_agenda_item"`);
    await queryRunner.query(`DROP INDEX "IDX_agenda_items_status"`);
    await queryRunner.query(`DROP INDEX "IDX_agenda_items_assembly"`);
    await queryRunner.query(`DROP INDEX "IDX_assembly_participants_unit"`);
    await queryRunner.query(`DROP INDEX "IDX_assembly_participants_assembly"`);
    await queryRunner.query(`DROP INDEX "IDX_assemblies_scheduled_at"`);
    await queryRunner.query(`DROP INDEX "IDX_assemblies_status"`);
    await queryRunner.query(`DROP INDEX "IDX_assemblies_tenant"`);

    // Remover tabelas
    await queryRunner.query(`DROP TABLE "votes"`);
    await queryRunner.query(`DROP TABLE "agenda_items"`);
    await queryRunner.query(`DROP TABLE "assembly_participants"`);
    await queryRunner.query(`DROP TABLE "assemblies"`);

    // Remover enums
    await queryRunner.query(`DROP TYPE "vote_choice_enum"`);
    await queryRunner.query(`DROP TYPE "agenda_item_status_enum"`);
    await queryRunner.query(`DROP TYPE "assembly_status_enum"`);
  }
}
