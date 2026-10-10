-- Supabase Security Advisor "rls_disabled_in_public" 잔여 1건 — `_prisma_migrations` 대응.
-- #280(20260726000000_enable_rls_deny_all)은 schema.prisma 모델 11개만 잠갔고, Prisma 가
-- 자동 생성하는 이 이력 테이블은 누락됐다. 실측(2026-10-10): 공개 anon key 로
-- rest/v1/_prisma_migrations GET → HTTP 200, anon/authenticated 에 INSERT/DELETE 권한까지
-- 있어 외부인이 이력 행을 지우면 다음 migrate deploy 가 깨질 수 있다 → #280 동일 패턴으로 deny-all.
--
-- ★ Prisma 영향 0: CLI(DIRECT_URL)·런타임(DATABASE_URL) 모두 `postgres` 롤 = 테이블 owner +
--   rolbypassrls=true 이므로 RLS 를 우회한다. 정책(CREATE POLICY) 없음 = 의도적 deny-all.
-- ★ 가드: 테이블은 IF EXISTS(shadow DB 등 생성 순서 차이 대비), REVOKE 는 롤 존재 시에만.

ALTER TABLE IF EXISTS "public"."_prisma_migrations" ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON "public"."_prisma_migrations" FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON "public"."_prisma_migrations" FROM authenticated;
  END IF;
END $$;
