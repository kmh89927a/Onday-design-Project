// client/server 양쪽에서 안전하게 읽는 auth 토글 (next/headers 등 서버 전용 import 없음).
// ★ R1 — auth 도메인 전용 mock 토글. 미설정 시 NEXT_PUBLIC_USE_MOCK 로 fallback →
// 기존 mock 배포 동작 보존. auth 만 실 전환하려면 NEXT_PUBLIC_USE_MOCK_AUTH=false.
// NEXT_PUBLIC_ 접두사라 빌드 시 클라이언트 번들에 inline 된다.
export const IS_MOCK_AUTH =
  (process.env.NEXT_PUBLIC_USE_MOCK_AUTH ?? process.env.NEXT_PUBLIC_USE_MOCK) ===
  "true";
