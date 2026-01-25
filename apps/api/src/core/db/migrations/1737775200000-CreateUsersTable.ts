import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsersTable1737775200000 implements MigrationInterface {
  name = 'CreateUsersTable1737775200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar enum de roles
    await queryRunner.query(`
      CREATE TYPE "user_role_enum" AS ENUM (
        'SAAS_ADMIN',
        'SYNDIC',
        'DOORMAN',
        'RESIDENT'
      )
    `);

    // Criar tabela de usuarios
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "supabase_user_id" uuid NOT NULL,
        "tenant_id" uuid,
        "email" character varying(255) NOT NULL,
        "name" character varying(255) NOT NULL,
        "role" "user_role_enum" NOT NULL DEFAULT 'RESIDENT',
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_supabase_user_id" UNIQUE ("supabase_user_id")
      )
    `);

    // Criar indices
    await queryRunner.query(`
      CREATE INDEX "idx_users_supabase_user_id" ON "users" ("supabase_user_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_users_tenant_id" ON "users" ("tenant_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_users_email" ON "users" ("email")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "idx_users_email"`);
    await queryRunner.query(`DROP INDEX "idx_users_tenant_id"`);
    await queryRunner.query(`DROP INDEX "idx_users_supabase_user_id"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "user_role_enum"`);
  }
}
