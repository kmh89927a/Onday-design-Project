# SQLite → Supabase PostgreSQL 마이그레이션 가이드

## 1. 왜 MVP는 SQLite인가?

분석 보고서에서는 Supabase PostgreSQL을 기본으로 명시했으나, MVP 빌드에서 SQLite로 변경한 이유:

| 기준 | Supabase PostgreSQL | SQLite |
|------|--------------------|---------|
| 로컬 개발 | 네트워크 필요, Supabase 프로젝트 생성 필수 | 파일 1개, 즉시 시작 |
| Mock 호환성 | RLS/트리거 설정 필요 | 불필요 |
| 빌드 속도 | DB 연결 대기 | 즉시 |
| 비용 | 무료 티어 제한 (500MB, 월 제한) | 무료 |
| 오프라인 | 불가 | 가능 |
| CI 테스트 | DB 인스턴스 필요 | 파일만 있으면 OK |

**결론**: 로컬 개발과 Mock 데모 빌드에서는 SQLite가 압도적으로 유리. Vercel 배포 시 PostgreSQL로 전환.

## 2. SQLite + Mock 모드의 한계

| 한계 | 영향 | 대응 |
|------|------|------|
| **RLS 없음** | Row Level Security 미적용, 모든 데이터 접근 가능 | Mock에서는 단일 사용자이므로 무관. Prod에서 RLS 필수 |
| **단일 사용자** | 동시 쓰기 잠금 (WAL 모드에서도 제한적) | Mock에서는 단일 사용자이므로 무관 |
| **JSONB 미지원** | SQLite는 JSON 함수 지원하나 JSONB 타입 없음 | Prisma가 `String`으로 매핑, JSON.parse/stringify 처리 |
| **UUID 네이티브 미지원** | `gen_random_uuid()` 불가 | Prisma `@default(uuid())` 또는 앱에서 `crypto.randomUUID()` |
| **ENUM 미지원** | PostgreSQL ENUM 사용 불가 | Prisma `@map` + String 타입으로 대체 |
| **날짜 함수 차이** | `NOW()`, `INTERVAL` 구문 다름 | Prisma 레벨에서 `new Date()` 사용 |

## 3. 마이그레이션 절차 (Vercel 배포 시)

### 3-1. Supabase 프로젝트 생성
```bash
# Supabase 대시보드에서 프로젝트 생성
# Settings > Database > Connection string 복사
```

### 3-2. 환경 변수 변경
```env
# .env.production
DATABASE_PROVIDER=postgresql
DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres

NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT_ID].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[ANON_KEY]
SUPABASE_SERVICE_ROLE_KEY=[SERVICE_ROLE_KEY]
```

### 3-3. Prisma 스키마 조정
```prisma
// prisma/schema.prisma
datasource db {
  provider = env("DATABASE_PROVIDER")  // "sqlite" | "postgresql"
  url      = env("DATABASE_URL")
}
```

SQLite 전용 워크어라운드 제거:
- `String` → `Json` (JSONB 필드)
- String enum → PostgreSQL native `enum`
- `@default(uuid())` 유지 (PostgreSQL에서는 `gen_random_uuid()` 자동 매핑)

### 3-4. 마이그레이션 실행
```bash
# 기존 SQLite 마이그레이션 초기화
npx prisma migrate reset

# PostgreSQL용 마이그레이션 생성
npx prisma migrate dev --name init_postgresql

# RLS 정책 적용 (수동)
psql $DATABASE_URL -f prisma/migrations/manual/001_rls_policies.sql
```

### 3-5. RLS 정책 적용
```sql
-- prisma/migrations/manual/001_rls_policies.sql

-- USER 테이블: 본인 데이터만 조회/수정
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own data" ON "User"
  FOR SELECT USING (auth.uid()::text = id);
CREATE POLICY "Users can update own data" ON "User"
  FOR UPDATE USING (auth.uid()::text = id);

-- DIAGNOSIS 테이블: 본인 진단만 조회
ALTER TABLE "Diagnosis" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own diagnoses" ON "Diagnosis"
  FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Users can insert own diagnoses" ON "Diagnosis"
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- SHARE_LINK 테이블: 공유 링크는 누구나 읽기 가능
ALTER TABLE "ShareLink" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view share links" ON "ShareLink"
  FOR SELECT USING (true);
CREATE POLICY "Users can create share links" ON "ShareLink"
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM "Diagnosis" WHERE id = diagnosis_id AND user_id = auth.uid()::text)
  );

-- SAVED_SEARCH 테이블: 본인만 접근
ALTER TABLE "SavedSearch" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own saved searches" ON "SavedSearch"
  USING (auth.uid()::text = user_id);
```

### 3-6. Vercel 배포 설정
```bash
# Vercel 환경 변수 설정
vercel env add DATABASE_PROVIDER production  # "postgresql"
vercel env add DATABASE_URL production       # Supabase connection string
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production

# 배포
vercel --prod
```

### 3-7. 검증 체크리스트
- [ ] Prisma migrate 성공
- [ ] RLS 정책 적용 확인 (`supabase inspect db policies`)
- [ ] 로그인 → 진단 → 공유 E2E 통과
- [ ] 다른 유저 데이터 접근 차단 확인
- [ ] JSONB 필드 정상 읽기/쓰기
- [ ] UUID 생성 정상
