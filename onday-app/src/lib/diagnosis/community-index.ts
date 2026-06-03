import communityData from "@/lib/data/community-index.json";

// B 정책 — 수도권 시군구 공원·공공도서관 실데이터 (공공데이터포털 표준데이터 집계).
//   #57 야간안전(safety-index) 패턴 답습: 시군구 단위 정적 JSON + getXxxByGu 룩업.
//   ★ 단계 수집 — parks/libraries 둘 다 채워져야 ok. 미수집(null)은 no_data(준비중) 정직 표기.
//   소스: 전국도시공원 표준데이터 + 전국공공도서관 표준데이터 → 시군구별 count.

interface CommunityEntry {
  sigungu: string;
  region1: string;
  parks: number | null;
  libraries: number | null;
  _parksSource?: string | null;
  _librariesSource?: string | null;
}

const ENTRIES = (communityData as { entries: CommunityEntry[] }).entries;

// 시군구 키 → entry. NFC 정규화(safety-index 와 동일 — macOS NFD 입력 안전).
const BY_SIGUNGU = new Map<string, CommunityEntry>(
  ENTRIES.map((e) => [e.sigungu.normalize("NFC"), e]),
);

export interface CommunityOk {
  status: "ok";
  parks: number;
  libraries: number;
  total: number;
  sigungu: string;
}
export interface CommunityNoData {
  status: "no_data";
  sigungu: string;
}
export type CommunityLookup = CommunityOk | CommunityNoData;

// neighborhood.gu → 시군구 키 정규화 (safety-index normalizeGu 와 동일 규칙).
//   "고양시 일산동구" → "고양시" / "강남구"·"인천 서구" 그대로. NFC 우선(NFD 방어).
function normalizeGu(gu: string): string {
  const nfc = gu.normalize("NFC");
  const m = nfc.match(/^(.+?시)\s+\S+구$/);
  return m ? m[1] : nfc;
}

export function getCommunityByGu(gu: string): CommunityLookup {
  const key = normalizeGu(gu);
  const e = BY_SIGUNGU.get(key);
  if (!e || e.parks == null || e.libraries == null) {
    return { status: "no_data", sigungu: key };
  }
  return {
    status: "ok",
    parks: e.parks,
    libraries: e.libraries,
    total: e.parks + e.libraries,
    sigungu: key,
  };
}
