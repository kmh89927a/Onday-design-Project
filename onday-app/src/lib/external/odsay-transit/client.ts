import type { CommuteInfo } from "@/lib/types";
import type {
  IOdsayTransitClient,
  OdsayCoord,
  OdsayTransitClientConfig,
  OdsayTransitResponse,
} from "./types";
import {
  DEFAULT_ODSAY_CONFIG,
  ODSAY_QUOTA_EXCEEDED_CODE,
  OdsayTransitError,
} from "./types";
import { mapOdsayResponseToCommuteInfo } from "./mapper";

// ODsay 에러는 HTTP 200 + 본문 error 로 온다. error 형태가 객체({code,message}) 또는
// 배열([{code,message}]) 둘 다 관측됨 → 런타임에서 양쪽 방어해 첫 에러만 꺼낸다.
function firstError(
  res: OdsayTransitResponse,
): { code?: string; message?: string } | null {
  const err = res.error as unknown;
  if (!err) return null;
  const first = (Array.isArray(err) ? err[0] : err) as
    | { code?: unknown; message?: unknown }
    | undefined;
  if (!first) return null;
  return {
    code: first.code === undefined ? undefined : String(first.code),
    message: typeof first.message === "string" ? first.message : undefined,
  };
}

/**
 * ODsay 대중교통 길찾기 클라이언트 — 브라우저 직접 호출 (#33 QRY-DIAG-002 / #30 timeout).
 * ★ B2 아키텍처: runRealDiagnosis(클라)가 동네별로 1회씩 호출 (Vercel 함수/10초 무관).
 * ★ Web 키(NEXT_PUBLIC_ODSAY_API_KEY) = 도메인 인증. ODsay 는 CORS 허용(ACAO: *) → 브라우저 직접 정상.
 *   (구: Server 키 + /api/commute 프록시는 Vercel 고정 IP 화이트리스트 막힘 → 폐지.)
 */
export class OdsayTransitClient implements IOdsayTransitClient {
  private readonly apiKey: string;
  private readonly config: OdsayTransitClientConfig;

  constructor(
    config: { apiKey: string } & Partial<
      Omit<OdsayTransitClientConfig, "apiKey">
    >,
  ) {
    this.apiKey = config.apiKey;
    this.config = { ...DEFAULT_ODSAY_CONFIG, ...config };
  }

  async getTransitCommute(
    origin: OdsayCoord,
    destination: OdsayCoord,
  ): Promise<CommuteInfo> {
    const res = await this.fetchWithRetry(origin, destination);
    return mapOdsayResponseToCommuteInfo(res);
  }

  private async fetchWithRetry(
    origin: OdsayCoord,
    destination: OdsayCoord,
  ): Promise<OdsayTransitResponse> {
    let lastError: unknown;
    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        return await this.fetchOnce(origin, destination);
      } catch (err) {
        lastError = err;
        // 일일 할당량 소진은 재시도해도 회복 안 됨 → 즉시 포기(호출부가 추정 fallback + 이후 호출 skip).
        if (
          err instanceof OdsayTransitError &&
          err.code === ODSAY_QUOTA_EXCEEDED_CODE
        ) {
          throw err;
        }
        if (attempt < this.config.maxRetries) {
          // ★ 429(rate limit)는 지수 backoff(혼잡 완화) — 600→1200→2400ms.
          //   그 외 에러(타임아웃·네트워크·HTTP)는 기존 고정 지연 유지.
          const isRateLimit =
            err instanceof OdsayTransitError && err.code === "429";
          const delay = isRateLimit
            ? this.config.retryDelayMs * 2 ** attempt
            : this.config.retryDelayMs;
          await new Promise((r) => setTimeout(r, delay));
        }
      }
    }
    throw lastError instanceof Error
      ? new OdsayTransitError(`ODsay 호출 실패: ${lastError.message}`)
      : new OdsayTransitError("ODsay 호출 실패");
  }

  private async fetchOnce(
    origin: OdsayCoord,
    destination: OdsayCoord,
  ): Promise<OdsayTransitResponse> {
    const url = new URL(`${this.config.baseUrl}/searchPubTransPathT`);
    url.searchParams.set("SX", String(origin.lng)); // 출발 경도
    url.searchParams.set("SY", String(origin.lat)); // 출발 위도
    url.searchParams.set("EX", String(destination.lng)); // 도착 경도
    url.searchParams.set("EY", String(destination.lat)); // 도착 위도
    url.searchParams.set("apiKey", this.apiKey);
    url.searchParams.set("output", "json");

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.config.timeoutMs);
    try {
      const res = await fetch(url.toString(), { signal: controller.signal });
      if (!res.ok) {
        throw new OdsayTransitError(`ODsay HTTP ${res.status}`, String(res.status));
      }
      const data = (await res.json()) as OdsayTransitResponse;
      // ★ ODsay 429 는 HTTP 200 본문으로 옴({"error":{"code":"429"}}) → 여기서 throw 해야
      //   fetchWithRetry 의 backoff 재시도에 진입한다. (error 형태: 객체 또는 배열 둘 다 방어.)
      //   단 "Daily quota exceeded"(일일 할당량 소진)는 같은 429 코드지만 재시도 무의미 → 별도 코드.
      const err = firstError(data);
      if (err?.code === "429") {
        if (/quota/i.test(err.message ?? "")) {
          throw new OdsayTransitError(
            "ODsay 일일 할당량 초과",
            ODSAY_QUOTA_EXCEEDED_CODE,
          );
        }
        throw new OdsayTransitError("ODsay 429 Too Many Requests", "429");
      }
      return data;
    } finally {
      clearTimeout(timer);
    }
  }
}
