/*
  Warnings:

  - The `processed_by` column on the `payments` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[qr_code]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "public"."user_role" AS ENUM ('ADMIN', 'STAFF', 'MEMBER');

-- AlterTable
ALTER TABLE "public"."membership_plans" ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "public"."payments" DROP COLUMN "processed_by",
ADD COLUMN     "processed_by" UUID;

-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "password" TEXT,
ADD COLUMN     "qr_code" TEXT,
ADD COLUMN     "role" "public"."user_role" NOT NULL DEFAULT 'MEMBER',
ADD COLUMN     "subscribe_to_newsletter" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "subscribe_to_notifications" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "users_qr_code_key" ON "public"."users"("qr_code");

-- AddForeignKey
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_processed_by_fkey" FOREIGN KEY ("processed_by") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
