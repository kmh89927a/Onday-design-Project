// ──────────────────────────────────────────────
// CMD-DIAG-002 교집합 후보 동네 산출 — Promise.allSettled (외부 부분 실패 허용) + Promise.all (내부 양방향 필수) 이중 패턴.
//
// ★ Mismatch ③ 정수 답습 = features/diagnosis/mock-calculator.ts 의 Promise.allSettled 패턴 답습 (REQ-FUNC-003 정수 = Vercel 10초 timeout 우회).
// ★ Mismatch ② 자동 보정 = Coordinate 재사용 (★ 결정론 가드 § 진화 2번째 후행, CMD-DIAG-001 정수 답습).
// ★ Mismatch ⑤ AbortSignal.timeout = API-007 client.ts 위임 (★ 책임 분리, 본 ISSUE 직접 호출 X).
//
// ★ Coordinate ↔ KakaoCoord 변환은 toKakaoCoord 헬퍼로 transportClient 호출 직전만 (★ KakaoCoord ≠ Coordinate 분리 § 2번째 실전).
// ──────────────────────────────────────────────

// ★ default import — namespace 는 ESM 빌드에서 capture* 미노출(sentry-error.ts 참조).
import Sentry from "@sentry/nextjs";
import type { IKakaoTransportClient, KakaoCoord } from "@/lib/external/kakao-transport";
import { mapKakaoResponseToCommuteInfo } from "@/lib/external/kakao-transport";
import type { Coordinate, DiagnosisFilters, CommuteSchedule, DayOfWeek } from "@/lib/types";
import type { CandidateAreaDTO, CommuteInfoDTO } from "@/lib/types/diagnosis";
import { generateCandidatePool, type CandidatePoolEntry } from "./candidate-pool";

export interface IntersectionResult {
  candidates: CandidateAreaDTO[];
  failureRate: number;
  suggestions: string[];
}

const FAILURE_THRESHOLD = 0.05;

/** ★ Coordinate → KakaoCoord (★ transportClient 호출 직전만) */
function toKakaoCoord(c: Coordinate): KakaoCoord {
  return { x: c.lng, y: c.lat };
}

// ★ DTO-COMMUTE-TIME (#98) — commuteSchedule (요일 + HH:MM) → ISO 8601 (★ Mismatch ㊱ commuteSchedule DTO 정수 정정).
// ★ Validator strip 무관 = client 단 filters args 직접 흡수 (★ §4 (b) 결정 답습, REFACTOR-COMMUTE-LEGACY follow-up).
const DAY_TO_INDEX: Record<DayOfWeek, number> = {
  sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6,
};

function commuteScheduleToDepartureISO(
  schedule?: CommuteSchedule,
): string | undefined {
  if (!schedule || schedule.days.length === 0 || !schedule.departureTime) {
    return undefined; // ★ KakaoTransport 기본 = 현재 시각 자연 처리 (★ §5 우려 2 = Mismatch ㊶ 자연 결정)
  }
  const now = new Date();
  const today = now.getDay();
  // ★ 가장 가까운 다음 해당 요일 (target===today 시 7일 후 = "다음 출퇴근" 일관성 정수)
  const targetIndices = schedule.days.map((d) => DAY_TO_INDEX[d]);
  const daysAhead = targetIndices
    .map((target) => (target - today + 7) % 7 || 7)
    .reduce((min, d) => Math.min(min, d), 7);
  const [hours, minutes] = schedule.departureTime.split(":").map(Number);
  const targetDate = new Date(now);
  targetDate.setDate(now.getDate() + daysAhead);
  targetDate.setHours(hours, minutes, 0, 0);
  return targetDate.toISOString();
}

