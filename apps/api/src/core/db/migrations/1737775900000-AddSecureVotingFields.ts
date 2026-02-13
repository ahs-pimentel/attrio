import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSecureVotingFields1737775900000 implements MigrationInterface {
  name = 'AddSecureVotingFields1737775900000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ==================== ENUM ====================
    // Criar enum para status de aprovacao do participante (se nao existir)
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "participant_approval_status_enum" AS ENUM ('APPROVED', 'PENDING', 'REJECTED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // ==================== ASSEMBLIES ====================
    // Adicionar campos de OTP para check-in
    await queryRunner.query(`
      ALTER TABLE "assemblies"
      ADD COLUMN IF NOT EXISTS "current_otp" varchar(6),
      ADD COLUMN IF NOT EXISTS "otp_generated_at" TIMESTAMP WITH TIME ZONE,
      ADD COLUMN IF NOT EXISTS "otp_expires_at" TIMESTAMP WITH TIME ZONE
    `);

    // ==================== ASSEMBLY_PARTICIPANTS ====================
    // Adicionar campos de procuracao e sessao
    await queryRunner.query(`
      ALTER TABLE "assembly_participants"
      ADD COLUMN IF NOT EXISTS "proxy_file_url" varchar(500),
      ADD COLUMN IF NOT EXISTS "proxy_file_name" varchar(255),
      ADD COLUMN IF NOT EXISTS "approved_by" uuid,
      ADD COLUMN IF NOT EXISTS "approved_at" TIMESTAMP WITH TIME ZONE,
      ADD COLUMN IF NOT EXISTS "rejection_reason" text,
      ADD COLUMN IF NOT EXISTS "session_token" varchar(64)
    `);

    // Adicionar coluna de approval_status separadamente (precisa verificar tipo)
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "assembly_participants"
        ADD COLUMN "approval_status" "participant_approval_status_enum" NOT NULL DEFAULT 'APPROVED';
      EXCEPTION
        WHEN duplicate_column THEN null;
      END $$;
    `);

    // Criar indice para session_token (se nao existir)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_participant_session_token" ON "assembly_participants" ("session_token")
    `);

    // Criar indice para approval_status (se nao existir)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_participant_approval_status" ON "assembly_participants" ("approval_status")
    `);

    // Criar constraint unique para session_token (se nao existir)
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "assembly_participants" ADD CONSTRAINT "UQ_participant_session_token" UNIQUE ("session_token");
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // ==================== AGENDA_ITEMS ====================
    // Adicionar campos de OTP para votacao
    await queryRunner.query(`
      ALTER TABLE "agenda_items"
      ADD COLUMN IF NOT EXISTS "voting_otp" varchar(6),
      ADD COLUMN IF NOT EXISTS "voting_otp_generated_at" TIMESTAMP WITH TIME ZONE,
      ADD COLUMN IF NOT EXISTS "voting_otp_expires_at" TIMESTAMP WITH TIME ZONE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // ==================== AGENDA_ITEMS ====================
    await queryRunner.query(`
      ALTER TABLE "agenda_items"
      DROP COLUMN IF EXISTS "voting_otp",
      DROP COLUMN IF EXISTS "voting_otp_generated_at",
      DROP COLUMN IF EXISTS "voting_otp_expires_at"
    `);

    // ==================== ASSEMBLY_PARTICIPANTS ====================
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_participant_approval_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_participant_session_token"`);
    await queryRunner.query(`ALTER TABLE "assembly_participants" DROP CONSTRAINT IF EXISTS "UQ_participant_session_token"`);
    await queryRunner.query(`
      ALTER TABLE "assembly_participants"
      DROP COLUMN IF EXISTS "proxy_file_url",
      DROP COLUMN IF EXISTS "proxy_file_name",
      DROP COLUMN IF EXISTS "approval_status",
      DROP COLUMN IF EXISTS "approved_by",
      DROP COLUMN IF EXISTS "approved_at",
      DROP COLUMN IF EXISTS "rejection_reason",
      DROP COLUMN IF EXISTS "session_token"
    `);

    // ==================== ASSEMBLIES ====================
    await queryRunner.query(`
      ALTER TABLE "assemblies"
      DROP COLUMN IF EXISTS "current_otp",
      DROP COLUMN IF EXISTS "otp_generated_at",
      DROP COLUMN IF EXISTS "otp_expires_at"
    `);

    // ==================== ENUM ====================
    await queryRunner.query(`DROP TYPE IF EXISTS "participant_approval_status_enum"`);
  }
}
