// 통합 에러 로깅 유틸 (11주차 — 3-sink: 콘솔 + DB + Sentry). 서버측 사용 전제(prisma import).
// ★ 기존 자산 재사용(중복 정의 X): maskPII(메시지 마스킹) · reportErrorToSentry(Sentry) · AppErrorDTO.
// ★ best-effort — 각 sink try/catch. DB insert·로깅 실패해도 앱 절대 안 죽는다.
// ★ 프라이버시 — message 는 maskPII(이메일·전화 [REDACTED]) 거치고, 개인 식별 필드는 받지 않는다
//   (userType=유형만 · visitorId=익명 · device/os=대분류). USER FK 없음.
//
// 본 PR(토대)은 유틸 정의까지. 실제 API 라우트 적용은 다음 PR.

import { prisma } from "@/lib/db";
import { reportErrorToSentry } from "@/lib/helpers/sentry-error";
import { maskPII } from "@/lib/helpers/sentry-pii-mask";
import { CommonErrorCode } from "@/lib/types/errors/common";

export type LogLevel = "error" | "warn";
export type LogUserType = "kakao" | "guest" | "reviewer";

export interface LogErrorPayload {
  level: LogLevel;
  message: string;
  statusCode?: number | null;
  route?: string | null; // API route (예: POST /api/diagnosis)
  screenPath?: string | null; // 화면 경로 (예: /diagnosis/result/[id])
  errorType?: string | null; // 분류 (AppErrorCode 등)
  userType?: LogUserType | null; // 유형만 — 개인 식별 X
  visitorId?: string | null; // 익명 방문자 ID
  device?: string | null; // mobile | desktop
  os?: string | null; // ios | android | windows | mac | other
  /** Sentry 캡처용 원본 — DB·콘솔엔 저장 안 함. */
  originalError?: unknown;
}

/** 3-sink 로깅. 모든 sink 는 best-effort(실패해도 throw 안 함). */
export async function logError(p: LogErrorPayload): Promise<void> {
  const message = maskPII(p.message); // ★ 메시지 마스킹

  const meta = {
    level: p.level,
    statusCode: p.statusCode ?? null,
    route: p.route ?? null,
    screenPath: p.screenPath ?? null,
    errorType: p.errorType ?? null,
    message,
    userType: p.userType ?? null,
    visitorId: p.visitorId ?? null,
    device: p.device ?? null,
    os: p.os ?? null,
  };

  // ① 콘솔 — JSON 구조화 (health.ts 패턴, connection string 등 미포함).
  try {
    const line = JSON.stringify({ event: "app_error", ...meta });
    if (p.level === "warn") console.warn(line);
    else console.error(line);
  } catch {
    // best-effort
  }

  // ② DB — ErrorLog insert (best-effort: 테이블 미배포·연결 실패 시 조용히 실패).
  try {
    await prisma.errorLog.create({ data: meta });
  } catch {
    // 앱 흐름 차단 X
  }

  // ③ Sentry — reportErrorToSentry 재사용 (DSN 있을 때만 실제 전송, 없으면 no-op).
  try {
    reportErrorToSentry({
      code: CommonErrorCode.INTERNAL_SERVER_ERROR,
      message,
      httpStatus: p.statusCode ?? 500,
      sentryLevel: p.level === "warn" ? "warning" : "error",
      originalError: p.originalError,
    });
  } catch {
    // best-effort
  }
}
