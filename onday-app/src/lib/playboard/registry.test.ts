import { existsSync } from "node:fs";
import { join, resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
  AREA_SPECS,
  CONVERGENCE,
  CRITICAL_AREAS,
  type CriticalAreaId,
  SCREEN_SPECS,
  SCREENS,
  TECH_ITEMS,
  USER_FLOWS,
  buildCoverageMatrix,
} from "./registry";

// Playboard SoT 무결성 불변식 — playboard-skill §10 / 재현 체크리스트 대응.
//   ★ 이 테스트는 레지스트리(registry.ts)를 변경하지 않고 정합성만 강제한다.
//   ★ green = "보드가 코드와 따로 놀지 않는다"의 자동 증거. 빨간데 머지하면 효용이 샌다.
//   ★ 검사 항목: 고아 참조 0 · 영역 키 집합 정합 · implemented→근거 필수 · evidence 경로 실재.

// CriticalAreaId 의 정본 집합(레지스트리가 다루는 6영역). 키 멤버십 검사의 기준.
const AREA_IDS: CriticalAreaId[] = [
  "auth-session",
  "access-control",
  "data-integrity",
  "resilience",
  "observability",
  "performance",
];

const SCREEN_IDS = new Set(SCREENS.map((s) => s.id));
const TECH_IDS = new Set(TECH_ITEMS.map((t) => t.id));
const AREA_ID_SET = new Set<string>(AREA_IDS);

// evidence/screenshot 경로 해석: docs/·design-input/ 은 프로젝트 루트, 나머지는 onday-app 루트 기준.
const APP_ROOT = process.cwd();
const PROJECT_ROOT = resolve(APP_ROOT, "..");
function resolveRepoPath(p: string): string {
  const rootRelative = p.startsWith("docs/") || p.startsWith("design-input/");
  return join(rootRelative ? PROJECT_ROOT : APP_ROOT, p);
}
// "src/foo.ts:42" → "src/foo.ts" (라인 번호 분리).
function pathPart(evidence: string): string {
  return evidence.split(":")[0];
}

describe("Playboard 레지스트리 무결성 — 식별자 유일성", () => {
  it("화면 id 중복 없음", () => {
    expect(SCREEN_IDS.size).toBe(SCREENS.length);
  });

  it("기술항목 id 중복 없음", () => {
    expect(TECH_IDS.size).toBe(TECH_ITEMS.length);
  });

  it("mission-critical 영역 id 중복 없음 + 정본 6영역과 일치", () => {
    const ids = CRITICAL_AREAS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(ids)).toEqual(AREA_ID_SET);
  });
});

describe("Playboard 레지스트리 무결성 — 고아 참조 금지", () => {
  it("USER_FLOWS.screens 는 모두 실재 화면 id", () => {
    for (const flow of USER_FLOWS) {
      for (const screenId of flow.screens) {
        expect(SCREEN_IDS, `flow ${flow.id} → ${screenId}`).toContain(screenId);
      }
    }
  });

  it("CRITICAL_AREAS.techItemIds 는 모두 실재 기술항목 id", () => {
    for (const area of CRITICAL_AREAS) {
      for (const techId of area.techItemIds) {
        expect(TECH_IDS, `area ${area.id} → ${techId}`).toContain(techId);
      }
    }
  });

  it("CRITICAL_AREAS.exercisedOnScreens 는 모두 실재 화면 id", () => {
    for (const area of CRITICAL_AREAS) {
      for (const screenId of area.exercisedOnScreens) {
        expect(SCREEN_IDS, `area ${area.id} → ${screenId}`).toContain(screenId);
      }
    }
  });

  it("TECH_ITEMS.area 는 모두 정의된 제어 영역", () => {
    for (const tech of TECH_ITEMS) {
      expect(AREA_ID_SET, `tech ${tech.id}`).toContain(tech.area);
    }
  });

  it("SCREEN_SPECS 키는 모두 실재 화면 id", () => {
    for (const screenId of Object.keys(SCREEN_SPECS)) {
      expect(SCREEN_IDS, `spec ${screenId}`).toContain(screenId);
    }
  });

  it("SCREEN_SPECS[*].nfr 는 모두 정의된 제어 영역", () => {
    for (const [screenId, spec] of Object.entries(SCREEN_SPECS)) {
      for (const area of spec.nfr) {
        expect(AREA_ID_SET, `spec ${screenId} → nfr ${area}`).toContain(area);
      }
    }
  });

  it("CONVERGENCE.targetId 는 화면·기술항목·영역 중 실재 id", () => {
    const known = new Set<string>([...SCREEN_IDS, ...TECH_IDS, ...AREA_ID_SET]);
    for (const conv of CONVERGENCE) {
      expect(known, `convergence "${conv.title}" → ${conv.targetId}`).toContain(conv.targetId);
    }
  });
});

