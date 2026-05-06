-- Nomination привязана к чемпионату; старые строки без чемпиона удаляются (в типовой dev-БД таблица пуста).

ALTER TABLE "nominations" ADD COLUMN "championship_id" INTEGER;

UPDATE "nominations" AS n
SET "championship_id" = c.id
FROM (
  SELECT id FROM "championships" ORDER BY id ASC LIMIT 1
) AS c
WHERE n."championship_id" IS NULL
  AND EXISTS (SELECT 1 FROM "championships" LIMIT 1);

DELETE FROM "nominations" WHERE "championship_id" IS NULL;

ALTER TABLE "nominations" ALTER COLUMN "championship_id" SET NOT NULL;

ALTER TABLE "nominations"
ADD CONSTRAINT "nominations_championship_id_fkey"
FOREIGN KEY ("championship_id") REFERENCES "championships"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "nominations_championship_title_uq"
ON "nominations"("championship_id", "title");
