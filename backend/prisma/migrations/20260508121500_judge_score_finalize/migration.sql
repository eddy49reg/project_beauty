ALTER TABLE "judge_scores"
ADD COLUMN "is_final" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "finalized_at" TIMESTAMPTZ(6);
