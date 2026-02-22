import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFinanceModule1737776700000 implements MigrationInterface {
  name = 'CreateFinanceModule1737776700000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── Enums para financial_transactions ──────────────────────────────────
    await queryRunner.query(`
      CREATE TYPE "public"."financial_transactions_type_enum"
      AS ENUM ('INCOME', 'EXPENSE')
    `);
    await queryRunner.query(`
      CREATE TYPE "public"."financial_transactions_category_enum"
      AS ENUM ('COMMON_FEES', 'MAINTENANCE', 'UTILITIES', 'SALARY', 'INSURANCE', 'RESERVE_FUND', 'OTHER')
    `);

    // ── Tabela financial_transactions ──────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "financial_transactions" (
        "id"          uuid              NOT NULL DEFAULT uuid_generate_v4(),
        "tenant_id"   uuid              NOT NULL,
        "type"        "public"."financial_transactions_type_enum" NOT NULL,
        "category"    "public"."financial_transactions_category_enum" NOT NULL DEFAULT 'OTHER',
        "description" character varying(255) NOT NULL,
        "amount"      numeric(12,2)     NOT NULL,
        "date"        date              NOT NULL,
        "reference"   character varying(100),
        "created_by"  uuid              NOT NULL,
        "created_at"  TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at"  TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_financial_transactions" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_financial_transactions_tenant_id" ON "financial_transactions" ("tenant_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_financial_transactions_date"      ON "financial_transactions" ("date")`);
    await queryRunner.query(`CREATE INDEX "IDX_financial_transactions_created_by" ON "financial_transactions" ("created_by")`);

    await queryRunner.query(`
      ALTER TABLE "financial_transactions"
        ADD CONSTRAINT "FK_financial_transactions_tenant"
        FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "financial_transactions"
        ADD CONSTRAINT "FK_financial_transactions_user"
        FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    // ── Enum para finance_budgets ──────────────────────────────────────────
    await queryRunner.query(`
      CREATE TYPE "public"."finance_budgets_category_enum"
      AS ENUM ('COMMON_FEES', 'MAINTENANCE', 'UTILITIES', 'SALARY', 'INSURANCE', 'RESERVE_FUND', 'OTHER')
    `);

    // ── Tabela finance_budgets ─────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "finance_budgets" (
        "id"         uuid              NOT NULL DEFAULT uuid_generate_v4(),
        "tenant_id"  uuid              NOT NULL,
        "category"   "public"."finance_budgets_category_enum" NOT NULL,
        "year"       smallint          NOT NULL,
        "month"      smallint          NOT NULL,
        "amount"     numeric(12,2)     NOT NULL,
        "notes"      character varying(255),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_finance_budgets" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_finance_budgets_tenant_category_year_month"
          UNIQUE ("tenant_id", "category", "year", "month")
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_finance_budgets_tenant_id" ON "finance_budgets" ("tenant_id")`);

    await queryRunner.query(`
      ALTER TABLE "finance_budgets"
        ADD CONSTRAINT "FK_finance_budgets_tenant"
        FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    // ── Enums para finance_recurring ───────────────────────────────────────
    await queryRunner.query(`
      CREATE TYPE "public"."finance_recurring_type_enum"
      AS ENUM ('INCOME', 'EXPENSE')
    `);
    await queryRunner.query(`
      CREATE TYPE "public"."finance_recurring_category_enum"
      AS ENUM ('COMMON_FEES', 'MAINTENANCE', 'UTILITIES', 'SALARY', 'INSURANCE', 'RESERVE_FUND', 'OTHER')
    `);
    await queryRunner.query(`
      CREATE TYPE "public"."finance_recurring_frequency_enum"
      AS ENUM ('MONTHLY', 'BIMONTHLY', 'QUARTERLY', 'SEMIANNUAL', 'ANNUAL')
    `);

    // ── Tabela finance_recurring ───────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "finance_recurring" (
        "id"          uuid              NOT NULL DEFAULT uuid_generate_v4(),
        "tenant_id"   uuid              NOT NULL,
        "type"        "public"."finance_recurring_type_enum"      NOT NULL,
        "category"    "public"."finance_recurring_category_enum"  NOT NULL DEFAULT 'OTHER',
        "description" character varying(255) NOT NULL,
        "amount"      numeric(12,2)     NOT NULL,
        "frequency"   "public"."finance_recurring_frequency_enum" NOT NULL DEFAULT 'MONTHLY',
        "start_date"  date              NOT NULL,
        "end_date"    date,
        "reference"   character varying(100),
        "active"      boolean           NOT NULL DEFAULT true,
        "created_by"  uuid              NOT NULL,
        "created_at"  TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at"  TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_finance_recurring" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_finance_recurring_tenant_id"   ON "finance_recurring" ("tenant_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_finance_recurring_created_by"  ON "finance_recurring" ("created_by")`);

    await queryRunner.query(`
      ALTER TABLE "finance_recurring"
        ADD CONSTRAINT "FK_finance_recurring_tenant"
        FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "finance_recurring"
        ADD CONSTRAINT "FK_finance_recurring_user"
        FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "finance_recurring" DROP CONSTRAINT "FK_finance_recurring_user"`);
    await queryRunner.query(`ALTER TABLE "finance_recurring" DROP CONSTRAINT "FK_finance_recurring_tenant"`);
    await queryRunner.query(`DROP INDEX "IDX_finance_recurring_created_by"`);
    await queryRunner.query(`DROP INDEX "IDX_finance_recurring_tenant_id"`);
    await queryRunner.query(`DROP TABLE "finance_recurring"`);
    await queryRunner.query(`DROP TYPE "public"."finance_recurring_frequency_enum"`);
    await queryRunner.query(`DROP TYPE "public"."finance_recurring_category_enum"`);
    await queryRunner.query(`DROP TYPE "public"."finance_recurring_type_enum"`);

    await queryRunner.query(`ALTER TABLE "finance_budgets" DROP CONSTRAINT "FK_finance_budgets_tenant"`);
    await queryRunner.query(`DROP INDEX "IDX_finance_budgets_tenant_id"`);
    await queryRunner.query(`DROP TABLE "finance_budgets"`);
    await queryRunner.query(`DROP TYPE "public"."finance_budgets_category_enum"`);

    await queryRunner.query(`ALTER TABLE "financial_transactions" DROP CONSTRAINT "FK_financial_transactions_user"`);
    await queryRunner.query(`ALTER TABLE "financial_transactions" DROP CONSTRAINT "FK_financial_transactions_tenant"`);
    await queryRunner.query(`DROP INDEX "IDX_financial_transactions_created_by"`);
    await queryRunner.query(`DROP INDEX "IDX_financial_transactions_date"`);
    await queryRunner.query(`DROP INDEX "IDX_financial_transactions_tenant_id"`);
    await queryRunner.query(`DROP TABLE "financial_transactions"`);
    await queryRunner.query(`DROP TYPE "public"."financial_transactions_category_enum"`);
    await queryRunner.query(`DROP TYPE "public"."financial_transactions_type_enum"`);
  }
}
