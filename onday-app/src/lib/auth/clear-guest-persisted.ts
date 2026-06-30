import {
  DIAGNOSIS_PERSIST_KEY,
  LAST_CONFIG_KEY,
  useDiagnosisStore,
} from "@/stores/diagnosis-store";
import { FAVORITES_PERSIST_KEY, useFavoritesStore } from "@/stores/favorites";

// 게스트/심사관 진입·로그아웃 시 — 로그인 사용자만 남기는 localStorage 흔적을 전부 제거.
//   입력좌표(#216) · 이전조건(직장 주소) · 찜 — 이전 로그인 사용자 데이터 물려받기/잔존 방지.
//   (persist storage 게이팅은 '쓰기'만 막으므로, 기존 blob 제거는 진입·로그아웃에서 전담.)
export function clearGuestPersisted(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(DIAGNOSIS_PERSIST_KEY);
  localStorage.removeItem(LAST_CONFIG_KEY);
  localStorage.removeItem(FAVORITES_PERSIST_KEY);
  // ★ in-memory 찜도 비움 — 이전 로그인 사용자의 찜이 reload 전까지 화면에 남는 것 방지.
  //   clear() 의 persist 쓰기는 비로그인이라 storage 게이팅에서 skip → localStorage 잔존 0.
  useFavoritesStore.getState().clear();
  // ★ in-memory 진단 입력(주소·좌표 등)도 비움 — 카카오 로그인 중 입력한 주소가
  //   게스트/심사관 진입·로그아웃 후 client 내비게이션(풀 리로드 아님)에서 잔존하는 것 방지.
  //   reset() 의 persist 쓰기도 비로그인이라 게이팅에서 skip → localStorage 잔존 0(프라이버시 유지).
  useDiagnosisStore.getState().reset();
}
