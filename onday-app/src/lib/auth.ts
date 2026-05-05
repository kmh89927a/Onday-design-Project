import type { MockUser } from "./types";
import { MOCK_SESSION } from "@/mocks/users";

const IS_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

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
  if (!IS_MOCK) {
    // TODO: Supabase Auth integration
    return null;
  }
  const session = getMockSession();
  return session?.user ?? null;
}

export function isAuthenticated(): boolean {
  return getCurrentUser() !== null;
}
