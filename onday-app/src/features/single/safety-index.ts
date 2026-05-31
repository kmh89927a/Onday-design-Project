import type { SafetyGrade } from "@/lib/types";
import safetyIndexData from "@/lib/data/safety-index.json";

// QRY-SINGLE-001 (#57) Rev 1.2 — 종합 야간안전 지수 (수도권 시군구 단위).
//   ★ 명세 역방향 정합: 명세의 getNightSafetyGrade(coord) 좌표 반경 검색 대신
//   getSafetyByGu(gu) 구 룩업으로 대체 (동단위 데이터 미수집 → 시군구 단위 채택).
//   소스: 행안부 지역안전지수(범죄) ×0.7 + 시군구 CCTV 밀집도 ×0.3.
//   ★ couple 모드 scoring(scoring.ts safetyBonus)은 neighborhoods.ts 의 hardcoded
//   safetyGrade 를 계속 사용 — 본 모듈은 single 모드 표시용 데이터 소스 (영향 없음).

interface SafetyIndexEntry {
  sigungu: string;
  region1: string;
  // ★ 단계별 수집 — null = 아직 미수집. 두 값이 모두 차야 종합 등급 산출(완성).
  //   CCTV 먼저 채우고 범죄등급은 나중에 채우는 워크플로 지원 (출처 정직성).
  crimeGrade: number | null; // 행안부 범죄 등급 1(안전)~5(위험)
  cctvPerKm2: number | null; // 시군구 면적당 방범 CCTV 대수
  _cctvSource?: string; // CCTV 값 출처 (정직성 추적).
  _crimeSource?: string; // 범죄등급 값 출처.
  _filled?: boolean; // (구 스키마 잔재 허용 — 무시됨)
}

const ENTRIES = (safetyIndexData as { entries: SafetyIndexEntry[] }).entries;

// 시군구 키 → entry 빠른 조회 (region1 무관, 키 자체가 disambiguated).
//   서울 = "강남구" / 인천 = "인천 서구" (중구 충돌 방지 프리픽스) / 경기 = "성남시".
//   ★ 키를 NFC 정규화 — macOS 입력/파일 경유 시 한글이 NFD(자모분리)로 들어와도
//   조회 키(NFC)와 일치하도록 (데이터 정합성 — 르르가 NFD로 채워도 안전).
const BY_SIGUNGU = new Map<string, SafetyIndexEntry>(
  ENTRIES.map((e) => [e.sigungu.normalize("NFC"), e]),
);

// ── 종합 점수 튜닝 상수 (데이터 분포 보고 조정 — C-3 합의) ──
const CRIME_WEIGHT = 0.7;
const CCTV_WEIGHT = 0.3;
// CCTV 정규화 범위 (대/km²). 이 구간을 0~100 으로 선형 매핑 후 clamp.
//
// ★ 면적당(per-km²) 유지 결정 (2026-05-31, 65구 데이터 완비 후 튜닝 검토 완료).
//   배경: 면적당은 강화·옹진·가평 등 섬·농지 포함 시군을 부당하게 낮게(D) 만든다
//   (사람 안 사는 땅이 분모). 이를 "인구 10만명당"으로 바꾸는 안을 66구 인구로 시뮬레이션함.
//   결과: per-100k 는 변별력을 무너뜨림 — 65구 중 40곳이 *상향*(하향 0), 분포가
//     A19/B24/C21/D1 로 A·B에 66% 쏠림(=대부분 안전 등급, 차이 소멸).
//     수도권은 면적당 CCTV 절대량이 많아 인구로 나누면 값이 전반적으로 부풀려지는 탓.
//     (면적당 현재 분포 A9/B12/C29/D15 가 시군 간 차이를 더 잘 가른다.)
//   판단: 야간안전 체감 지표 = "내가 걷는 길의 CCTV 밀도(면적당)" 가 직관적이고,
//     per-100k 의 인플레이션(거의 다 A·B)보다 변별력이 살아있다. 면적당 유지.
//   (재검토 시: ISSUE_REGISTER_LOG §30 참조. per-100k 시뮬 = 상향40/하향0, A19B24C21D1.)
const CCTV_MIN = 30;
const CCTV_MAX = 200;
// 종합점수 → 등급 임계값 (A 최고).
const GRADE_THRESHOLDS: { grade: SafetyGrade; min: number }[] = [
  { grade: "A", min: 80 },
  { grade: "B", min: 60 },
  { grade: "C", min: 40 },
  { grade: "D", min: 0 },
];

export interface SafetyOk {
  status: "ok";
  grade: SafetyGrade;
  score: number; // 0~100 종합
  crimeGrade: number; // 1~5 (행안부)
  cctvPerKm2: number;
  sigungu: string; // 정규화된 시군구 키 (예: "성남시")
}

export interface SafetyNoData {
  status: "no_data";
  grade: null;
  sigungu: string; // 정규화 시도 결과 (디버그/표시용)
}

export type SafetyLookup = SafetyOk | SafetyNoData;

/**
 * neighborhood.gu 를 safety-index 키로 정규화.
 *   - 경기 일반구 → 시 단위 타협: "성남시 분당구" → "성남시", "고양시 일산동구" → "고양시"
 *   - 서울 자치구: "강남구" (그대로)
 *   - 인천: "인천 서구" (그대로 — 서울 중구 vs 인천 중구 충돌 방지)
 *   - 순수 시: "김포시", "화성시" (그대로)
 */
export function normalizeGu(gu: string): string {
  // ★ NFC 정규화 우선 (NFD 입력 방어 — BY_SIGUNGU 키와 동일 기준).
  const nfc = gu.normalize("NFC");
  // "XX시 YY구" 패턴 → "XX시" (일반구 제거). "인천 서구"는 "시"가 없어 매칭 안 됨.
  const match = nfc.match(/^(.+?시)\s+\S+구$/);
  return match ? match[1] : nfc;
}

/**
 * 시군구 종합 야간안전 지수 조회.
 *   매핑 실패(비수도권 or 데이터 미수집) 시 grade 를 날조하지 않고 no_data 반환.
 *   ★ 명세 AC-4 의 'D' 처리 폐기 — "데이터 없음"과 "실제 위험(D)"을 구분 (E-2 합의).
 */
export function getSafetyByGu(gu: string): SafetyLookup {
  const key = normalizeGu(gu);
  const entry = BY_SIGUNGU.get(key);
  // entry 없음(비수도권) 또는 두 지표 중 하나라도 미수집(null) → 종합 불가 → no_data.
  //   ★ 가짜 등급 날조 금지 (E-2 합의). 단계별 채우는 중인 시군구도 완성 전엔 no_data.
  if (!entry || entry.crimeGrade == null || entry.cctvPerKm2 == null) {
    return { status: "no_data", grade: null, sigungu: key };
  }

  const crimeScore = (6 - entry.crimeGrade) * 20; // 1→100 … 5→20
  const cctvNorm = Math.max(
    0,
    Math.min(100, ((entry.cctvPerKm2 - CCTV_MIN) / (CCTV_MAX - CCTV_MIN)) * 100),
  );
  const score = Math.round(crimeScore * CRIME_WEIGHT + cctvNorm * CCTV_WEIGHT);
  const grade =
    GRADE_THRESHOLDS.find((t) => score >= t.min)?.grade ?? "D";

  return {
    status: "ok",
    grade,
    score,
    crimeGrade: entry.crimeGrade,
    cctvPerKm2: entry.cctvPerKm2,
    sigungu: key,
  };
}
