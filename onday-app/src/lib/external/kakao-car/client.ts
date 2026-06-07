import type { CommuteInfo } from "@/lib/types";
import type {
  IKakaoCarClient,
  KakaoCarCoord,
  KakaoCarClientConfig,
  KakaoCarResponse,
} from "./types";
import { DEFAULT_KAKAO_CAR_CONFIG, KakaoCarError } from "./types";
import { mapKakaoCarResponseToCommuteInfo } from "./mapper";

/**
 * 카카오 모빌리티 자동차 길찾기 클라이언트 — 브라우저 직접 호출 (CORS 허용, 도메인 제한).
 * ★ W2B: runRealDiagnosis(클라)에서 직장 경로마다 호출. ODsay(대중교통, 브라우저 직접)와 병렬.
 *   카카오는 일 50만급 + 브라우저 직접이라 Vercel 함수/10초/IP 화이트리스트 무관.
 */
export class KakaoCarClient implements IKakaoCarClient {
  private readonly apiKey: string;
  private readonly config: KakaoCarClientConfig;

  constructor(
    config: { apiKey: string } & Partial<Omit<KakaoCarClientConfig, "apiKey">>,
  ) {
    this.apiKey = config.apiKey;
    this.config = { ...DEFAULT_KAKAO_CAR_CONFIG, ...config };
  }

  async getCarCommute(
    origin: KakaoCarCoord,
    destination: KakaoCarCoord,
  ): Promise<CommuteInfo> {
    const res = await this.fetchWithRetry(origin, destination);
    return mapKakaoCarResponseToCommuteInfo(res);
  }

  private async fetchWithRetry(
    origin: KakaoCarCoord,
    destination: KakaoCarCoord,
  ): Promise<KakaoCarResponse> {
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
      ? new KakaoCarError(`카카오 자동차 호출 실패: ${lastError.message}`)
      : new KakaoCarError("카카오 자동차 호출 실패");
  }

  private async fetchOnce(
    origin: KakaoCarCoord,
    destination: KakaoCarCoord,
  ): Promise<KakaoCarResponse> {
    const url = new URL(`${this.config.baseUrl}/v1/directions`);
    // 카카오 directions = "경도,위도" (x,y) 순서.
    url.searchParams.set("origin", `${origin.x},${origin.y}`);
    url.searchParams.set("destination", `${destination.x},${destination.y}`);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.config.timeoutMs);
    try {
      const res = await fetch(url.toString(), {
        headers: { Authorization: `KakaoAK ${this.apiKey}` },
        signal: controller.signal,
      });
      if (!res.ok) {
        throw new KakaoCarError(`카카오 HTTP ${res.status}`, res.status);
      }
      return (await res.json()) as KakaoCarResponse;
    } finally {
      clearTimeout(timer);
    }
  }
}
