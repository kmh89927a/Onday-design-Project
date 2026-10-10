# [security] Supabase 기본 ACL 때문에 새 테이블마다 RLS 경고 재발 — ALTER DEFAULT PRIVILEGES 검토

> 상태: 초안 (이슈 미등록). PR fix/rls-prisma-migrations 범위 밖 후속.

## 배경

- #280 (11개 테이블) + `_prisma_migrations` (fix/rls-prisma-migrations) 로 Security Advisor
  `rls_disabled_in_public` 경고는 현재 0건.
- 그러나 두 건 모두 **같은 근본 원인**에서 나왔다. 라이브 실측(2026-10-10) `pg_default_acl`:

  | 생성 롤 | 객체 | 자동 부여 대상 | 권한 |
  | --- | --- | --- | --- |
  | postgres | 테이블 | anon, authenticated, service_role | ALL (arwdDxtm) |
  | postgres | 시퀀스 | anon, authenticated, service_role | rwU |
  | postgres | 함수 | anon, authenticated, service_role | X |

- Prisma 는 `postgres` 롤로 DDL 을 실행하므로, **앞으로 `migrate dev` 로 테이블을 추가할 때마다**
  anon/authenticated 에 풀권한이 자동 부여되고 RLS 는 꺼진 상태로 생성된다 → 경고 재발 +
  마이그레이션 적용과 Advisor 확인 사이에 실 노출 창이 생긴다.

## 선택지

1. **(현행) 테이블 추가 마이그레이션마다 ENABLE RLS + REVOKE 를 같은 migration.sql 에 수동 동봉**
   - 장점: 변경 0, #280 패턴 재사용. 단점: 사람이 잊으면 재발 (이미 1회 누락 사례 = `_prisma_migrations`).
2. **기본 ACL 자체를 바꾸기 (근본 해결)** — 별도 마이그레이션 1건:
   ```sql
   ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
     REVOKE ALL ON TABLES FROM anon, authenticated;
   ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
     REVOKE ALL ON SEQUENCES FROM anon, authenticated;
   ```
   - 이후 새 테이블은 anon/authenticated 권한 없이 생성된다 (RLS 플래그는 여전히 off 라
     Advisor 경고는 뜰 수 있으나 **실 노출은 없음**). RLS 플래그까지 자동화하려면 1번 병행.
   - 검토 필요: Supabase 가 `supabase_admin` 쪽 기본 ACL 도 두고 있어(위 표 외 3행) 대시보드
     Table Editor 로 만든 테이블은 영향 밖. OnDay 는 Prisma 전용이므로 postgres 롤만 바꿔도 충분.
   - 위험: PostgREST 를 의도적으로 쓸 미래 테이블이 생기면 명시적 GRANT 가 필요해진다.
     현재 OnDay 는 PostgREST 미사용(Prisma 직결)이라 영향 0.
   - `ALTER DEFAULT PRIVILEGES` 는 shadow DB 에서도 무해(롤 존재 가드 필요 — #280 패턴).

## 제안

2번 + 1번 병행. 2번은 1회성 마이그레이션, 1번은 `docs/` 또는 `AGENTS.md` 에 "새 테이블 체크리스트"
한 줄 추가로 고정.

## 검증 방법

1. 마이그레이션 적용 후 `pg_default_acl` 에서 anon/authenticated 제거 확인.
2. 임시 테이블 `create table public._acl_probe(id int)` → `information_schema.role_table_grants` 에
   anon/authenticated 없음 확인 → drop.
3. `prisma migrate status` 정상.

## 관련

- PR #280 (11개 테이블 deny-all), PR fix/rls-prisma-migrations (`_prisma_migrations`)
- 메모리: Supabase 롤 실측 — postgres=BYPASSRLS+owner, service_role=BYPASSRLS
