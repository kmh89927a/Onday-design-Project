import { expect, test } from "@playwright/test";

// OnDay 핵심 Happy Path(부부 모드) E2E + 단계별 스크린샷.
//   랜딩 → 로그인(mock 원클릭) → 두 직장 주소 입력(자동완성 선택) → 진단 시작 → 추천 동네 결과.
//
// ★ DB 안전성: /api/diagnosis(POST)·/api/diagnosis/*(GET)를 page.route 로 인터셉트해
//   fixture 로 응답한다. 요청이 서버에 닿지 않으므로 prisma.diagnosis.create 가 호출되지 않음
//   = 실 클라우드 diagnoses 테이블에 테스트 row 가 쌓이지 않는다. (mock 모드도 저장하므로 필수.)
//
// 셀렉터는 role/text 기반(코드에 data-testid 0개). 자동완성은 비동기(debounce 300ms)라
// getByRole('option') 의 auto-wait 로 안정화한다.

// 결과 페이지가 렌더에 사용하는 CandidateArea 런타임 필드만 갖춘 fixture (TS 타입 아님 = JSON 응답).
const FIXTURE_CANDIDATES = [
  {
    id: "cand-1",
    dong: "공덕동",
    gu: "마포구",
    coordinate: { lat: 37.5446, lng: 126.9515 },
    commuteA: { time: 18, mode: "transit" },
    commuteB: { time: 27, mode: "transit" },
    score: 92,
    priceRange: { min: 80000, max: 95000 },
    facilities: { convenience: 12, cafes: 8 },
    lines: "5호선 · 6호선 · 공항철도",
    listingsCount: 34,
    avgArea: 24,
  },
  {
    id: "cand-2",
    dong: "신촌동",
    gu: "서대문구",
    coordinate: { lat: 37.5559, lng: 126.9368 },
    commuteA: { time: 23, mode: "transit" },
    commuteB: { time: 21, mode: "transit" },
    score: 85,
    priceRange: { min: 72000, max: 88000 },
    facilities: { convenience: 9, cafes: 11 },
    lines: "2호선 · 경의중앙선",
    listingsCount: 28,
    avgArea: 22,
  },
  {
    id: "cand-3",
    dong: "여의도동",
    gu: "영등포구",
    coordinate: { lat: 37.5215, lng: 126.9242 },
    commuteA: { time: 29, mode: "transit" },
    commuteB: { time: 19, mode: "transit" },
    score: 78,
    priceRange: { min: 90000, max: 120000 },
    facilities: { convenience: 14, cafes: 7 },
    lines: "5호선 · 9호선",
    listingsCount: 41,
    avgArea: 28,
  },
];

const FIXTURE_DIAGNOSIS_ID = "e2e-fixture-001";

test("부부 모드 Happy Path — 랜딩→로그인→주소 입력→진단→추천 결과", async ({
  page,
}) => {
  let postIntercepted = false;
  let dbWriteAttempted = false;

  // ── 라우트 인터셉트: 진단 생성/조회를 fixture 로 응답 (서버·DB 미접촉) ──
  await page.route("**/api/diagnosis", async (route) => {
    if (route.request().method() === "POST") {
      postIntercepted = true;
      dbWriteAttempted = true; // POST = 원래 서버였다면 prisma.create 가 일어났을 지점
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          diagnosisId: FIXTURE_DIAGNOSIS_ID,
          candidates: FIXTURE_CANDIDATES,
          timeline: null,
        }),
      });
      return;
    }
    await route.continue();
  });

  // 결과 페이지가 store 미스 시 GET 으로 재조회할 수 있어 함께 인터셉트(안전망).
  await page.route("**/api/diagnosis/*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: FIXTURE_DIAGNOSIS_ID,
        candidates: FIXTURE_CANDIDATES,
        filters: {},
        mode: "couple",
        deadlineMode: false,
        status: "completed",
        createdAt: "2026-06-20T00:00:00.000Z",
      }),
    });
  });

  // ── ① 랜딩 (서비스 가치 노출) ──
  await page.goto("/landing");
  await expect(page).toHaveURL(/\/landing/);
  await page.screenshot({ path: "e2e/screenshots/step_1_landing.png", fullPage: true });

  // ── ② 로그인 (mock 원클릭) ──
  await page.locator('a[href="/login"]').first().click();
  await page.waitForURL("**/login");
  await page.screenshot({ path: "e2e/screenshots/step_2_login.png", fullPage: true });

  await page.getByRole("button", { name: "카카오로 1초 만에 시작" }).click();
  await page.waitForURL("**/diagnosis");

  // ── ③ 두 직장 주소 입력 (자동완성 선택 → verified) ──
  const inputA = page.getByLabel("내 직장");
  await inputA.click();
  await inputA.fill("공덕");
  await page.getByRole("option", { name: /공덕동/ }).first().click();

  const inputB = page.getByLabel("배우자 직장");
  await inputB.click();
  await inputB.fill("역삼");
  await page.getByRole("option", { name: /역삼동/ }).first().click();

  await page.screenshot({ path: "e2e/screenshots/step_3_addresses.png", fullPage: true });

  // ── ④ 진단 시작 (버튼 활성 확인) ──
  const submit = page.getByRole("button", { name: "진단 시작" });
  await expect(submit).toBeEnabled();
  await page.screenshot({ path: "e2e/screenshots/step_4_ready.png", fullPage: true });
  await submit.click();

  // ── ⑤ 추천 동네 결과 (후보 N개 + BEST 뱃지) ──
  await page.waitForURL("**/diagnosis/result/**");
  await expect(page.getByText(/후보 \d+개 동네/)).toBeVisible();
  await expect(page.getByText("BEST").first()).toBeVisible();
  await expect(page.getByText("공덕동").first()).toBeVisible();
  await page.screenshot({ path: "e2e/screenshots/step_5_result.png", fullPage: true });

  // ── ★ DB 안전성 단언: 진단 생성이 인터셉트됨 = 서버/prisma.create 미실행 ──
  expect(postIntercepted, "POST /api/diagnosis 가 인터셉트되어야 함(서버 미접촉)").toBe(true);
  expect(dbWriteAttempted, "원래 DB 쓰기 지점이 fixture 로 대체됨").toBe(true);
});
