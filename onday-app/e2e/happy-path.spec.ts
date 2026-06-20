import { expect, test, type Page } from "@playwright/test";

// OnDay Happy Path E2E — 커플 + 싱글 두 모드 + 단계별 스크린샷.
//   맞벌이(커플: 두 직장 동선 교집합) · 1인가구(싱글: 직장+여가거점)를 모두 커버함을 시각 증명.
//
// ★ DB 안전성: POST/GET /api/diagnosis 를 page.route 로 인터셉트해 fixture 로 응답한다.
//   요청이 서버에 닿지 않으므로 prisma.diagnosis.create 미실행 = 실 DB 쓰기 0(두 모드 동일 엔드포인트).
// ★ 결과 지도: webServer.env 의 NEXT_PUBLIC_KAKAO_MAP_KEY="" 로 SVG placeholder(격자+한강+
//   추천마커+직장핀+연결선)가 외부 의존 0 으로 렌더된다(playwright.config.ts 참고).
//
// 셀렉터는 role/text 기반(코드에 data-testid 0개).

// CandidateArea 의 결과 렌더 필드만 갖춘 fixture (TS 타입 아님 = JSON 응답).
//   커플: 두 직장 통근(commuteA/B). 싱글: 직장 통근(commuteA) — gu 로 야간 안전 등급, coordinate 로 지도.
const COUPLE_CANDIDATES = [
  { id: "c-1", dong: "공덕동", gu: "마포구", coordinate: { lat: 37.5446, lng: 126.9515 }, commuteA: { time: 18, mode: "transit" }, commuteB: { time: 27, mode: "transit" }, score: 92, priceRange: { min: 80000, max: 95000 }, facilities: { convenience: 12, cafes: 8 }, lines: "5호선 · 6호선 · 공항철도", listingsCount: 34, avgArea: 24 },
  { id: "c-2", dong: "신촌동", gu: "서대문구", coordinate: { lat: 37.5559, lng: 126.9368 }, commuteA: { time: 23, mode: "transit" }, commuteB: { time: 21, mode: "transit" }, score: 85, priceRange: { min: 72000, max: 88000 }, facilities: { convenience: 9, cafes: 11 }, lines: "2호선 · 경의중앙선", listingsCount: 28, avgArea: 22 },
  { id: "c-3", dong: "여의도동", gu: "영등포구", coordinate: { lat: 37.5215, lng: 126.9242 }, commuteA: { time: 29, mode: "transit" }, commuteB: { time: 19, mode: "transit" }, score: 78, priceRange: { min: 90000, max: 120000 }, facilities: { convenience: 14, cafes: 7 }, lines: "5호선 · 9호선", listingsCount: 41, avgArea: 28 },
];

// 싱글: 직장 1개 통근 + gu(야간 안전) + coordinate(지도). commuteB 없음(싱글=배우자 없음).
const SINGLE_CANDIDATES = [
  { id: "s-1", dong: "연남동", gu: "마포구", coordinate: { lat: 37.5631, lng: 126.9255 }, commuteA: { time: 21, mode: "transit" }, score: 90, priceRange: { min: 60000, max: 75000 }, facilities: { convenience: 10, cafes: 15 }, lines: "2호선 · 경의중앙선", listingsCount: 30, avgArea: 18 },
  { id: "s-2", dong: "성수동", gu: "성동구", coordinate: { lat: 37.5446, lng: 127.0561 }, commuteA: { time: 26, mode: "transit" }, score: 83, priceRange: { min: 70000, max: 90000 }, facilities: { convenience: 13, cafes: 12 }, lines: "2호선 · 분당선", listingsCount: 25, avgArea: 20 },
  { id: "s-3", dong: "역삼동", gu: "강남구", coordinate: { lat: 37.5006, lng: 127.0364 }, commuteA: { time: 31, mode: "transit" }, score: 75, priceRange: { min: 95000, max: 130000 }, facilities: { convenience: 16, cafes: 9 }, lines: "2호선 · 신분당선", listingsCount: 38, avgArea: 22 },
];

const FIXTURE_ID = "e2e-fixture-001";

type InterceptState = { postIntercepted: boolean; dbWriteAttempted: boolean };

// 공유 헬퍼 — 진단 생성/조회를 fixture 로 가로챈다(서버·DB 미접촉). body.mode 로 커플/싱글 후보 분기.
async function setupIntercept(page: Page): Promise<InterceptState> {
  const state: InterceptState = { postIntercepted: false, dbWriteAttempted: false };

  await page.route("**/api/diagnosis", async (route) => {
    if (route.request().method() === "POST") {
      state.postIntercepted = true;
      state.dbWriteAttempted = true; // 원래 서버였다면 prisma.create 가 일어났을 지점
      const body = (route.request().postDataJSON() ?? {}) as { mode?: string };
      const candidates = body.mode === "single" ? SINGLE_CANDIDATES : COUPLE_CANDIDATES;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ diagnosisId: FIXTURE_ID, candidates, timeline: null }),
      });
      return;
    }
    await route.continue();
  });

  // 새로고침 시 store 미스 → GET 재조회 대비(안전망). happy path 는 store 사용이라 보통 미사용.
  await page.route("**/api/diagnosis/*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: FIXTURE_ID, candidates: COUPLE_CANDIDATES, filters: {},
        mode: "couple", deadlineMode: false, status: "completed",
        createdAt: "2026-06-20T00:00:00.000Z",
      }),
    });
  });

  return state;
}

