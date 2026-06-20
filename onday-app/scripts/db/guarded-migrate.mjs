// 마이그레이션 가드레일 (#8 — DB_SPEC §11 을 OnDay 구조에 적응).
//
// 파괴적 마이그레이션(`migrate dev` / `migrate reset`)이 비-로컬(클라우드/운영) DB 를
// 향하면 거부한다. 1인 개발 — 실수로 공유 Supabase 에 dev/reset 을 치는 사고를 막는다
// (막아줄 사람 = 본인). `migrate deploy`(적용만)는 운영 대상이라도 정상 허용한다.
//
// ★ OnDay 적응 (스펙 복붙 아님):
//   1) 대상 호스트는 prisma.config.ts 와 동일하게 `DIRECT_URL ?? DATABASE_URL` 로 판정한다.
//      CLI 마이그레이션은 direct connection(5432)을 쓰므로 DIRECT_URL 이 진짜 대상이다.
//      (DB_SPEC 원본은 DATABASE_URL 만 보지만, OnDay 는 DIRECT_URL 우선 구조다.)
//   2) env 는 prisma.config.ts 와 동일하게 dotenv 로 `.env.local` → `.env` 순 로드한다.
//      Prisma CLI 는 prisma.config.ts 존재 시 .env 를 자동 로드하지 않으므로 가드가 로드한다.
//      dotenv 는 이미 설정된 키를 덮어쓰지 않아(.env.local 우선 + 셸/배포 env 최우선),
//      운영 deploy 시 셸에서 넘긴 DATABASE_URL/DIRECT_URL 이 그대로 유지된다.
//   3) OnDay 는 로컬 Supabase(127.0.0.1)가 없어 dev 마이그레이션도 클라우드 대상이다.
//      따라서 dev/reset 은 `ALLOW_NONLOCAL_MIGRATE=1` 로 의도를 확인해야 통과한다
//      (= 공유 클라우드 DB 보호. 이 마찰이 가드의 목적이다).
//
// 사용:
//   node scripts/db/guarded-migrate.mjs dev --name <verb>_<target>
//   node scripts/db/guarded-migrate.mjs reset
//   node scripts/db/guarded-migrate.mjs deploy            # 운영 적용 — 항상 허용
//   ALLOW_NONLOCAL_MIGRATE=1 node ... dev                 # 비-로컬 dev/reset 의도 확인 후 통과
//   GUARD_DRY_RUN=1 node ...                              # prisma 실행 없이 판정만 출력(테스트/CI)

import { spawnSync } from "node:child_process";

import dotenv from "dotenv";

// prisma.config.ts 와 동일한 로드 순서·의미. quiet 로 dotenv 17 의 팁 로그를 억제.
dotenv.config({ path: [".env.local", ".env"], quiet: true });

const args = process.argv.slice(2);
const sub = args[0]; // dev | reset | deploy | status | ...

const DESTRUCTIVE = new Set(["dev", "reset"]);
const LOCAL_HOSTS = new Set(["127.0.0.1", "localhost", "::1", ""]);

if (DESTRUCTIVE.has(sub)) {
  // prisma.config.ts 정합: CLI 마이그레이션 대상 = DIRECT_URL ?? DATABASE_URL.
  const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

  if (!url) {
    console.error(
      `[guard] 거부: DIRECT_URL/DATABASE_URL 미설정 — 'migrate ${sub}' 대상 DB 를 판정할 수 없습니다.`,
    );
    process.exit(1);
  }

  let host;
  try {
    host = new URL(url).hostname;
  } catch {
    console.error(
      `[guard] 거부: DIRECT_URL/DATABASE_URL 형식 오류 — 호스트를 파싱할 수 없습니다.`,
    );
    process.exit(1);
  }

  const overridden = process.env.ALLOW_NONLOCAL_MIGRATE === "1";

  if (!LOCAL_HOSTS.has(host) && !overridden) {
    console.error(
      [
        `[guard] 거부: 비-로컬 호스트(${host})에 대한 'migrate ${sub}' 는 데이터 파괴 위험이 있습니다.`,
        `        · 운영/공유 DB 에 적용만 하려면: npm run db:migrate:deploy   (migrate deploy)`,
        `        · 의도적이라면(OnDay 는 로컬 DB 가 없어 dev 도 클라우드 대상):`,
        `          ALLOW_NONLOCAL_MIGRATE=1 npm run db:migrate:dev -- --name <verb>_<target>`,
      ].join("\n"),
    );
    process.exit(1);
  }
}

// 여기 도달 = 허용. dry-run 이면 prisma 실행 없이 판정만 보고(테스트/CI 안전).
if (process.env.GUARD_DRY_RUN === "1") {
  console.log(`[guard] OK (dry-run) — would run: prisma migrate ${args.join(" ")}`);
  process.exit(0);
}

const result = spawnSync("npx", ["prisma", "migrate", ...args], {
  stdio: "inherit",
  env: process.env,
  shell: process.platform === "win32",
});

process.exit(result.status ?? 1);
