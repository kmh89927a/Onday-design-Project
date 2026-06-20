import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { getClientEnv, getServerEnv } from "./env";

// 환경변수 Zod 검증 단위 테스트 (#6).
//   ★ process.env 를 케이스별로 덮어쓰고, 누락/형식오류가 명확한 에러로 차단되는지 검증.

const ORIGINAL = { ...process.env };

beforeEach(() => {
  process.env = { ...ORIGINAL };
});

afterEach(() => {
  process.env = { ...ORIGINAL };
});

describe("getServerEnv", () => {
  it("정상 DATABASE_URL → 통과", () => {
    process.env.DATABASE_URL = "postgresql://postgres:pw@host:6543/postgres";
    delete process.env.DIRECT_URL;
    expect(getServerEnv().DATABASE_URL).toContain("postgresql://");
  });

  it("DATABASE_URL 누락 → 'Missing required env: DATABASE_URL'", () => {
    delete process.env.DATABASE_URL;
    expect(() => getServerEnv()).toThrow(/Missing required env: DATABASE_URL/);
  });

  it("DATABASE_URL 형식 오류(postgresql 아님) → 명확한 에러", () => {
    process.env.DATABASE_URL = "file:./dev.db";
    expect(() => getServerEnv()).toThrow(/DATABASE_URL.*PostgreSQL/);
  });

  it("DIRECT_URL 은 optional — 없어도 통과", () => {
    process.env.DATABASE_URL = "postgresql://postgres:pw@host:6543/postgres";
    delete process.env.DIRECT_URL;
    expect(() => getServerEnv()).not.toThrow();
  });

  it("DIRECT_URL 형식 오류(있을 때만) → 차단", () => {
    process.env.DATABASE_URL = "postgresql://postgres:pw@host:6543/postgres";
    process.env.DIRECT_URL = "mysql://nope";
    expect(() => getServerEnv()).toThrow(/DIRECT_URL.*PostgreSQL/);
  });
});

describe("getClientEnv", () => {
  it("정상 URL + publishable key → 통과", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://ref.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_abc";
    const env = getClientEnv();
    expect(env.NEXT_PUBLIC_SUPABASE_URL).toBe("https://ref.supabase.co");
    expect(env.NEXT_PUBLIC_SUPABASE_KEY).toBe("sb_publishable_abc");
  });

  it("publishable 없을 때 anon 으로 fallback", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://ref.supabase.co";
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "legacy_anon_key";
    expect(getClientEnv().NEXT_PUBLIC_SUPABASE_KEY).toBe("legacy_anon_key");
  });

  it("SUPABASE_URL 누락 → 'Missing required env' (Preview 500 사고 차단)", () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_abc";
    expect(() => getClientEnv()).toThrow(/Missing required env: NEXT_PUBLIC_SUPABASE_URL/);
  });

  it("key 누락(publishable·anon 둘 다 없음) → 차단", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://ref.supabase.co";
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    expect(() => getClientEnv()).toThrow(/Missing required env: NEXT_PUBLIC_SUPABASE_KEY/);
  });

  it("SUPABASE_URL 형식 오류(URL 아님) → 차단", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "not-a-url";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_abc";
    expect(() => getClientEnv()).toThrow(/NEXT_PUBLIC_SUPABASE_URL/);
  });
});
