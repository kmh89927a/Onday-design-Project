// /api/health DB 연결 검증 로직 — route 에서 분리해 단위 테스트 가능하게.
// DB_SPEC §13 checkHealth 패턴을 OnDay 구조(Prisma 7 어댑터, Vercel 시스템 변수)에 적응.
// ★ 보안(DB_SPEC §19): 구조화 로그에 connection string 절대 미포함 — 이벤트명 + env/region 메타만.

export type DeploymentEnv = "development" | "preview" | "production";

export type HealthResponseBody = {
  // status/timestamp 는 기존 Uptime 핑(MON-001 #73) 응답 계약 유지용 (추가 필드만 신설).
  status: "ok" | "error";
  db: "ok" | "error";
  env: DeploymentEnv;
  region: string;
  timestamp: string;
};

export type HealthResult = {
  status: number;
  body: HealthResponseBody;
};

// $queryRaw 태그드 템플릿만 의존 — 테스트에서 가짜 객체를 주입할 수 있다 (실 prisma 불필요).
export type HealthDatabase = {
  $queryRaw: (query: TemplateStringsArray, ...values: unknown[]) => Promise<unknown>;
};

export function getDeploymentEnv(): DeploymentEnv {
  if (process.env.VERCEL_ENV === "production" || process.env.VERCEL_ENV === "preview") {
    return process.env.VERCEL_ENV;
  }
  return process.env.NODE_ENV === "production" ? "production" : "development";
}

export function getDeploymentRegion(): string {
  return process.env.VERCEL_REGION?.trim() || "local";
}

export async function checkHealth(
  database: HealthDatabase,
  timestamp: string,
): Promise<HealthResult> {
  const env = getDeploymentEnv();
  const region = getDeploymentRegion();

  try {
    await database.$queryRaw`SELECT 1`;
    console.info(JSON.stringify({ event: "db_connect_ok", env, region }));
    return { status: 200, body: { status: "ok", db: "ok", env, region, timestamp } };
  } catch {
    // 에러 객체에 URL 이 섞일 수 있으므로 메시지를 로그에 싣지 않는다 (DB_SPEC §19).
    console.error(JSON.stringify({ event: "db_connect_fail", env, region, reason: "db_unavailable" }));
    return { status: 503, body: { status: "error", db: "error", env, region, timestamp } };
  }
}
