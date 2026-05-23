// ──────────────────────────────────────────────
// CMD-DIAG-001 + CMD-DIAG-002 lib/diagnosis/ — 환경 중립 + Client Hook 통합 owner.
//
// ★ 책임 분리 6행 매트릭스 (★ 자가 치유 31번째 = CMD-DIAG-001 §3.1 4행 매트릭스의 `lib/external/diagnosis/` 가상 표기 stale 정정):
//   - 본 owner               = `lib/diagnosis/` (도메인 로직 + Client Hook, ★ CMD-DIAG-001 4 + CMD-DIAG-002 3 = 7 파일)
//   - 정적 데이터 owner       = `lib/data/` (NEW, ★ CMD-DIAG-002 신설 — metro-dong.json)
//   - 외부 모빌리티 owner     = `lib/external/kakao-transport/` (API-007, ★ KakaoCoord owner)
//   - UI 표시 측 owner        = `features/diagnosis/` (use-diagnosis.ts + mock-calculator.ts)
//   - Mock owner             = `lib/mocks/diagnosis/`, `lib/mocks/kakao-transport/`
//   - 페이지/API owner        = `app/diagnosis/`, `app/api/diagnosis/`
//
// ★ CMD-DIAG-001 §3.1 4행 매트릭스 → ★ 본 ISSUE 6행 매트릭스 정밀화 (★ Q2 (가) owner 영역 분리 § 정밀화 — `lib/external/diagnosis/` 실제 부재 정정).
// ★ lib/{도메인}/ 패턴 = MOCK 답습 아닌 ★ 신규 패턴 (Wave 3 진입 동시 도입, ★ owner 영역 분리 § NEW).
// ──────────────────────────────────────────────

export * from "./geocoding-types";
export * from "./geocoding";
export * from "./use-geocode";
export * from "./coverage";
export * from "./candidate-pool"; // ★ CMD-DIAG-002 신규
export * from "./intersection"; // ★ CMD-DIAG-002 신규
export * from "./use-intersection"; // ★ CMD-DIAG-002 신규
