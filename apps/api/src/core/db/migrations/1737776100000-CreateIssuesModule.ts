import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateIssuesModule1737776100000 implements MigrationInterface {
  name = 'CreateIssuesModule1737776100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "issue_status_enum" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED')
    `);
    await queryRunner.query(`
      CREATE TYPE "issue_priority_enum" AS ENUM ('LOW', 'MEDIUM', 'HIGH')
    `);

    await queryRunner.query(`
      CREATE TABLE "issue_categories" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "name" varchar(100) NOT NULL,
        "active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_issue_categories" PRIMARY KEY ("id"),
        CONSTRAINT "FK_issue_categories_tenant" FOREIGN KEY ("tenant_id")
          REFERENCES "tenants"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_issue_categories_tenant_id" ON "issue_categories" ("tenant_id")
    `);

    await queryRunner.query(`
      CREATE TABLE "issues" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "unit_id" uuid,
        "category_id" uuid,
        "title" varchar(255) NOT NULL,
        "description" text NOT NULL,
        "status" "issue_status_enum" NOT NULL DEFAULT 'OPEN',
        "priority" "issue_priority_enum" NOT NULL DEFAULT 'MEDIUM',
        "created_by" uuid NOT NULL,
        "resolved_by" uuid,
        "resolved_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_issues" PRIMARY KEY ("id"),
        CONSTRAINT "FK_issues_tenant" FOREIGN KEY ("tenant_id")
          REFERENCES "tenants"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_issues_unit" FOREIGN KEY ("unit_id")
          REFERENCES "units"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_issues_category" FOREIGN KEY ("category_id")
          REFERENCES "issue_categories"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_issues_created_by" FOREIGN KEY ("created_by")
          REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_issues_resolved_by" FOREIGN KEY ("resolved_by")
          REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_issues_tenant_id" ON "issues" ("tenant_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_issues_unit_id" ON "issues" ("unit_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_issues_status" ON "issues" ("status")`);
    await queryRunner.query(`CREATE INDEX "IDX_issues_created_by" ON "issues" ("created_by")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_issues_created_by"`);
    await queryRunner.query(`DROP INDEX "IDX_issues_status"`);
    await queryRunner.query(`DROP INDEX "IDX_issues_unit_id"`);
    await queryRunner.query(`DROP INDEX "IDX_issues_tenant_id"`);
    await queryRunner.query(`DROP TABLE "issues"`);
    await queryRunner.query(`DROP INDEX "IDX_issue_categories_tenant_id"`);
    await queryRunner.query(`DROP TABLE "issue_categories"`);
    await queryRunner.query(`DROP TYPE "issue_priority_enum"`);
    await queryRunner.query(`DROP TYPE "issue_status_enum"`);
  }
}
