// ──────────────────────────────────────────────
// CMD-DIAG-001 카카오 Local API Geocoding fetch — 환경 중립 (Server Action / Route Handler / Client Component 모두 import 가능).
//
// ★ Mismatch ⑤ AbortSignal.timeout(5000) Vercel 10초 timeout 우회 박힘.
// ★ Mismatch ④ 환경 중립 책임 분리 (AGENTS.md L82 자가 치유) — "use client" 부재 가드. Server Action 금지는 use-geocode.ts 에만.
//
// ★ mapToGeocodedAddress 내부 헬퍼 (private, ★ 자가 치유 27번째 헤더 주석):
//   ★ Coordinate 재사용 (결정론 가드 § 진화 MOCK-005 § 후행 실전, ★ Mismatch ⑦)
//   ★ METRO_AREA_PREFIXES owner = 본 파일 모듈 상수 (★ 명세 §3.3 단일 진리 — coverage.ts 의 isMetroArea(address) 는 단순 위임)
//   ★ CMD-DIAG-002~007 후행 ISSUE 시점 mapper.ts 분리 자연 도입 예상 (Wave 3 트랙 G 점진 진화 정신, ★ adaptive § Command 차원 첫 적용 정직 기록)
// ──────────────────────────────────────────────

// ★ default import — namespace 는 ESM 빌드에서 capture* 미노출(sentry-error.ts 참조).
import Sentry from "@sentry/nextjs";
import type { Coordinate } from "@/lib/types";
import type { GeocodeResult, GeocodedAddress } from "./geocoding-types";

// ★ W2 정정: address.json(주소) → keyword.json(장소). 사용자가 치는 역/장소 이름
//   ("강남역")은 주소 검색으론 0건 → 키워드(장소) 검색이어야 매칭됨.
const KAKAO_LOCAL_API_URL = "https://dapi.kakao.com/v2/local/search/keyword.json";
const METRO_AREA_PREFIXES = ["서울", "경기", "인천"];

export async function geocodeAddress(query: string, apiKey: string): Promise<GeocodedAddress[]> {
  if (!query || query.length < 2) return [];

  try {
    const url = new URL(KAKAO_LOCAL_API_URL);
    url.searchParams.set("query", query);
    url.searchParams.set("size", "5");

    const response = await fetch(url.toString(), {
      headers: { Authorization: `KakaoAK ${apiKey}` },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      throw new Error(`Kakao Geocoding API error: ${response.status}`);
    }

    const data = await response.json();
    const documents: GeocodeResult[] = data.documents ?? [];

    return documents.map(mapToGeocodedAddress);
  } catch (error) {
    Sentry.captureException(error, { tags: { domain: "diagnosis", task: "CMD-DIAG-001" } });
    return [];
  }
}

function mapToGeocodedAddress(doc: GeocodeResult): GeocodedAddress {
  const addressName = doc.address_name ?? "";
  const isMetroArea = METRO_AREA_PREFIXES.some((prefix) =>
    addressName.startsWith(prefix),
  );
  const coord: Coordinate = { lat: parseFloat(doc.y), lng: parseFloat(doc.x) };
  return {
    address: doc.place_name, // 장소명 (사용자 친화 — 강남역)
    roadAddress: doc.road_address_name,
    coord,
    region: addressName, // 지번 주소 (서울 강남구 역삼동)
    isMetroArea,
  } satisfies GeocodedAddress;
}
