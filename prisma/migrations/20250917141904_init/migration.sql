-- CreateEnum
CREATE TYPE "public"."newsletter_type" AS ENUM ('CLOSURE', 'MAINTENANCE', 'EVENT', 'GENERAL');

-- CreateEnum
CREATE TYPE "public"."priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "public"."newsletter_status" AS ENUM ('DRAFT', 'SENT', 'SCHEDULED');

-- CreateTable
CREATE TABLE "public"."newsletters" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "public"."newsletter_type" NOT NULL,
    "priority" "public"."priority" NOT NULL DEFAULT 'MEDIUM',
    "status" "public"."newsletter_status" NOT NULL DEFAULT 'DRAFT',
    "start_date" DATE,
    "end_date" DATE,
    "scheduled_for" TIMESTAMP(3),
    "sent_at" TIMESTAMP(3),
    "recipient_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "newsletters_pkey" PRIMARY KEY ("id")
);
