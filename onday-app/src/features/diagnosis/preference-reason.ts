import { getSafetyByGu } from "@/features/single/safety-index";
import { getCommunityByGu } from "@/lib/diagnosis/community-index";
import type { CandidateArea } from "@/lib/types";

// 선호 태그(⑥) 데이터별 정직 근거 — 카드/시트에 "왜 이 동네"를 그 후보의 실제 지표로.
//   safety = #57 종합 야간안전 지수(getSafetyByGu, 부부·싱글 공통) → 등급. no_data 시 mock grade.
//   convenience/hotplace/quiet = facilities(파생 포함) 실측 수치 기반 티어.

const SAFETY_REASON: Record<string, string> = {
  A: "치안 우수",
  B: "치안 양호",
  C: "치안 보통",
  D: "치안 주의",
};

export function buildPreferenceReason(
  key: string | undefined,
  c: CandidateArea,
): string | null {
  switch (key) {
    case "safety": {
      const safety = getSafetyByGu(c.gu);
      const grade = safety.status === "ok" ? safety.grade : c.safetyGrade;
      if (!grade) return "야간 치안 반영";
      return `${SAFETY_REASON[grade]} (${grade}등급)`;
    }
    case "convenience": {
      const n = c.facilities?.convenience ?? 0;
      const tier = n >= 30 ? "편의시설 풍부" : n >= 20 ? "편의시설 양호" : "편의시설 보통";
      return `${tier} (${n}곳)`;
    }
    case "hotplace": {
      const n = c.facilities?.cafes ?? 0;
      const tier = n >= 45 ? "카페 많음" : n >= 25 ? "카페 보통" : "카페 적당";
      return `${tier} (${n}곳)`;
    }
    case "quiet": {
      // ★ 구(시군구) 단위 집계값 — 동네 카드에 "구 N곳"으로 정직 표기(동 단위 아님).
      const com = getCommunityByGu(c.gu);
      if (com.status !== "ok") return "공원·도서관 데이터 준비중";
      const tier =
        com.total >= 200 ? "공원·도서관 풍부" : com.total >= 100 ? "공원·도서관 양호" : "공원·도서관 보통";
      return `${tier} (구 ${com.total}곳)`;
    }
    default:
      return null;
  }
}
