// ──────────────────────────────────────────────
// API-006 reportErrorToSentry — Sentry 연동 helper (★★ Q9 (C 절충) — "import 가능 + init 위임" 새 패턴).
//
// ★★ Q9 (C 절충) — API-007 client.ts 스텁 패턴 § 진화 (★ 8종 가이드 § 첫 실전 검증):
//   - ★ rigid (A 그대로): Stub만 + Sentry import 0 → API-007 패턴 정확 답습
//   - ★ adaptive (C 절충 — 본 ISSUE 채택): Sentry SDK 설치됨 (@sentry/nextjs ^10.53.1) 활용 + Sentry.init() = MON-001 위임 + runtime no-op 안전성
//
// ★ Sentry SDK runtime no-op 안전성 보장 (Sentry SDK 공식 문서):
//   Sentry.init() 이 호출되지 않은 상태에서 captureException/captureMessage 호출 시 → silent no-op (에러 없음, 단순히 전송 안 됨).
//   본 모듈은 Sentry SDK 가 어디선가 초기화되었다고 가정. MON-001 시점에 `Sentry.init({ dsn: NEXT_PUBLIC_SENTRY_DSN })` 호출 = Wave 5 트랙 P.
//
// ★ console.error fallback (dev 환경 안전성) — production 환경에서는 Sentry 만 전송, dev/test 에서는 콘솔도 출력.
// ──────────────────────────────────────────────

// ★ default import — namespace(`import * as`)는 @sentry/nextjs ESM 빌드(edge/browser/prod)에서
//   captureException/Message/withScope 를 노출 안 함(default 밑에만 존재) → "is not a function".
//   default import 는 ESM(default)·node CJS(esModuleInterop) 양쪽에서 full API 동작(실측).
import Sentry from '@sentry/nextjs';
import type { AppErrorDTO } from '@/lib/types/errors';

/**
 * AppErrorDTO 를 Sentry 로 전송 (★ Q9 (C 절충) — import 가능 + init 위임 + runtime no-op 안전).
 *
 * Sentry.init({ dsn: NEXT_PUBLIC_SENTRY_DSN }) 호출은 MON-001 (Wave 5 트랙 P — Monitoring setup) 위임.
 * 본 모듈은 Sentry SDK 가 어딘가에서 초기화되었다고 가정 (Sentry SDK 공식 no-op 안전성 보장).
 *
 * @param error AppErrorDTO — createAppError() 산출물 또는 4 createXError 산출물 호환 (originalError unknown)
 */
export function reportErrorToSentry(error: AppErrorDTO): void {
  // ★ dev/test 환경 console.error fallback — Sentry 미초기화 시점에도 가시성 보장
  if (process.env.NODE_ENV !== 'production') {
    console.error('[AppError]', error.code, error.message, error.originalError);
  }

  // ★ Sentry SDK 호출 — init 안 됐어도 silent no-op (Sentry SDK 공식 안전성)
  Sentry.withScope((scope) => {
    scope.setLevel(error.sentryLevel ?? 'error');
    scope.setContext('appError', {
      code: error.code,
      httpStatus: error.httpStatus,
    });
    if (error.originalError !== undefined) {
      Sentry.captureException(error.originalError);
    } else {
      Sentry.captureMessage(error.message);
    }
  });
}
