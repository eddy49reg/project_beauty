-- Singleton table for Yandex Disk OAuth (refresh + cached access token).
CREATE TABLE "yandex_disk_oauth_state" (
    "id" INTEGER NOT NULL,
    "refresh_token" TEXT NOT NULL,
    "access_token" TEXT NOT NULL,
    "access_token_expires_at" TIMESTAMPTZ(6) NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "yandex_disk_oauth_state_pkey" PRIMARY KEY ("id")
);
