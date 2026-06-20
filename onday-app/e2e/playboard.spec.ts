import { expect, test, type Page } from "@playwright/test";

// Playboard 보강 캡처 — happy-path.spec.ts 가 못 담은 화면(후보 상세 시트, 이사 데드라인).
//   기존 happy-path 스펙/스크린샷은 건드리지 않고 playboard_*.png 로 추가만 한다.
//
// ★ DB 안전성: happy-path 와 동일하게 /api/diagnosis 를 인터셉트해 fixture 로 응답 → prisma.create
//   미실행 = 실 DB 쓰기 0. (webServer.env 의 USE_MOCK/USE_MOCK_AUTH=true + KAKAO_MAP_KEY="" 도 공유.)
// ★ /share/[uuid] 는 서버 컴포넌트가 prisma.shareLink.findUnique(실 DB 읽기)를 호출 → 인터셉트
//   범위 밖이라 본 캡처에서 제외(쓰기 0 절대 보장). Playboard 에선 "공유 화면 별도" 표기.

const COUPLE_CANDIDATES = [
  { id: "c-1", dong: "공덕동", gu: "마포구", coordinate: { lat: 37.5446, lng: 126.9515 }, commuteA: { time: 18, mode: "transit" }, commuteB: { time: 27, mode: "transit" }, score: 92, priceRange: { min: 80000, max: 95000 }, facilities: { convenience: 12, cafes: 8 }, lines: "5호선 · 6호선 · 공항철도", listingsCount: 34, avgArea: 24 },
  { id: "c-2", dong: "신촌동", gu: "서대문구", coordinate: { lat: 37.5559, lng: 126.9368 }, commuteA: { time: 23, mode: "transit" }, commuteB: { time: 21, mode: "transit" }, score: 85, priceRange: { min: 72000, max: 88000 }, facilities: { convenience: 9, cafes: 11 }, lines: "2호선 · 경의중앙선", listingsCount: 28, avgArea: 22 },
  { id: "c-3", dong: "여의도동", gu: "영등포구", coordinate: { lat: 37.5215, lng: 126.9242 }, commuteA: { time: 29, mode: "transit" }, commuteB: { time: 19, mode: "transit" }, score: 78, priceRange: { min: 90000, max: 120000 }, facilities: { convenience: 14, cafes: 7 }, lines: "5호선 · 9호선", listingsCount: 41, avgArea: 28 },
];
const FIXTURE_ID = "e2e-fixture-001";

type InterceptState = { postIntercepted: boolean };

async function setupIntercept(page: Page): Promise<InterceptState> {
  const state: InterceptState = { postIntercepted: false };
  await page.route("**/api/diagnosis", async (route) => {
    if (route.request().method() === "POST") {
      state.postIntercepted = true;
      await route.fulfill({
        status: 200, contentType: "application/json",
        body: JSON.stringify({ diagnosisId: FIXTURE_ID, candidates: COUPLE_CANDIDATES, timeline: null }),
      });
      return;
    }
    await route.continue();
  });
  await page.route("**/api/diagnosis/*", async (route) => {
    await route.fulfill({
      status: 200, contentType: "application/json",
      body: JSON.stringify({ id: FIXTURE_ID, candidates: COUPLE_CANDIDATES, filters: {}, mode: "couple", deadlineMode: false, status: "completed", createdAt: "2026-06-20T00:00:00.000Z" }),
    });
  });
  return state;
}

// 랜딩 → 로그인(mock) → /diagnosis → 커플 두 직장 입력 → 진단 → /diagnosis/result (store 채움).
async function coupleToResult(page: Page): Promise<void> {
  await page.goto("/login");
  await page.getByRole("button", { name: "카카오로 1초 만에 시작" }).click();
  await page.waitForURL("**/diagnosis");

  for (const [label, query, opt] of [["내 직장", "공덕", /공덕동/], ["배우자 직장", "역삼", /역삼동/]] as const) {
    const input = page.getByLabel(label);
    await input.click();
    await input.fill(query);
    await page.getByRole("option", { name: opt }).first().click();
  }
  const submit = page.getByRole("button", { name: "진단 시작" });
  await expect(submit).toBeEnabled();
  await submit.click();
  await page.waitForURL("**/diagnosis/result/**");
  await expect(page.getByText(/후보 \d+개 동네/)).toBeVisible();
}

test.describe("Playboard 보강 캡처", () => {
  test("후보 상세 시트(DetailSheet) 열린 상태", async ({ page }) => {
    const state = await setupIntercept(page);
    await coupleToResult(page);

    // 후보 카드 클릭 → DetailSheet(BottomSheet=Dialog) 슬라이드업.
    await page.getByText("마포구 공덕동").first().click();
    const sheet = page.getByRole("dialog");
    await expect(sheet).toBeVisible();
    // heading 으로 한정 — 시트 안에 "마포구 공덕동" 이 제목·통근행에 중복(strict 회피).
    await expect(sheet.getByRole("heading", { name: "마포구 공덕동" })).toBeVisible();
    await page.waitForTimeout(400); // 시트 슬라이드업 애니메이션 안정
    await page.screenshot({ path: "e2e/screenshots/playboard_detail_sheet.png", fullPage: true });

    expect(state.postIntercepted, "POST 인터셉트(DB 쓰기 0)").toBe(true);
  });

  test("이사 데드라인 — 입력 폼 + D-day 타임라인", async ({ page }) => {
    const state = await setupIntercept(page);
    await coupleToResult(page); // store.candidates 채워 타임라인에 매물/마커 표시

    // /deadline 진입 — deadlineDate 미설정이라 날짜 입력 폼.
    await page.goto("/deadline");
    await expect(page.getByRole("heading", { name: "이사 데드라인" })).toBeVisible();
    await page.screenshot({ path: "e2e/screenshots/playboard_deadline_input.png", fullPage: true });

    // 미래 날짜 입력 → 저장 → D-day 타임라인 뷰.
    await page.locator("#deadline-input").fill("2026-09-30");
    const save = page.getByRole("button", { name: "데드라인 저장" });
    await expect(save).toBeEnabled();
    await save.click();
    // 타임라인 뷰 = DDayCounter(D-숫자) 표시. heading "이사 데드라인" 폼은 사라짐.
    await expect(page.locator("#deadline-input")).toHaveCount(0);
    await page.waitForTimeout(500);
    await page.screenshot({ path: "e2e/screenshots/playboard_deadline_timeline.png", fullPage: true });

    expect(state.postIntercepted, "POST 인터셉트(DB 쓰기 0)").toBe(true);
  });
});
