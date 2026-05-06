-- CreateEnum
CREATE TYPE "UserAppRole" AS ENUM ('USER', 'ORGANIZER', 'ADMIN');

-- AlterTable
ALTER TABLE "users" ADD COLUMN "app_role" "UserAppRole" NOT NULL DEFAULT 'USER';
