CREATE TYPE "WorkStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'OVERDUE');

CREATE TABLE "works" (
    "id" SERIAL NOT NULL,
    "championship_id" INTEGER NOT NULL,
    "nomination_id" INTEGER NOT NULL,
    "author_id" INTEGER NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "status" "WorkStatus" NOT NULL DEFAULT 'DRAFT',
    "submitted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "works_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "works_author_nomination_uq"
ON "works"("author_id", "nomination_id");

ALTER TABLE "works"
ADD CONSTRAINT "works_championship_id_fkey"
FOREIGN KEY ("championship_id") REFERENCES "championships"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "works"
ADD CONSTRAINT "works_nomination_id_fkey"
FOREIGN KEY ("nomination_id") REFERENCES "nominations"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "works"
ADD CONSTRAINT "works_author_id_fkey"
FOREIGN KEY ("author_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
