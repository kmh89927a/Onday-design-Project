import type { MockUser } from "./types";
import { MOCK_SESSION } from "@/mocks/users";
import { IS_MOCK_AUTH } from "@/lib/auth/flags";

// NOTE: 클라이언트 세션의 실 소스는 Zustand(useSessionStore) + SessionBridge 다.
// 본 모듈(getCurrentUser 등)은 현재 앱 내 호출처 0건인 레거시 스캐폴딩 — W1-2 에선
// 플래그명만 IS_MOCK_AUTH 로 정합(진단 USE_MOCK 과 분리). 실 세션 읽기는 lib/auth/session.ts.

const SESSION_KEY = "onday_session";

export function getMockSession(): typeof MOCK_SESSION | null {
  if (typeof window === "undefined") return MOCK_SESSION; // SSR: always authenticated
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setMockSession(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SESSION_KEY, JSON.stringify(MOCK_SESSION));
}

export function clearMockSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_KEY);
}

export function getCurrentUser(): MockUser | null {
  if (!IS_MOCK_AUTH) {
    // 실 auth: 클라이언트는 useSessionStore, 서버는 lib/auth/session.ts 를 사용.
    return null;
  }
  const session = getMockSession();
  return session?.user ?? null;
}

export function isAuthenticated(): boolean {
  return getCurrentUser() !== null;
}
