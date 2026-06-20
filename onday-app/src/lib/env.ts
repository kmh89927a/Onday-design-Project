// 환경변수 런타임 검증 (#6) — `process.env.X!` non-null 단언이 누락 시 깊은 곳에서
// 모호하게 터지던 것을, 진입점에서 명확한 에러("Missing required env: X")로 조기 차단한다.
// (실증: Preview env 누락 → keys.ts undefined → createServerClient throw → 미들웨어 500.)
//
// ★ 서버 시크릿(getServerEnv)과 클라이언트 공개값(getClientEnv, NEXT_PUBLIC_*)을 분리한다.
//   - getServerEnv: DATABASE_URL 등 비-NEXT_PUBLIC 시크릿. 서버에서만 호출.
//   - getClientEnv: NEXT_PUBLIC_* 공개값. 클라이언트 번들에 inline 되어도 안전한 것만.
//
// 점진 교체(#6): 본 라운드는 핵심 두 곳(db.ts, supabase/keys.ts)만 배선한다.
// AI 키·카카오 키·믹스패널 등은 코드가 `?? ""` 로 부재를 우아하게 처리(선택값)하므로
// 강제 검증 대상에서 제외 — 추측으로 required 화하지 않는다.

import { z } from "zod";

// ── 공통 검증 조각 ──
const postgresUrl = z
  .string()
  .trim()
  .min(1, "is required")
  .refine(
    (v) => v.startsWith("postgresql://") || v.startsWith("postgres://"),
    "must be a PostgreSQL connection string (postgresql://…)",
  );

// ZodError 를 "Missing required env: X" / "X <문제>" 형태로 평탄화.
function formatIssues(error: z.ZodError): string {
  return error.issues
    .map((issue) => {
      const name = issue.path.join(".") || "env";
      return issue.message === "is required"
        ? `Missing required env: ${name}`
        : `${name} ${issue.message}`;
    })
    .join("; ");
}

// ── 서버 전용 (시크릿) ──
const serverEnvSchema = z.object({
  // 런타임 쿼리에 실제 사용(db.ts). 누락/형식오류면 즉시 차단.
  DATABASE_URL: postgresUrl,
  // 마이그레이션(CLI) 전용 — 런타임은 안 읽으므로 optional, 있을 때만 형식 검증.
  DIRECT_URL: postgresUrl.optional(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function getServerEnv(): ServerEnv {
  // 서버 시크릿 getter 가 클라이언트에서 호출되는 사고 방지(belt-and-suspenders —
  // DATABASE_URL 은 NEXT_PUBLIC_ 가 아니라 애초에 클라 번들에 inline 되지 않는다).
  if (typeof window !== "undefined") {
    throw new Error("getServerEnv() must not be called on the client");
  }

  const parsed = serverEnvSchema.safeParse({
    DATABASE_URL: process.env.DATABASE_URL ?? "",
    DIRECT_URL: process.env.DIRECT_URL?.trim() || undefined,
  });

  if (!parsed.success) {
    throw new Error(`Invalid server environment: ${formatIssues(parsed.error)}`);
  }
  return parsed.data;
}

// ── 클라이언트 공개값 (NEXT_PUBLIC_*) ──
// Supabase 클라이언트가 쓰는 공개 키. publishable(최신) ?? anon(레거시) fallback 보존.
const clientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .trim()
    .min(1, "is required")
    .pipe(z.url("must be a valid URL")),
  NEXT_PUBLIC_SUPABASE_KEY: z.string().trim().min(1, "is required"),
});

export type ClientEnv = z.infer<typeof clientEnvSchema>;

export function getClientEnv(): ClientEnv {
  const parsed = clientEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    NEXT_PUBLIC_SUPABASE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
      "",
  });

  if (!parsed.success) {
    throw new Error(`Invalid client environment: ${formatIssues(parsed.error)}`);
  }
  return parsed.data;
}
