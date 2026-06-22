-- 3단 집계 파이프라인 (raw → 가집계 → 최종집계) + preview 버전.
-- ★ additive — CREATE TABLE/INDEX 만. 기존 5개 테이블 무변경(ALTER/DROP 0).
-- ★ 롤백 = 아래 6개 테이블 DROP TABLE(기존 데이터 무관).

-- CreateTable ① raw
CREATE TABLE "event_logs" (
    "id" TEXT NOT NULL,
    "event_name" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mode" TEXT,
    "method" TEXT,
    "count" INTEGER,
    "days_left" INTEGER,
    "diagnosis_id" TEXT,
    "visitor_id" TEXT,
    "props" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "event_logs_event_name_idx" ON "event_logs"("event_name");
CREATE INDEX "event_logs_timestamp_idx" ON "event_logs"("timestamp");

-- CreateTable ①-preview
CREATE TABLE "preview_event_logs" (
    "id" TEXT NOT NULL,
    "event_name" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mode" TEXT,
    "method" TEXT,
    "count" INTEGER,
    "days_left" INTEGER,
    "diagnosis_id" TEXT,
    "visitor_id" TEXT,
    "props" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "preview_event_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "preview_event_logs_event_name_idx" ON "preview_event_logs"("event_name");
CREATE INDEX "preview_event_logs_timestamp_idx" ON "preview_event_logs"("timestamp");

-- CreateTable ② 가집계
CREATE TABLE "metric_rollups" (
    "id" TEXT NOT NULL,
    "metric_type" TEXT NOT NULL,
    "bucket" TEXT NOT NULL,
    "bucket_start" TIMESTAMP(3) NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "numerator" INTEGER,
    "denominator" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "metric_rollups_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "metric_rollups_metric_type_bucket_bucket_start_idx" ON "metric_rollups"("metric_type", "bucket", "bucket_start");

-- CreateTable ②-preview
CREATE TABLE "preview_metric_rollups" (
    "id" TEXT NOT NULL,
    "metric_type" TEXT NOT NULL,
    "bucket" TEXT NOT NULL,
    "bucket_start" TIMESTAMP(3) NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "numerator" INTEGER,
    "denominator" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "preview_metric_rollups_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "preview_metric_rollups_metric_type_bucket_bucket_start_idx" ON "preview_metric_rollups"("metric_type", "bucket", "bucket_start");

-- CreateTable ③ 최종집계
CREATE TABLE "metric_aggregates" (
    "id" TEXT NOT NULL,
    "metric_type" TEXT NOT NULL,
    "grain" TEXT NOT NULL,
    "period_start" TIMESTAMP(3) NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "numerator" INTEGER,
    "denominator" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "metric_aggregates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "metric_aggregates_metric_type_grain_period_start_idx" ON "metric_aggregates"("metric_type", "grain", "period_start");

-- CreateTable ③-preview
CREATE TABLE "preview_metric_aggregates" (
    "id" TEXT NOT NULL,
    "metric_type" TEXT NOT NULL,
    "grain" TEXT NOT NULL,
    "period_start" TIMESTAMP(3) NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "numerator" INTEGER,
    "denominator" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "preview_metric_aggregates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "preview_metric_aggregates_metric_type_grain_period_start_idx" ON "preview_metric_aggregates"("metric_type", "grain", "period_start");
