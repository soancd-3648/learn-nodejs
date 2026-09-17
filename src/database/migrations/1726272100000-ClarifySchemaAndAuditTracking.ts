import { MigrationInterface, QueryRunner } from 'typeorm';

export class ClarifySchemaAndAuditTracking1726272100000 implements MigrationInterface {
  name = 'ClarifySchemaAndAuditTracking1726272100000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "registrations" RENAME TO "event_registrations"');
    await queryRunner.query('ALTER TABLE "categories" RENAME TO "event_categories"');
    await queryRunner.query('ALTER TABLE "ticket_types" RENAME TO "event_ticket_types"');
    await queryRunner.query('ALTER TABLE "refresh_tokens" RENAME TO "user_refresh_tokens"');
    await queryRunner.query('ALTER TABLE "audit_logs" RENAME COLUMN "actor_id" TO "actor_user_id"');
    await queryRunner.query('ALTER TABLE "audit_logs" RENAME COLUMN "entity_type" TO "target_type"');
    await queryRunner.query('ALTER TABLE "audit_logs" RENAME COLUMN "entity_id" TO "target_id"');
    await queryRunner.query('ALTER TABLE "audit_logs" RENAME COLUMN "metadata" TO "details"');
    await queryRunner.query('ALTER TABLE "audit_logs" DROP COLUMN "updated_at"');
    await queryRunner.query('ALTER TABLE "audit_logs" DROP COLUMN "version"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_audit_actor_created"');
    await queryRunner.query('ALTER TABLE "users" RENAME CONSTRAINT "users_email_key" TO "UQ_users_email"');
    await queryRunner.query('ALTER TABLE "event_categories" RENAME CONSTRAINT "categories_slug_key" TO "UQ_event_categories_slug"');
    await queryRunner.query('ALTER TABLE "events" RENAME CONSTRAINT "events_slug_key" TO "UQ_events_slug"');
    await queryRunner.query('ALTER TABLE "event_ticket_types" RENAME CONSTRAINT "UQ_ticket_type_event_name" TO "UQ_event_ticket_types_event_name"');
    await queryRunner.query('ALTER TABLE "event_ticket_types" RENAME CONSTRAINT "CHK_ticket_inventory" TO "CHK_event_ticket_types_inventory"');
    await queryRunner.query('ALTER TABLE "event_registrations" RENAME CONSTRAINT "UQ_registration_idempotency" TO "UQ_event_registrations_user_idempotency_key"');
    await queryRunner.query('ALTER TABLE "tickets" RENAME CONSTRAINT "tickets_qr_token_key" TO "UQ_tickets_qr_token"');
    await queryRunner.query('ALTER TABLE "user_refresh_tokens" RENAME CONSTRAINT "refresh_tokens_token_hash_key" TO "UQ_user_refresh_tokens_token_hash"');
    await queryRunner.query('ALTER INDEX "IDX_events_status_start" RENAME TO "IDX_events_status_start_at"');
    await queryRunner.query('ALTER INDEX "IDX_refresh_tokens_expires" RENAME TO "IDX_user_refresh_tokens_expires_at"');
    await queryRunner.query('DROP INDEX "IDX_registrations_event_status"');
    await queryRunner.query(`
      ALTER TABLE "audit_logs"
      ADD CONSTRAINT "FK_audit_logs_actor_user"
      FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL
    `);

    await queryRunner.query('CREATE INDEX "IDX_users_created_at" ON "users" ("created_at")');
    await queryRunner.query('CREATE INDEX "IDX_event_categories_name" ON "event_categories" ("name")');
    await queryRunner.query('CREATE INDEX "IDX_events_category_status_start_at" ON "events" ("category_id", "status", "start_at")');
    await queryRunner.query('CREATE INDEX "IDX_events_organizer_created_at" ON "events" ("organizer_id", "created_at")');
    await queryRunner.query('CREATE INDEX "IDX_user_refresh_tokens_user_revoked_at" ON "user_refresh_tokens" ("user_id", "revoked_at")');
    await queryRunner.query('CREATE INDEX "IDX_event_registrations_user_created_at" ON "event_registrations" ("user_id", "created_at")');
    await queryRunner.query('CREATE INDEX "IDX_event_registrations_event_status_created_at" ON "event_registrations" ("event_id", "status", "created_at")');
    await queryRunner.query('CREATE INDEX "IDX_tickets_registration_id" ON "tickets" ("registration_id")');
    await queryRunner.query('CREATE INDEX "IDX_tickets_ticket_type_id" ON "tickets" ("ticket_type_id")');
    await queryRunner.query('CREATE INDEX "IDX_audit_logs_actor_created_at" ON "audit_logs" ("actor_user_id", "created_at")');
    await queryRunner.query('CREATE INDEX "IDX_audit_logs_target" ON "audit_logs" ("target_type", "target_id")');
    await queryRunner.query('CREATE INDEX "IDX_audit_logs_created_at" ON "audit_logs" ("created_at")');

    await queryRunner.query('ALTER TABLE "users" ADD CONSTRAINT "CHK_users_email_lowercase" CHECK ("email" = lower("email"))');
    await queryRunner.query('ALTER TABLE "events" ADD CONSTRAINT "CHK_events_date_range" CHECK ("end_at" > "start_at")');
    await queryRunner.query('ALTER TABLE "event_ticket_types" ADD CONSTRAINT "CHK_event_ticket_types_price" CHECK ("price" >= 0)');
    await queryRunner.query('ALTER TABLE "event_registrations" ADD CONSTRAINT "CHK_event_registrations_quantity" CHECK ("quantity" > 0)');
    await queryRunner.query('ALTER TABLE "event_registrations" ADD CONSTRAINT "CHK_event_registrations_total_amount" CHECK ("total_amount" >= 0)');
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "event_registrations" DROP CONSTRAINT "CHK_event_registrations_total_amount"');
    await queryRunner.query('ALTER TABLE "event_registrations" DROP CONSTRAINT "CHK_event_registrations_quantity"');
    await queryRunner.query('ALTER TABLE "event_ticket_types" DROP CONSTRAINT "CHK_event_ticket_types_price"');
    await queryRunner.query('ALTER TABLE "events" DROP CONSTRAINT "CHK_events_date_range"');
    await queryRunner.query('ALTER TABLE "users" DROP CONSTRAINT "CHK_users_email_lowercase"');

    await queryRunner.query('DROP INDEX "IDX_audit_logs_created_at"');
    await queryRunner.query('DROP INDEX "IDX_audit_logs_target"');
    await queryRunner.query('DROP INDEX "IDX_audit_logs_actor_created_at"');
    await queryRunner.query('DROP INDEX "IDX_tickets_ticket_type_id"');
    await queryRunner.query('DROP INDEX "IDX_tickets_registration_id"');
    await queryRunner.query('DROP INDEX "IDX_event_registrations_event_status_created_at"');
    await queryRunner.query('DROP INDEX "IDX_event_registrations_user_created_at"');
    await queryRunner.query('DROP INDEX "IDX_user_refresh_tokens_user_revoked_at"');
    await queryRunner.query('DROP INDEX "IDX_events_organizer_created_at"');
    await queryRunner.query('DROP INDEX "IDX_events_category_status_start_at"');
    await queryRunner.query('DROP INDEX "IDX_event_categories_name"');
    await queryRunner.query('DROP INDEX "IDX_users_created_at"');

    await queryRunner.query('CREATE INDEX "IDX_registrations_event_status" ON "event_registrations" ("event_id", "status")');
    await queryRunner.query('ALTER INDEX "IDX_user_refresh_tokens_expires_at" RENAME TO "IDX_refresh_tokens_expires"');
    await queryRunner.query('ALTER INDEX "IDX_events_status_start_at" RENAME TO "IDX_events_status_start"');
    await queryRunner.query('ALTER TABLE "user_refresh_tokens" RENAME CONSTRAINT "UQ_user_refresh_tokens_token_hash" TO "refresh_tokens_token_hash_key"');
    await queryRunner.query('ALTER TABLE "tickets" RENAME CONSTRAINT "UQ_tickets_qr_token" TO "tickets_qr_token_key"');
    await queryRunner.query('ALTER TABLE "event_registrations" RENAME CONSTRAINT "UQ_event_registrations_user_idempotency_key" TO "UQ_registration_idempotency"');
    await queryRunner.query('ALTER TABLE "event_ticket_types" RENAME CONSTRAINT "CHK_event_ticket_types_inventory" TO "CHK_ticket_inventory"');
    await queryRunner.query('ALTER TABLE "event_ticket_types" RENAME CONSTRAINT "UQ_event_ticket_types_event_name" TO "UQ_ticket_type_event_name"');
    await queryRunner.query('ALTER TABLE "events" RENAME CONSTRAINT "UQ_events_slug" TO "events_slug_key"');
    await queryRunner.query('ALTER TABLE "event_categories" RENAME CONSTRAINT "UQ_event_categories_slug" TO "categories_slug_key"');
    await queryRunner.query('ALTER TABLE "users" RENAME CONSTRAINT "UQ_users_email" TO "users_email_key"');

    await queryRunner.query('ALTER TABLE "audit_logs" DROP CONSTRAINT "FK_audit_logs_actor_user"');
    await queryRunner.query('CREATE INDEX "IDX_audit_actor_created" ON "audit_logs" ("actor_user_id", "created_at")');
    await queryRunner.query('ALTER TABLE "audit_logs" ADD COLUMN "version" integer NOT NULL DEFAULT 1');
    await queryRunner.query('ALTER TABLE "audit_logs" ADD COLUMN "updated_at" timestamptz NOT NULL DEFAULT now()');
    await queryRunner.query('ALTER TABLE "audit_logs" RENAME COLUMN "details" TO "metadata"');
    await queryRunner.query('ALTER TABLE "audit_logs" RENAME COLUMN "target_id" TO "entity_id"');
    await queryRunner.query('ALTER TABLE "audit_logs" RENAME COLUMN "target_type" TO "entity_type"');
    await queryRunner.query('ALTER TABLE "audit_logs" RENAME COLUMN "actor_user_id" TO "actor_id"');
    await queryRunner.query('ALTER TABLE "user_refresh_tokens" RENAME TO "refresh_tokens"');
    await queryRunner.query('ALTER TABLE "event_ticket_types" RENAME TO "ticket_types"');
    await queryRunner.query('ALTER TABLE "event_categories" RENAME TO "categories"');
    await queryRunner.query('ALTER TABLE "event_registrations" RENAME TO "registrations"');
  }
}
