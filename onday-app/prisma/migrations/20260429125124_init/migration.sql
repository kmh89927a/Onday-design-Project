-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "auth_provider" TEXT NOT NULL,
    "mode" TEXT NOT NULL DEFAULT 'couple',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "diagnoses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "address_a" TEXT NOT NULL,
    "address_b" TEXT,
    "filters" TEXT NOT NULL DEFAULT '{}',
    "candidates" TEXT NOT NULL DEFAULT '[]',
    "mode" TEXT NOT NULL DEFAULT 'couple',
    "deadline_mode" BOOLEAN NOT NULL DEFAULT false,
    "deadline" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "diagnoses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "share_links" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "diagnosis_id" TEXT NOT NULL,
    "unique_url" TEXT NOT NULL,
    "password_hash" TEXT,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "free_preview_used" BOOLEAN NOT NULL DEFAULT false,
    "expires_at" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "share_links_diagnosis_id_fkey" FOREIGN KEY ("diagnosis_id") REFERENCES "diagnoses" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "saved_searches" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "search_params" TEXT NOT NULL,
    "saved_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "saved_searches_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "diagnoses_user_id_idx" ON "diagnoses"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "share_links_diagnosis_id_key" ON "share_links"("diagnosis_id");

-- CreateIndex
CREATE UNIQUE INDEX "share_links_unique_url_key" ON "share_links"("unique_url");

-- CreateIndex
CREATE UNIQUE INDEX "saved_searches_user_id_key" ON "saved_searches"("user_id");
