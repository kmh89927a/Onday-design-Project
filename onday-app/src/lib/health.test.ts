import { afterEach, describe, expect, it, vi } from "vitest";

import { checkHealth, getDeploymentEnv, getDeploymentRegion } from "./health";

// /api/health DB ping 로직 단위 테스트 (#10).
//   ★ 가짜 $queryRaw 주입으로 실 DB 없이 ok/error 분기를 결정론적으로 검증한다.

const NOW = "2026-06-20T00:00:00.000Z";

describe("checkHealth", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("DB 연결 성공 → 200 + db:ok + status:ok + timestamp 보존", async () => {
    vi.spyOn(console, "info").mockImplementation(() => {});
    const db = { $queryRaw: async () => [{ value: 1 }] };

    const result = await checkHealth(db, NOW);

    expect(result.status).toBe(200);
    expect(result.body.db).toBe("ok");
    expect(result.body.status).toBe("ok");
    expect(result.body.timestamp).toBe(NOW);
  });

  it("DB 연결 실패 → 503 + db:error + status:error", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const db = {
      $queryRaw: async () => {
        throw new Error("P1001: Can't reach database server");
      },
    };

    const result = await checkHealth(db, NOW);

    expect(result.status).toBe(503);
    expect(result.body.db).toBe("error");
    expect(result.body.status).toBe("error");
  });

  it("★ 실패 로그에 connection string 미포함 (DB_SPEC §19)", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    // 에러 메시지에 실제 URL 이 섞여 들어온 상황을 가정.
    const secret = "postgresql://postgres:supersecret@aws-1.pooler.supabase.com:6543/postgres";
    const db = {
      $queryRaw: async () => {
        throw new Error(secret);
      },
    };

    await checkHealth(db, NOW);

    const logged = errorSpy.mock.calls.flat().join(" ");
    expect(logged).toContain("db_connect_fail");
    expect(logged).not.toContain("supersecret");
    expect(logged).not.toContain("postgresql://");
  });
});

describe("getDeploymentEnv / getDeploymentRegion", () => {
  const original = { ...process.env };

  afterEach(() => {
    process.env = { ...original };
  });

  it("VERCEL_ENV=preview → preview", () => {
    process.env.VERCEL_ENV = "preview";
    expect(getDeploymentEnv()).toBe("preview");
  });

  it("VERCEL_ENV=production → production", () => {
    process.env.VERCEL_ENV = "production";
    expect(getDeploymentEnv()).toBe("production");
  });

  it("VERCEL_REGION 없으면 local", () => {
    delete process.env.VERCEL_REGION;
    expect(getDeploymentRegion()).toBe("local");
  });

  it("VERCEL_REGION 있으면 그대로", () => {
    process.env.VERCEL_REGION = "icn1";
    expect(getDeploymentRegion()).toBe("icn1");
  });
});
