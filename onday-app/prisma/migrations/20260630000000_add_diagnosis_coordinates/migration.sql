-- AlterTable: 입력 직장 좌표(JSON {lat,lng}) 보존 — 새로고침 시 경로선 서버 복원용.
--   nullable + DEFAULT 없음 → 기존 row 는 NULL(기존 동작 유지), additive 안전 마이그레이션.
ALTER TABLE "diagnoses" ADD COLUMN "coordinate_a" TEXT;
ALTER TABLE "diagnoses" ADD COLUMN "coordinate_b" TEXT;
