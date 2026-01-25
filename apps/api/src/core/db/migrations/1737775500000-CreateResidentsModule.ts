import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateResidentsModule1737775500000 implements MigrationInterface {
  name = 'CreateResidentsModule1737775500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar enums
    await queryRunner.query(`
      CREATE TYPE "resident_status_enum" AS ENUM ('ACTIVE', 'INACTIVE')
    `);

    await queryRunner.query(`
      CREATE TYPE "resident_type_enum" AS ENUM ('OWNER', 'TENANT')
    `);

    await queryRunner.query(`
      CREATE TYPE "invite_status_enum" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED')
    `);

    await queryRunner.query(`
      CREATE TYPE "pet_type_enum" AS ENUM ('DOG', 'CAT', 'BIRD', 'FISH', 'OTHER')
    `);

    await queryRunner.query(`
      CREATE TYPE "relationship_type_enum" AS ENUM ('SPOUSE', 'CHILD', 'PARENT', 'SIBLING', 'OTHER')
    `);

    // Criar tabela de moradores
    await queryRunner.query(`
      CREATE TABLE "residents" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "unit_id" uuid NOT NULL,
        "user_id" uuid,
        "type" "resident_type_enum" NOT NULL DEFAULT 'OWNER',
        "full_name" character varying(255) NOT NULL,
        "email" character varying(255),
        "phone" character varying(20),
        "rg" character varying(20),
        "cpf" character varying(14),
        "move_in_date" date,
        "landlord_name" character varying(255),
        "landlord_phone" character varying(20),
        "landlord_email" character varying(255),
        "contract_file_url" character varying(500),
        "data_consent" boolean NOT NULL DEFAULT false,
        "data_consent_at" TIMESTAMP WITH TIME ZONE,
        "status" "resident_status_enum" NOT NULL DEFAULT 'ACTIVE',
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_residents" PRIMARY KEY ("id"),
        CONSTRAINT "FK_residents_tenant" FOREIGN KEY ("tenant_id")
          REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "FK_residents_unit" FOREIGN KEY ("unit_id")
          REFERENCES "units"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "FK_residents_user" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
      )
    `);

    await queryRunner.query(`CREATE INDEX "idx_residents_tenant_id" ON "residents" ("tenant_id")`);
    await queryRunner.query(`CREATE INDEX "idx_residents_unit_id" ON "residents" ("unit_id")`);
    await queryRunner.query(`CREATE INDEX "idx_residents_user_id" ON "residents" ("user_id")`);

    // Criar tabela de contatos de emergência
    await queryRunner.query(`
      CREATE TABLE "resident_contacts" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "resident_id" uuid NOT NULL,
        "name" character varying(255) NOT NULL,
        "phone" character varying(20) NOT NULL,
        "is_whatsapp" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_resident_contacts" PRIMARY KEY ("id"),
        CONSTRAINT "FK_resident_contacts_resident" FOREIGN KEY ("resident_id")
          REFERENCES "residents"("id") ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);

    await queryRunner.query(`CREATE INDEX "idx_resident_contacts_resident_id" ON "resident_contacts" ("resident_id")`);

    // Criar tabela de membros do domicílio
    await queryRunner.query(`
      CREATE TABLE "household_members" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "resident_id" uuid NOT NULL,
        "name" character varying(255) NOT NULL,
        "email" character varying(255),
        "document" character varying(20),
        "relationship" "relationship_type_enum" NOT NULL DEFAULT 'OTHER',
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_household_members" PRIMARY KEY ("id"),
        CONSTRAINT "FK_household_members_resident" FOREIGN KEY ("resident_id")
          REFERENCES "residents"("id") ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);

    await queryRunner.query(`CREATE INDEX "idx_household_members_resident_id" ON "household_members" ("resident_id")`);

    // Criar tabela de funcionários da unidade
    await queryRunner.query(`
      CREATE TABLE "unit_employees" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "resident_id" uuid NOT NULL,
        "name" character varying(255) NOT NULL,
        "document" character varying(20),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_unit_employees" PRIMARY KEY ("id"),
        CONSTRAINT "FK_unit_employees_resident" FOREIGN KEY ("resident_id")
          REFERENCES "residents"("id") ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);

    await queryRunner.query(`CREATE INDEX "idx_unit_employees_resident_id" ON "unit_employees" ("resident_id")`);

    // Criar tabela de veículos
    await queryRunner.query(`
      CREATE TABLE "vehicles" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "resident_id" uuid NOT NULL,
        "brand" character varying(100) NOT NULL,
        "model" character varying(100) NOT NULL,
        "color" character varying(50) NOT NULL,
        "plate" character varying(10) NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_vehicles" PRIMARY KEY ("id"),
        CONSTRAINT "FK_vehicles_resident" FOREIGN KEY ("resident_id")
          REFERENCES "residents"("id") ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);

    await queryRunner.query(`CREATE INDEX "idx_vehicles_resident_id" ON "vehicles" ("resident_id")`);
    await queryRunner.query(`CREATE INDEX "idx_vehicles_plate" ON "vehicles" ("plate")`);

    // Criar tabela de pets
    await queryRunner.query(`
      CREATE TABLE "pets" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "resident_id" uuid NOT NULL,
        "name" character varying(100) NOT NULL,
        "type" "pet_type_enum" NOT NULL DEFAULT 'DOG',
        "breed" character varying(100),
        "color" character varying(50),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_pets" PRIMARY KEY ("id"),
        CONSTRAINT "FK_pets_resident" FOREIGN KEY ("resident_id")
          REFERENCES "residents"("id") ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);

    await queryRunner.query(`CREATE INDEX "idx_pets_resident_id" ON "pets" ("resident_id")`);

    // Criar tabela de convites
    await queryRunner.query(`
      CREATE TABLE "resident_invites" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "unit_id" uuid NOT NULL,
        "name" character varying(255) NOT NULL,
        "email" character varying(255) NOT NULL,
        "phone" character varying(20) NOT NULL,
        "token" character varying(100) NOT NULL,
        "status" "invite_status_enum" NOT NULL DEFAULT 'PENDING',
        "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "accepted_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_resident_invites" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_resident_invites_token" UNIQUE ("token"),
        CONSTRAINT "FK_resident_invites_tenant" FOREIGN KEY ("tenant_id")
          REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "FK_resident_invites_unit" FOREIGN KEY ("unit_id")
          REFERENCES "units"("id") ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);

    await queryRunner.query(`CREATE INDEX "idx_resident_invites_tenant_id" ON "resident_invites" ("tenant_id")`);
    await queryRunner.query(`CREATE INDEX "idx_resident_invites_unit_id" ON "resident_invites" ("unit_id")`);
    await queryRunner.query(`CREATE INDEX "idx_resident_invites_token" ON "resident_invites" ("token")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables
    await queryRunner.query(`DROP TABLE "resident_invites"`);
    await queryRunner.query(`DROP TABLE "pets"`);
    await queryRunner.query(`DROP TABLE "vehicles"`);
    await queryRunner.query(`DROP TABLE "unit_employees"`);
    await queryRunner.query(`DROP TABLE "household_members"`);
    await queryRunner.query(`DROP TABLE "resident_contacts"`);
    await queryRunner.query(`DROP TABLE "residents"`);

    // Drop enums
    await queryRunner.query(`DROP TYPE "relationship_type_enum"`);
    await queryRunner.query(`DROP TYPE "pet_type_enum"`);
    await queryRunner.query(`DROP TYPE "invite_status_enum"`);
    await queryRunner.query(`DROP TYPE "resident_type_enum"`);
    await queryRunner.query(`DROP TYPE "resident_status_enum"`);
  }
}
