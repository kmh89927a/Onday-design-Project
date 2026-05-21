// ──────────────────────────────────────────────
// API-007 카카오 모빌리티 — KakaoTransportClient 구현체 스텁.
//
// ★ Q7 결정 — TODO 주석 + throw new Error 명시 + CMD-DIAG-001 위임 트리거.
//   본 ISSUE = interface contract + 스텁 only. 실제 fetch + timeout + retry + KakaoTransportError 변환은 CMD-DIAG-001.
//
// ★ MOCK-004 신설 시 MockKakaoTransportClient implements IKakaoTransportClient 답습 가이드 (★ 외부 도메인 결정 매트릭스 § 신규 owner).
// ──────────────────────────────────────────────

import type {
  IKakaoTransportClient,
  KakaoCoord,
  KakaoRouteRequest,
  KakaoTransportResponse,
  KakaoTransportClientConfig,
} from './types';
import type { CommuteInfo } from '@/lib/types';
import { DEFAULT_KAKAO_CONFIG } from './types';

/**
 * KakaoTransportClient 실제 구현체.
 * ★ TODO: CMD-DIAG-001 에서 fetch 기반 HTTP 호출 + timeout (config.timeoutMs) + retry (config.maxRetries) + KakaoTransportError 변환 구현.
 * ★ 테스트 / Mock 환경: MockKakaoTransportClient (MOCK-004) 사용.
 */
export class KakaoTransportClient implements IKakaoTransportClient {
  private config: KakaoTransportClientConfig;

  constructor(config: Partial<KakaoTransportClientConfig> & { apiKey: string }) {
    this.config = { ...DEFAULT_KAKAO_CONFIG, ...config };
  }

  async getRoute(_request: KakaoRouteRequest): Promise<KakaoTransportResponse> {
    throw new Error(
      'KakaoTransportClient.getRoute is not implemented. Use MockKakaoTransportClient for testing (MOCK-004). Implementation deferred to CMD-DIAG-001.',
    );
  }

  async getCommuteTime(
    _origin: KakaoCoord,
    _destination: KakaoCoord,
    _departureTime?: string,
  ): Promise<CommuteInfo> {
    throw new Error(
      'KakaoTransportClient.getCommuteTime is not implemented. Use MockKakaoTransportClient for testing (MOCK-004). Implementation deferred to CMD-DIAG-001.',
    );
  }
}
