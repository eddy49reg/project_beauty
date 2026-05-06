-- CreateEnum
CREATE TYPE "ChampionshipStatus" AS ENUM (
    'DRAFT',
    'REGISTRATION',
    'JUDGING',
    'PUBLISHED',
    'ARCHIVED'
);

-- AlterTable
ALTER TABLE "championships"
ADD COLUMN "description" TEXT,
ADD COLUMN "status" "ChampionshipStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN "registration_start_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "registration_end_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "judging_start_at" TIMESTAMPTZ(6),
ADD COLUMN "judging_end_at" TIMESTAMPTZ(6),
ADD COLUMN "result_published_at" TIMESTAMPTZ(6);
