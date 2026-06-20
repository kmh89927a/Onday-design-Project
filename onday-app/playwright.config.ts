import { defineConfig, devices } from "@playwright/test";

// Happy Path E2E (학습·포트폴리오용 시각 리포트).
//
// ★ 안전성: webServer 가 mock env(USE_MOCK / USE_MOCK_AUTH=true)로 next dev 를 기동한다.
//   - USE_MOCK=true     → 후보 계산 오프라인(Haversine) + 주소 자동완성 mock(MOCK_NEIGHBORHOODS).
//     외부 Kakao/ODsay API 호출 0.
//   - USE_MOCK_AUTH=true → 로그인 원클릭(mock), 실 OAuth/Supabase 키 불필요.
//   - 단, mock 모드도 /api/diagnosis 가 prisma.create 로 실 DB 에 저장하므로(조사 확인),
//     ★ 실 DB 쓰기 차단은 스펙 내부의 page.route 인터셉트가 담당한다(여기 env 만으론 부족).
//   NEXT_PUBLIC_* 는 빌드/dev 시작 시 inline → 반드시 서버 기동 시점에 주입해야 한다.
//   (.env.local 의 USE_MOCK=false 보다 process.env 가 우선 → 아래 env 가 이긴다.)
//
// E2E 전용 포트(3100)로 띄워 일반 dev 서버(3000)와 충돌을 피한다.

const PORT = 3100;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [["html", { open: "never" }], ["list"]],
  use: {
    baseURL: BASE_URL,
    screenshot: "on",
    trace: "on",
    video: "off",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: `npx next dev -p ${PORT}`,
    url: BASE_URL,
    timeout: 120_000,
    reuseExistingServer: false,
    env: {
      NEXT_PUBLIC_USE_MOCK: "true",
      NEXT_PUBLIC_USE_MOCK_AUTH: "true",
    },
  },
});
