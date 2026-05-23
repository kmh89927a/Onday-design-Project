// ──────────────────────────────────────────────
// CMD-DIAG-001 lib/diagnosis/ — 환경 중립 + Client Hook 통합 owner.
//
// ★ 책임 분리 4행 매트릭스 (★ 자가 치유 26번째 = AGENTS.md L82 stale 자가 치유 사전 박힘):
//   - 본 owner               = 도메인 로직 + Client Hook (환경 중립 통합)
//   - 외부 API 클라이언트 owner = `lib/external/diagnosis/` (Server-only)
//   - UI 표시 측 owner        = `features/diagnosis/`
//   - 모빌리티 클라이언트 owner = `lib/external/kakao-transport/`
//
// ★ lib/{도메인}/ 패턴 = MOCK 답습 아닌 ★ 신규 패턴 (Wave 3 진입 동시 도입, ★ owner 영역 분리 § NEW).
// ──────────────────────────────────────────────

export * from "./geocoding-types";
export * from "./geocoding";
export * from "./use-geocode";
export * from "./coverage";
