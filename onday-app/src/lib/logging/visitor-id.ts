// 익명 방문자 ID (11주차 로깅 토대).
// ★ 개인 식별 아님 — 기기/브라우저 단위 익명 랜덤. 재방문(같은 기기 재접속) 분석용.
//   이름·이메일·계정과 무관. localStorage 30일 만료(생성 시각 비교, 초과 시 재발급).
// ★ best-effort — 시크릿 모드·차단으로 localStorage 접근 실패 시 null 반환(앱 안 깸).

const KEY = "onday_visitor";
const TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30일

interface StoredVisitor {
  id: string;
  createdAt: number;
}

function randomId(): string {
  try {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  } catch {
    // crypto 미지원 — 아래 폴백
  }
  return `v_${Date.now().toString(36)}_${Math.floor(Math.random() * 1e9).toString(36)}`;
}

/** 익명 방문자 ID get-or-create. localStorage 불가 시 null(앱 안 깸). */
export function getVisitorId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as StoredVisitor;
      if (parsed?.id && typeof parsed.createdAt === "number" && Date.now() - parsed.createdAt < TTL_MS) {
        return parsed.id;
      }
      // 만료 → 재발급
    }
    const fresh: StoredVisitor = { id: randomId(), createdAt: Date.now() };
    window.localStorage.setItem(KEY, JSON.stringify(fresh));
    return fresh.id;
  } catch {
    // localStorage 접근 실패(시크릿/차단) — ID 없이 진행
    return null;
  }
}
