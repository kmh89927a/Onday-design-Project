// Sentry 서버/엣지 init 진입점 (Next 15 + @sentry/nextjs v10).
// ★ Next 15는 server/edge Sentry.init 을 instrumentation.ts 의 register() 로 로드한다.
//   이 파일이 없으면 sentry.server.config 가 안 불려 서버 에러(3-sink logError ③)가 미전송된다.
// ★ DSN 미설정 시에도 안전: sentry.server/edge.config 가 DSN 유효 URL일 때만 init → no-op 유지.
// ★ 기존 config 3종·reportErrorToSentry·log-error.ts 무변경 — 진입점만 추가(additive).

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

// 서버 컴포넌트·라우트의 요청 처리 에러를 Sentry 로 캡처(Next 15 onRequestError 훅).
export { captureRequestError as onRequestError } from "@sentry/nextjs";