// 공유 헬퍼 — 랜딩 → 로그인(mock 원클릭) → /diagnosis. shots 지정 시 랜딩·로그인 스크린샷.
async function goLandingToDiagnosis(page: Page, shots?: string): Promise<void> {
  await page.goto("/landing");
  await expect(page).toHaveURL(/\/landing/);
  // framer-motion whileInView 섹션 reveal 트리거(로드 직후 opacity:0 회피).
  await page.evaluate(async () => {
    const step = window.innerHeight;
    for (let y = 0; y <= document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 150));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(500);
  if (shots) await page.screenshot({ path: `e2e/screenshots/${shots}_step_1_landing.png`, fullPage: true });

  await page.locator('a[href="/login"]').first().click();
  await page.waitForURL("**/login");
  if (shots) await page.screenshot({ path: `e2e/screenshots/${shots}_step_2_login.png`, fullPage: true });

  await page.getByRole("button", { name: "카카오로 1초 만에 시작" }).click();
  await page.waitForURL("**/diagnosis");
}

// 주소 입력 헬퍼 — 라벨로 input 잡고 타이핑 후 자동완성 제안(role=option) 클릭(verified).
async function fillAddress(page: Page, label: string | RegExp, query: string, optionName: RegExp): Promise<void> {
  const input = page.getByLabel(label);
  await input.click();
  await input.fill(query);
  await page.getByRole("option", { name: optionName }).first().click();
}

// 결과 지도(SVG placeholder) 가 마커/직장핀과 함께 렌더됐는지 대기·검증.
async function expectMapRendered(page: Page): Promise<void> {
  const map = page.locator('[aria-label="후보 동네 지도"]').first();
  await expect(map).toBeVisible();
  // SVG 직장핀(workplace "내 직장" = g[aria-label]) 가 지도 안에 그려졌는지 — 외부 SDK 없이 렌더 확인.
  await expect(map.locator('[aria-label="내 직장"]').first()).toBeVisible();
}

test.describe("OnDay Happy Path", () => {
  test("커플 모드 — 두 직장 동선 교집합 추천", async ({ page }) => {
    const state = await setupIntercept(page);

    // ①랜딩 ②로그인(공통, 커플 세트에 캡처)
    await goLandingToDiagnosis(page, "couple");

    // ③ 두 직장 주소 입력 (자동완성 선택 → verified)
    await fillAddress(page, "내 직장", "공덕", /공덕동/);
    await fillAddress(page, "배우자 직장", "역삼", /역삼동/);

    const submit = page.getByRole("button", { name: "진단 시작" });
    await expect(submit).toBeEnabled();
    await page.waitForTimeout(500); // 활성색 트랜지션 안정 후 캡처
    await page.screenshot({ path: "e2e/screenshots/couple_step_3_addresses.png", fullPage: true });

    // ④ 진단 → 추천 동네 결과 (후보 N개 + BEST + 지도)
    await submit.click();
    await page.waitForURL("**/diagnosis/result/**");
    await expect(page.getByText(/후보 \d+개 동네/)).toBeVisible();
    await expect(page.getByText("BEST").first()).toBeVisible();
    await expect(page.getByText("공덕동").first()).toBeVisible();
    await expectMapRendered(page);
    await page.screenshot({ path: "e2e/screenshots/couple_step_4_result.png", fullPage: true });

    expect(state.postIntercepted, "POST /api/diagnosis 인터셉트(서버 미접촉)").toBe(true);
  });

  test("싱글 모드 — 직장 + 여가거점 (배우자 입력 없음)", async ({ page }) => {
    const state = await setupIntercept(page);

    // ①②로그인(공통, 스크린샷은 커플 세트에 있으므로 생략)
    await goLandingToDiagnosis(page);

    // ③ 싱글 모드 토글 (★ 입력 전에 — 전환 시 필드가 바뀜: 배우자 입력 사라지고 여가거점 등장)
    await page.getByRole("radio", { name: /싱글 모드/ }).click();
    // 배우자 직장 입력이 없어야 함(커플과 명확히 다른 지점).
    await expect(page.getByLabel("배우자 직장")).toHaveCount(0);

    // ④ 내 직장만 입력해도 진단 가능(canSubmit=verifiedA). 여가거점 1 추가로 지도 거점 표시.
    await fillAddress(page, "내 직장", "성수", /성수동/);
    await fillAddress(page, /여가 거점 1/, "신촌", /신촌동/);
    await page.screenshot({ path: "e2e/screenshots/single_step_1_input.png", fullPage: true });

    const submit = page.getByRole("button", { name: "진단 시작" });
    await expect(submit).toBeEnabled();

    // ⑤ 진단 → 싱글 결과 (/single, "싱글 모드 결과" + 후보 + 지도)
    await submit.click();
    await page.waitForURL("**/single/**");
    // ★ heading 으로 한정 — getByText 는 Next 라우트 announcer("…— OnDay 온데이")와 strict 충돌.
    await expect(page.getByRole("heading", { name: "싱글 모드 결과" })).toBeVisible();
    await expect(page.locator('section[aria-label="후보 동네"]')).toBeVisible();
    await expectMapRendered(page);
    await page.screenshot({ path: "e2e/screenshots/single_step_2_result.png", fullPage: true });

    expect(state.postIntercepted, "싱글 POST 도 같은 인터셉트로 가로챔(DB 쓰기 0)").toBe(true);
  });
});