describe("Playboard 레지스트리 무결성 — 영역 키 집합 정합", () => {
  it("AREA_SPECS 키 집합 = 정본 6영역 (누락·잉여 0)", () => {
    expect(new Set(Object.keys(AREA_SPECS))).toEqual(AREA_ID_SET);
  });

  it("모든 제어 영역은 최소 1개 화면에서 행사 (커버리지 갭 없음)", () => {
    for (const area of CRITICAL_AREAS) {
      expect(area.exercisedOnScreens.length, `area ${area.id}`).toBeGreaterThan(0);
    }
  });
});

describe("Playboard 레지스트리 무결성 — implemented → 근거(evidence) 필수", () => {
  it("status=implemented 기술항목은 evidence 보유", () => {
    for (const tech of TECH_ITEMS) {
      if (tech.status === "implemented") {
        expect(tech.evidence.length, `tech ${tech.id}`).toBeGreaterThan(0);
      }
    }
  });

  it("status=implemented 제어 항목(AREA_SPECS)은 evidence 보유", () => {
    for (const [areaId, spec] of Object.entries(AREA_SPECS)) {
      for (const control of spec.controls) {
        if (control.status === "implemented") {
          expect(control.evidence.length, `area ${areaId} → "${control.text}"`).toBeGreaterThan(0);
        }
      }
    }
  });

  it("status=implemented 화면 스펙 항목은 evidence 보유 (na/gap 제외)", () => {
    for (const [screenId, spec] of Object.entries(SCREEN_SPECS)) {
      const items = [...spec.requirements, ...spec.gates, ...spec.dataContracts, ...spec.exceptions];
      for (const item of items) {
        const status = item.status ?? "implemented"; // 기본 implemented
        if (status === "implemented") {
          expect(item.evidence.length, `spec ${screenId} → "${item.text}"`).toBeGreaterThan(0);
        }
      }
    }
  });
});

describe("Playboard 레지스트리 무결성 — evidence 경로 실재 (문서·코드)", () => {
  // 모든 evidence 의 파일 경로가 실재하는지 — '거짓 근거' 방지. (skill §10 위성 문서 경로 실재)
  function collectEvidence(): { ref: string; path: string }[] {
    const out: { ref: string; path: string }[] = [];
    for (const tech of TECH_ITEMS) {
      tech.evidence.forEach((e) => out.push({ ref: `tech ${tech.id}`, path: e }));
    }
    for (const [areaId, spec] of Object.entries(AREA_SPECS)) {
      spec.controls.forEach((c) => c.evidence.forEach((e) => out.push({ ref: `area ${areaId}`, path: e })));
    }
    for (const [screenId, spec] of Object.entries(SCREEN_SPECS)) {
      const items = [...spec.requirements, ...spec.gates, ...spec.dataContracts, ...spec.exceptions];
      items.forEach((i) => i.evidence.forEach((e) => out.push({ ref: `spec ${screenId}`, path: e })));
    }
    return out;
  }

  it("모든 evidence 파일 경로 실재", () => {
    for (const { ref, path } of collectEvidence()) {
      expect(existsSync(resolveRepoPath(pathPart(path))), `${ref} → ${path}`).toBe(true);
    }
  });

  it("화면 스크린샷(있으면) 캡처 파일 실재", () => {
    for (const screen of SCREENS) {
      const shots = [screen.screenshot, ...(screen.altScreenshots ?? [])].filter(Boolean) as string[];
      for (const shot of shots) {
        expect(existsSync(resolveRepoPath(shot)), `screen ${screen.id} → ${shot}`).toBe(true);
      }
    }
  });
});

describe("Playboard 파생 — 커버리지 매트릭스 정합", () => {
  it("buildCoverageMatrix 셀 수 = 영역 × 화면", () => {
    const cells = buildCoverageMatrix();
    expect(cells.length).toBe(CRITICAL_AREAS.length * SCREENS.length);
  });

  it("매트릭스의 exercised 셀은 CRITICAL_AREAS.exercisedOnScreens 와 일치 (이중 정의 없음)", () => {
    const cells = buildCoverageMatrix();
    for (const cell of cells) {
      const area = CRITICAL_AREAS.find((a) => a.id === cell.area)!;
      expect(cell.exercised).toBe(area.exercisedOnScreens.includes(cell.screen));
    }
  });
});
