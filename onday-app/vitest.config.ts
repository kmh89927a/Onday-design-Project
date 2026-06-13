import { resolve } from "node:path";

import { defineConfig } from "vitest/config";

// 테스트 인프라 (#135 vitest 설치 후 마무리).
//   - resolve.alias: 앱 코드가 쓰는 "@/" (tsconfig paths) 를 vitest 가 알 수 있게 수동 매핑
//     (vite-tsconfig-paths 미설치 → @ → src 로 직접).
//   - environment node: 점수 로직 등 순수 함수 단위 테스트라 DOM 불필요.
//   - JSON import(safety-index.json 등)는 vitest 기본 동작으로 처리.
export default defineConfig({
  resolve: {
    alias: { "@": resolve(__dirname, "src") },
  },
  test: {
    environment: "node",
  },
});
