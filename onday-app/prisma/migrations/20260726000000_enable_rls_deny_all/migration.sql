-- Supabase "rls_disabled_in_public" 보안 경고 대응 — public 스키마 11개 테이블 전부
-- deny-all 로 잠근다. PostgREST 자동 API(rest/v1/*) + 공개 anon key 로 외부인이 전 행을
-- 읽을 수 있는 노출 경로를 차단한다.
--
-- ★ 정책(CREATE POLICY) 없음 = 의도적 deny-all. 앱은 Prisma 직결(DATABASE_URL = postgres 롤,
--   테이블 owner + BYPASSRLS)로만 데이터를 읽/쓰므로 RLS 를 우회한다 → 진단·측정 등 기존 기능
--   회귀 0. anon/authenticated(PostgREST)만 0행이 된다.
-- ★ 벨트+멜빵: RLS 활성화에 더해 anon/authenticated 의 테이블 권한도 REVOKE(권한 자체 회수).
--
-- 참고: RLS 활성화는 롤 존재와 무관하므로 무조건 실행. REVOKE 만 롤 존재를 가드한다
--   (로컬 검토·shadow DB 등 anon/authenticated 롤이 없는 환경에서도 안전하게).

-- ── 1) RLS 활성화 (11개 전부) ──────────────────────────────────────────────
ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."diagnoses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."share_links" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."saved_searches" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."error_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."event_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."preview_event_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."metric_rollups" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."preview_metric_rollups" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."metric_aggregates" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."preview_metric_aggregates" ENABLE ROW LEVEL SECURITY;

-- ── 2) anon 롤 권한 회수 (롤 존재 시에만) ──────────────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON "public"."users" FROM anon;
    REVOKE ALL ON "public"."diagnoses" FROM anon;
    REVOKE ALL ON "public"."share_links" FROM anon;
    REVOKE ALL ON "public"."saved_searches" FROM anon;
    REVOKE ALL ON "public"."error_logs" FROM anon;
    REVOKE ALL ON "public"."event_logs" FROM anon;
    REVOKE ALL ON "public"."preview_event_logs" FROM anon;
    REVOKE ALL ON "public"."metric_rollups" FROM anon;
    REVOKE ALL ON "public"."preview_metric_rollups" FROM anon;
    REVOKE ALL ON "public"."metric_aggregates" FROM anon;
    REVOKE ALL ON "public"."preview_metric_aggregates" FROM anon;
  END IF;
END $$;

-- ── 3) authenticated 롤 권한 회수 (롤 존재 시에만) ─────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON "public"."users" FROM authenticated;
    REVOKE ALL ON "public"."diagnoses" FROM authenticated;
    REVOKE ALL ON "public"."share_links" FROM authenticated;
    REVOKE ALL ON "public"."saved_searches" FROM authenticated;
    REVOKE ALL ON "public"."error_logs" FROM authenticated;
    REVOKE ALL ON "public"."event_logs" FROM authenticated;
    REVOKE ALL ON "public"."preview_event_logs" FROM authenticated;
    REVOKE ALL ON "public"."metric_rollups" FROM authenticated;
    REVOKE ALL ON "public"."preview_metric_rollups" FROM authenticated;
    REVOKE ALL ON "public"."metric_aggregates" FROM authenticated;
    REVOKE ALL ON "public"."preview_metric_aggregates" FROM authenticated;
  END IF;
END $$;
