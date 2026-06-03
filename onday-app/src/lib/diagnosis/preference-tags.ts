// 선호 태그(⑥) 메타데이터 — 입력 폼·배너·근거가 공유하는 단일 진리.
//   key는 scoreCandidate priorityBonus 와 일치(점수 가중).
export interface PreferenceTag {
  key: string; // "safety" | "convenience" | "hotplace"
  label: string; // "#안심귀가"
}

export const PREFERENCE_TAGS: PreferenceTag[] = [
  { key: "safety", label: "#안심귀가" },
  { key: "convenience", label: "#슬세권" },
  { key: "hotplace", label: "#핫플" },
];

export function getPreferenceTag(key?: string): PreferenceTag | undefined {
  return key ? PREFERENCE_TAGS.find((t) => t.key === key) : undefined;
}