export async function calculateIntersection(
  coordA: Coordinate,
  coordB: Coordinate,
  filters: DiagnosisFilters,
  transportClient: IKakaoTransportClient,
): Promise<IntersectionResult> {
  const pool = generateCandidatePool(coordA, coordB);
  const kakaoA = toKakaoCoord(coordA);
  const kakaoB = toKakaoCoord(coordB);
  // ★ DTO-COMMUTE-TIME (#98) — commuteSchedule → ISO 8601 1회 계산 (★ Promise.all 직전, pool 전체 일관성).
  const departureTime = commuteScheduleToDepartureISO(filters.commuteSchedule);

  // ★ 외부 Promise.allSettled = 후보별 부분 실패 허용 (mock-calculator.ts 정수 답습)
  // ★ 내부 Promise.all = 한 후보의 양방향(A→entry, B→entry) 둘 다 성공해야 후보 추가
  const promises = pool.map(async (entry) => {
    const kakaoEntry = toKakaoCoord(entry.coord);
    const [routeA, routeB] = await Promise.all([
      transportClient.getRoute({ origin: kakaoA, destination: kakaoEntry, departureTime }),
      transportClient.getRoute({ origin: kakaoB, destination: kakaoEntry, departureTime }),
    ]);
    const commuteA = mapKakaoResponseToCommuteInfo(routeA);
    const commuteB = mapKakaoResponseToCommuteInfo(routeB);
    return { entry, commuteA, commuteB };
  });

  const results = await Promise.allSettled(promises);
  const succeeded = results.filter(
    (r): r is PromiseFulfilledResult<{ entry: CandidatePoolEntry; commuteA: CommuteInfoDTO; commuteB: CommuteInfoDTO }> =>
      r.status === "fulfilled",
  );
  const failureRate = pool.length === 0 ? 0 : (results.length - succeeded.length) / results.length;

  if (failureRate > FAILURE_THRESHOLD) {
    Sentry.captureMessage(`Kakao API failure rate ${(failureRate * 100).toFixed(1)}%`, {
      level: "warning",
      tags: { domain: "diagnosis", task: "CMD-DIAG-002" },
    });
  }

  // 통근 시간 필터
  const filtered = succeeded
    .map((r) => r.value)
    .filter(({ commuteA, commuteB }) => {
      if (filters.maxCommuteTime) {
        return commuteA.time <= filters.maxCommuteTime && commuteB.time <= filters.maxCommuteTime;
      }
      return true;
    });

  // 통근시간 합 기반 임시 정렬 (★ 스코어링은 CMD-DIAG-003 = mapper.ts 자연 도입 시점)
  filtered.sort((a, b) => a.commuteA.time + a.commuteB.time - (b.commuteA.time + b.commuteB.time));

  // ★ Phase B 자동 검출 = CandidateAreaDTO 실제 필드 = { id, dong, gu, coordinate, commuteA, commuteB?, score, ... } — name/coord/rank 부재 (★ 명세 §3.3 stale 자가 치유).
  // ★ entry.name ("강남구 역삼동", "성남시 분당구 정자동", "인천 연수구 송도동") 분리 = 마지막 단어 = dong, 나머지 = gu.
  const candidates: CandidateAreaDTO[] = filtered.map(({ entry, commuteA, commuteB }) => {
    const parts = entry.name.split(" ");
    const dong = parts[parts.length - 1];
    const gu = parts.slice(0, -1).join(" ");
    return {
      id: crypto.randomUUID(),
      dong,
      gu,
      coordinate: entry.coord, // ★ Coordinate 직접 재사용 (★ Mismatch ② 자동 보정)
      commuteA,
      commuteB,
      score: 0, // ★ CMD-DIAG-003 (Scoring) 자연 도입 시점
    } satisfies CandidateAreaDTO;
  });

  // 0곳 시나리오 — REQ-FUNC-008 조건 완화 제안
  const suggestions: string[] = [];
  if (candidates.length === 0) {
    if (filters.maxCommuteTime && filters.maxCommuteTime < 60) {
      suggestions.push(`최대 통근 시간을 ${filters.maxCommuteTime + 15}분으로 늘려보세요`);
    }
    if (filters.maxCommuteTime && filters.maxCommuteTime < 90) {
      suggestions.push(`최대 통근 시간을 ${filters.maxCommuteTime + 30}분으로 늘려보세요`);
    }
    suggestions.push("자차 모드를 포함해 검색해 보세요");
  }

  return { candidates, failureRate, suggestions };
}
