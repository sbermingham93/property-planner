-- Hand edits to the generated SQL:
-- 1. Enable PostGIS, which the location column needs.
-- 2. Add SRID 4326 to the location column; drizzle-kit 0.31 drops the srid option when generating.
CREATE EXTENSION IF NOT EXISTS postgis;--> statement-breakpoint
CREATE TYPE "public"."application_type" AS ENUM('permission', 'outline', 'retention', 'permission_and_retention', 'extension_of_duration', 'section_5_exemption', 'other');--> statement-breakpoint
CREATE TYPE "public"."decision" AS ENUM('grant', 'grant_with_conditions', 'refuse', 'split', 'invalid', 'withdrawn', 'pending');--> statement-breakpoint
CREATE TABLE "appeals" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "appeals_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"application_id" bigint NOT NULL,
	"case_number" text NOT NULL,
	"status_raw" text,
	"decision_raw" text,
	"submitted_date" date,
	"decision_date" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "appeals_case_number_unique" UNIQUE("case_number")
);
--> statement-breakpoint
CREATE TABLE "applications" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "applications_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"council_slug" text NOT NULL,
	"application_number" text NOT NULL,
	"site_id" text,
	"description" text,
	"address" text,
	"eircode" text,
	"location" geometry(point, 4326),
	"application_type_raw" text,
	"application_type" "application_type",
	"status_raw" text,
	"decision_raw" text,
	"decision" "decision",
	"land_use_code_raw" text,
	"one_off_house_raw" text,
	"one_off_kpi_raw" text,
	"residential_units" integer,
	"floor_area" double precision,
	"site_area" double precision,
	"received_date" date,
	"decision_due_date" date,
	"decision_date" date,
	"grant_date" date,
	"withdrawn_date" date,
	"expiry_date" date,
	"further_info_requested_date" date,
	"further_info_received_date" date,
	"council_file_url" text,
	"source_object_id" integer,
	"source_updated_date" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "applications_council_number_unique" UNIQUE("council_slug","application_number")
);
--> statement-breakpoint
CREATE TABLE "councils" (
	"slug" text PRIMARY KEY NOT NULL,
	"dataset_name" text NOT NULL,
	"county" text NOT NULL,
	CONSTRAINT "councils_dataset_name_unique" UNIQUE("dataset_name")
);
--> statement-breakpoint
CREATE TABLE "ingest_runs" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "ingest_runs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"source" text NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"records_seen" integer DEFAULT 0 NOT NULL,
	"records_loaded" integer DEFAULT 0 NOT NULL,
	"records_rejected" integer DEFAULT 0 NOT NULL,
	"error" text
);
--> statement-breakpoint
ALTER TABLE "appeals" ADD CONSTRAINT "appeals_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_council_slug_councils_slug_fk" FOREIGN KEY ("council_slug") REFERENCES "public"."councils"("slug") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "appeals_application_id_idx" ON "appeals" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "applications_received_date_idx" ON "applications" USING btree ("received_date");--> statement-breakpoint
CREATE INDEX "applications_site_id_idx" ON "applications" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "applications_location_idx" ON "applications" USING gist ("location");