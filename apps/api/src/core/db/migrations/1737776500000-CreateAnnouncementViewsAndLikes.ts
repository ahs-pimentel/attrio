import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAnnouncementViewsAndLikes1737776500000 implements MigrationInterface {
  name = 'CreateAnnouncementViewsAndLikes1737776500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Tabela de visualizacoes
    await queryRunner.query(`
      CREATE TABLE "announcement_views" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "announcement_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_announcement_views" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_announcement_views_user" UNIQUE ("announcement_id", "user_id"),
        CONSTRAINT "FK_announcement_views_announcement" FOREIGN KEY ("announcement_id") REFERENCES "announcements"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_announcement_views_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_announcement_views_announcement_id" ON "announcement_views" ("announcement_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_announcement_views_user_id" ON "announcement_views" ("user_id")`);

    // Tabela de curtidas
    await queryRunner.query(`
      CREATE TABLE "announcement_likes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "announcement_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_announcement_likes" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_announcement_likes_user" UNIQUE ("announcement_id", "user_id"),
        CONSTRAINT "FK_announcement_likes_announcement" FOREIGN KEY ("announcement_id") REFERENCES "announcements"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_announcement_likes_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_announcement_likes_announcement_id" ON "announcement_likes" ("announcement_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_announcement_likes_user_id" ON "announcement_likes" ("user_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "announcement_likes"`);
    await queryRunner.query(`DROP TABLE "announcement_views"`);
  }
}
