-- Вложения к работам (файлы на Яндекс.Диске, публичная ссылка для просмотра)

CREATE TABLE "work_attachments" (
    "id" SERIAL NOT NULL,
    "work_id" INTEGER NOT NULL,
    "disk_path" VARCHAR(500) NOT NULL,
    "view_url" VARCHAR(1024),
    "original_name" VARCHAR(255) NOT NULL,
    "mime_type" VARCHAR(120) NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "work_attachments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "work_attachments_work_id_idx" ON "work_attachments"("work_id");

ALTER TABLE "work_attachments" ADD CONSTRAINT "work_attachments_work_id_fkey" FOREIGN KEY ("work_id") REFERENCES "works"("id") ON DELETE CASCADE ON UPDATE CASCADE;
