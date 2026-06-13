import { describe, expect, it } from "vitest";

import { getSafetyByGu } from "@/features/single/safety-index";

import { scoreCandidate, type ScoreInput } from "./scoring";

// OnDay 핵심 알고리즘 scoreCandidate 단위 테스트 (scoring.ts:66-101).
//   ★ 테스트는 현재 공식을 "검증"만 한다 — 통과시키려고 scoring.ts 를 고치지 않는다.
//   ★ 안전 가산(scoring.ts:83-86)은 무조건 적용되므로, 공식만 결정론적으로 보려면
//     비수도권 gu("강릉시")를 써서 no_data → 안전 +0 으로 격리한다.
//     (safety-index 는 수도권만 → "강릉시"는 항상 no_data. 수원 같은 수도권 미수집과 달리
//      추후 데이터가 채워져도 커버리지 밖이라 테스트가 깨지지 않는다.)

const NO_DATA_GU = "강릉시"; // 수도권 밖 → getSafetyByGu = no_data (안전 가산 0)

// 공통 입력 빌더 — 필요한 필드만 덮어쓴다.
function input(overrides: Partial<ScoreInput> = {}): ScoreInput {
  return {
    neighborhood: { gu: NO_DATA_GU, facilities: { convenience: 0, cafes: 0 } },
    commuteA: 10,
    commuteB: null,
    leisureA: null,
    leisureB: null,
    ...overrides,
  };
}

describe("scoreCandidate", () => {
  it("(a) 기본 공식: 통근 패널티 + 편의 가산 합성 (안전 no_data 로 격리)", () => {
    // 100 - min(40, 10*0.8=8)=8 → 92 (통근, :77-78)
    //     + 0 (안전 no_data, :84)
    //     + min(10, (100+100)/40=5)=5 → 97 (편의, :90-92)
    const score = scoreCandidate(
      input({
        commuteA: 10,
        neighborhood: { gu: NO_DATA_GU, facilities: { convenience: 100, cafes: 100 } },
      }),
    );
    expect(score).toBe(97);
  });

  it("(b) 통근 패널티는 40점에서 상한 (commute 가 아무리 커도 -40 이상 안 깎임)", () => {
    // avgCommute*0.8 = 200*0.8 = 160 이지만 min(40, …) → 40 만 차감 (:78)
    // 100 - 40 = 60. (상한이 없다면 100-160 = -60 → 0 이 됐을 것)
    const score = scoreCandidate(input({ commuteA: 200 }));
    expect(score).toBe(60);
  });

  it("(c) ★ 부부 두 직장: 통근은 A·B 평균으로 패널티 (OnDay 핵심)", () => {
    // (commuteA 20 + commuteB 60)/2 = 40 → min(40, 32)=32 차감 → 68 (:77-78)
    const couple = scoreCandidate(input({ commuteA: 20, commuteB: 60 }));
    expect(couple).toBe(68);
    // 평균이 40 인 싱글(commuteA=40, commuteB=null)과 동일해야 평균 로직이 증명됨.
    const singleSameAvg = scoreCandidate(input({ commuteA: 40, commuteB: null }));
    expect(couple).toBe(singleSameAvg);
  });

  it("(d) 싱글 모드: commuteB=null 이면 commuteA 만 사용 (B를 0으로 치지 않음)", () => {
    // commuteB null → avgCommute = commuteA = 30 → min(40, 24)=24 차감 → 76 (:77)
    //   (만약 B를 0 으로 잘못 평균냈다면 avg 15 → 88 이 됐을 것)
    const score = scoreCandidate(input({ commuteA: 30, commuteB: null }));
    expect(score).toBe(76);
  });

  it("(e) 결과는 0~100 정수 — 상한 clamp + 반올림 (:100)", () => {
    // 상한: 100 - 0(통근) + 0(안전) + 10(편의 saturate) + 5+5(여가 0분×2) = 120 → clamp 100
    const over = scoreCandidate(
      input({
        commuteA: 0,
        neighborhood: { gu: NO_DATA_GU, facilities: { convenience: 1000, cafes: 1000 } },
        leisureA: 0,
        leisureB: 0,
      }),
    );
    expect(over).toBe(100);

    // 반올림: 100 - 8 + (50+33)/40=2.075 = 94.075 → round → 94 (정수)
    const rounded = scoreCandidate(
      input({
        commuteA: 10,
        neighborhood: { gu: NO_DATA_GU, facilities: { convenience: 50, cafes: 33 } },
      }),
    );
    expect(rounded).toBe(94);
    expect(Number.isInteger(rounded)).toBe(true);
  });

  it("(f) 안전 통합: 수도권 동네는 getSafetyByGu 등급만큼 가산 (실데이터 결합)", () => {
    // 강남구는 수도권 커버 → status ok. scoreCandidate 가 그 등급 보너스를 반영하는지,
    //   동일 입력의 no_data 동네와의 차이 = 등급 보너스 인지로 검증(등급 값 하드코딩 회피).
    const COVERED_GU = "강남구";
    const safety = getSafetyByGu(COVERED_GU);
    expect(safety.status).toBe("ok"); // 수도권 커버 sanity
    if (safety.status !== "ok") return; // 타입 가드

    const bonusByGrade: Record<string, number> = { A: 10, B: 5, C: 0, D: -10 };
    const expectedBonus = bonusByGrade[safety.grade];

    const base = { commuteA: 10, commuteB: null } as const;
    const covered = scoreCandidate(
      input({ ...base, neighborhood: { gu: COVERED_GU, facilities: { convenience: 0, cafes: 0 } } }),
    );
    const noData = scoreCandidate(input(base));
    // 두 입력 차이는 오직 안전 등급 → 점수 차 = 등급 보너스(정수라 반올림 영향 없음).
    expect(covered - noData).toBe(expectedBonus);
  });
});
