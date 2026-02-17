import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSubscriptionToTenants1737776600000 implements MigrationInterface {
  name = 'AddSubscriptionToTenants1737776600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "tenants"
        ADD COLUMN "plan" varchar(50) NOT NULL DEFAULT 'STARTER',
        ADD COLUMN "subscription_status" varchar(50) NOT NULL DEFAULT 'ACTIVE',
        ADD COLUMN "stripe_customer_id" varchar(255) UNIQUE,
        ADD COLUMN "stripe_subscription_id" varchar(255) UNIQUE,
        ADD COLUMN "max_units" integer NOT NULL DEFAULT 30,
        ADD COLUMN "trial_ends_at" timestamptz,
        ADD COLUMN "current_period_end" timestamptz
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_tenants_stripe_customer_id" ON "tenants" ("stripe_customer_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "idx_tenants_stripe_customer_id"`);
    await queryRunner.query(`
      ALTER TABLE "tenants"
        DROP COLUMN "current_period_end",
        DROP COLUMN "trial_ends_at",
        DROP COLUMN "max_units",
        DROP COLUMN "stripe_subscription_id",
        DROP COLUMN "stripe_customer_id",
        DROP COLUMN "subscription_status",
        DROP COLUMN "plan"
    `);
  }
}
