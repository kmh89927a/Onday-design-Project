import type { CommuteInfo } from "@/lib/types";
import type {
  IOdsayTransitClient,
  OdsayCoord,
  OdsayTransitClientConfig,
  OdsayTransitResponse,
} from "./types";
import { DEFAULT_ODSAY_CONFIG, OdsayTransitError } from "./types";
import { mapOdsayResponseToCommuteInfo } from "./mapper";

/**
 * ODsay 대중교통 길찾기 클라이언트 — 서버 전용 (#33 QRY-DIAG-002 / #30 timeout).
 * ★ B2 아키텍처: /api/commute 프록시가 동네별로 1회씩 호출 (함수당 1 호출 → Vercel 10초 무관).
 * ★ ODsay Server key 는 서버에서만 사용 (브라우저 직접 = CORS 차단).
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
        if (attempt < this.config.maxRetries) {
          await new Promise((r) => setTimeout(r, this.config.retryDelayMs));
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
        throw new OdsayTransitError(`ODsay HTTP ${res.status}`);
      }
      return (await res.json()) as OdsayTransitResponse;
    } finally {
      clearTimeout(timer);
    }
  }
}
