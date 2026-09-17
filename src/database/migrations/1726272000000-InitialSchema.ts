import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1726272000000 implements MigrationInterface {
  name = 'InitialSchema1726272000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(), "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(), "version" integer NOT NULL DEFAULT 1,
        "email" varchar(255) NOT NULL UNIQUE, "password_hash" varchar(255) NOT NULL,
        "full_name" varchar(120) NOT NULL, "phone" varchar(30), "avatar_url" varchar,
        "roles" text NOT NULL DEFAULT 'ATTENDEE', "status" varchar NOT NULL DEFAULT 'PENDING_VERIFICATION',
        "verified_at" timestamptz
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "categories" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(), "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(), "version" integer NOT NULL DEFAULT 1,
        "name" varchar(100) NOT NULL, "slug" varchar(120) NOT NULL UNIQUE, "deleted_at" timestamptz
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "events" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(), "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(), "version" integer NOT NULL DEFAULT 1,
        "title" varchar(180) NOT NULL, "slug" varchar(200) NOT NULL UNIQUE, "description" text NOT NULL,
        "venue" varchar(255) NOT NULL, "start_at" timestamptz NOT NULL, "end_at" timestamptz NOT NULL,
        "status" varchar NOT NULL DEFAULT 'DRAFT', "cover_url" varchar, "reminder_sent_at" timestamptz,
        "organizer_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
        "category_id" uuid NOT NULL REFERENCES "categories"("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query('CREATE INDEX "IDX_events_status_start" ON "events" ("status", "start_at")');
    await queryRunner.query(`
      CREATE TABLE "ticket_types" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(), "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(), "version" integer NOT NULL DEFAULT 1,
        "name" varchar(100) NOT NULL, "price" numeric(12,2) NOT NULL DEFAULT 0,
        "capacity" integer NOT NULL, "sold" integer NOT NULL DEFAULT 0,
        "event_id" uuid NOT NULL REFERENCES "events"("id") ON DELETE CASCADE,
        CONSTRAINT "CHK_ticket_inventory" CHECK ("capacity" >= 0 AND "sold" >= 0 AND "sold" <= "capacity"),
        CONSTRAINT "UQ_ticket_type_event_name" UNIQUE ("event_id", "name")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "registrations" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(), "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(), "version" integer NOT NULL DEFAULT 1,
        "status" varchar NOT NULL DEFAULT 'CONFIRMED', "quantity" integer NOT NULL,
        "total_amount" numeric(12,2) NOT NULL, "idempotency_key" varchar(80) NOT NULL,
        "cancelled_at" timestamptz, "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
        "event_id" uuid NOT NULL REFERENCES "events"("id") ON DELETE RESTRICT,
        CONSTRAINT "UQ_registration_idempotency" UNIQUE ("user_id", "idempotency_key")
      )
    `);
    await queryRunner.query('CREATE INDEX "IDX_registrations_event_status" ON "registrations" ("event_id", "status")');
    await queryRunner.query(`
      CREATE TABLE "tickets" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(), "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(), "version" integer NOT NULL DEFAULT 1,
        "qr_token" varchar(64) NOT NULL UNIQUE, "checked_in_at" timestamptz,
        "registration_id" uuid NOT NULL REFERENCES "registrations"("id") ON DELETE CASCADE,
        "ticket_type_id" uuid NOT NULL REFERENCES "ticket_types"("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "refresh_tokens" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(), "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(), "version" integer NOT NULL DEFAULT 1,
        "token_hash" varchar(64) NOT NULL UNIQUE, "expires_at" timestamptz NOT NULL, "revoked_at" timestamptz,
        "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query('CREATE INDEX "IDX_refresh_tokens_expires" ON "refresh_tokens" ("expires_at")');
    await queryRunner.query(`
      CREATE TABLE "audit_logs" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(), "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(), "version" integer NOT NULL DEFAULT 1,
        "actor_id" uuid, "action" varchar(80) NOT NULL, "entity_type" varchar(80) NOT NULL,
        "entity_id" uuid, "metadata" jsonb
      )
    `);
    await queryRunner.query('CREATE INDEX "IDX_audit_actor_created" ON "audit_logs" ("actor_id", "created_at")');
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    for (const table of ['audit_logs', 'refresh_tokens', 'tickets', 'registrations', 'ticket_types', 'events', 'categories', 'users']) {
      await queryRunner.query(`DROP TABLE IF EXISTS "${table}"`);
    }
  }
}
