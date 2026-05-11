CREATE TABLE "judge_scores" (
    "id" SERIAL NOT NULL,
    "work_id" INTEGER NOT NULL,
    "judge_id" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "judge_scores_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "judge_scores_work_judge_uq"
ON "judge_scores"("work_id", "judge_id");

ALTER TABLE "judge_scores"
ADD CONSTRAINT "judge_scores_work_id_fkey"
FOREIGN KEY ("work_id") REFERENCES "works"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "judge_scores"
ADD CONSTRAINT "judge_scores_judge_id_fkey"
FOREIGN KEY ("judge_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
