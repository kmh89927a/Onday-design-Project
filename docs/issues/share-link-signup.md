---
title: "feat(logging): share_link_signup — 공유 경유 2nd 유저 가입 attribution"
labels: [enhancement, observability, deferred]
priority: ⚪ 낮음 (발표 후)
status: 미배선 — attribution 연결 없음 (G3)
---

## 배경
Referral 퍼널의 마지막 단계 `share_link_signup`(공유 링크 경유 → 2nd 유저 가입)이 **유일한 미배선 이벤트**. `/share/[uuid]` → `/login` CTA에 **attribution 연결이 없어** 측정 불가(`AARRR_NSM_PROPOSAL.md:174`, `LOG_IMPLEMENTATION_OUTLINE.md §1·§5`). REQ-NF-029(2nd 유저 전환율 ≥15%) 충족용.

## 작업 (설계 후보)
- 공유 링크에 attribution 식별자 전파(쿠키 없이 — sessionStorage `via_share` 또는 `/login?via=share` 쿼리).
- `login_entered` 발화 시 `via_share` 여부를 `method` 외 속성으로 기록(PII 0 유지).
- 또는 별도 `share_link_signup` 이벤트 신설.

## ★ 미해결 (창작 금지)
- 현재 share→login 경로에 식별자 전파 코드가 **없음**. UTM(first-touch)과 유사 패턴으로 설계 필요하나, 공유 토큰(uniqueUrl)을 식별자로 쓰면 PII 위험 → 익명 플래그만.

## 수용 기준 (AC)
- [ ] 공유 경유 가입을 익명으로 식별(공유 토큰·개인정보 미노출).
- [ ] `share_link_clicked → signup` 전환율 산출 가능.
- [ ] 직접 가입(비공유)과 구분.

## 의존
- UTM first-touch 패턴([utm-session.ts]) 재사용 검토.
