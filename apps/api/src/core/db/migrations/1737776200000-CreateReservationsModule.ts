import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateReservationsModule1737776200000 implements MigrationInterface {
  name = 'CreateReservationsModule1737776200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "reservation_status_enum" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')
    `);

    await queryRunner.query(`
      CREATE TABLE "common_areas" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "name" varchar(100) NOT NULL,
        "description" text,
        "rules" text,
        "max_capacity" int,
        "active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_common_areas" PRIMARY KEY ("id"),
        CONSTRAINT "FK_common_areas_tenant" FOREIGN KEY ("tenant_id")
          REFERENCES "tenants"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_common_areas_tenant_id" ON "common_areas" ("tenant_id")
    `);

    await queryRunner.query(`
      CREATE TABLE "reservations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "common_area_id" uuid NOT NULL,
        "reserved_by" uuid NOT NULL,
        "reservation_date" date NOT NULL,
        "status" "reservation_status_enum" NOT NULL DEFAULT 'PENDING',
        "notes" text,
        "approved_by" uuid,
        "approved_at" TIMESTAMP,
        "rejection_reason" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_reservations" PRIMARY KEY ("id"),
        CONSTRAINT "FK_reservations_tenant" FOREIGN KEY ("tenant_id")
          REFERENCES "tenants"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_reservations_common_area" FOREIGN KEY ("common_area_id")
          REFERENCES "common_areas"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_reservations_reserved_by" FOREIGN KEY ("reserved_by")
          REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_reservations_approved_by" FOREIGN KEY ("approved_by")
          REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_reservations_tenant_id" ON "reservations" ("tenant_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_reservations_common_area_id" ON "reservations" ("common_area_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_reservations_reserved_by" ON "reservations" ("reserved_by")`);
    await queryRunner.query(`CREATE INDEX "IDX_reservations_date" ON "reservations" ("reservation_date")`);
    await queryRunner.query(`CREATE INDEX "IDX_reservations_status" ON "reservations" ("status")`);

    // Apenas uma reserva PENDING/APPROVED por area por dia
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_reservations_area_date_active"
      ON "reservations" ("common_area_id", "reservation_date")
      WHERE "status" IN ('PENDING', 'APPROVED')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "UQ_reservations_area_date_active"`);
    await queryRunner.query(`DROP INDEX "IDX_reservations_status"`);
    await queryRunner.query(`DROP INDEX "IDX_reservations_date"`);
    await queryRunner.query(`DROP INDEX "IDX_reservations_reserved_by"`);
    await queryRunner.query(`DROP INDEX "IDX_reservations_common_area_id"`);
    await queryRunner.query(`DROP INDEX "IDX_reservations_tenant_id"`);
    await queryRunner.query(`DROP TABLE "reservations"`);
    await queryRunner.query(`DROP INDEX "IDX_common_areas_tenant_id"`);
    await queryRunner.query(`DROP TABLE "common_areas"`);
    await queryRunner.query(`DROP TYPE "reservation_status_enum"`);
  }
}
