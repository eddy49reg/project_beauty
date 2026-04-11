-- AlterTable
ALTER TABLE "users" ALTER COLUMN "phone" SET DATA TYPE VARCHAR(32) USING (TRIM("phone"::text));
