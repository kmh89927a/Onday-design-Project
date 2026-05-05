import type { MockUser } from "@/lib/types";

export const MOCK_USER: MockUser = {
  id: "mock-user-001",
  email: "test@onday.kr",
  authProvider: "kakao",
  mode: "couple",
};

export const MOCK_SESSION = {
  user: MOCK_USER,
  accessToken: "mock-access-token-xxxx",
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
};
