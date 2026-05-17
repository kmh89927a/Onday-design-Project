---
name: grill-me
description: GitHub Issue 착수 전, 작업 방향이 확정될 때까지 끈질기게 인터뷰. 사용자 승인 전 코드 작성 금지. "grill me" 또는 태스크 시작 시 사용.
argument-hint: <issue-number>
---

## 컨텍스트 로딩 (질문 생성 전 필수)

- $ARGUMENTS 의 Issue 를 `gh issue view` 로 읽기
- 그 Issue 의 개별 명세 `tasks/{TASK_ID}.md` 읽기
- `06_TASK_LIST_v1.3.md` 에서 이 태스크의 선행 의존성 확인
- `AGENTS.md` / `CLAUDE.md` 의 OnDay 기술 제약 인지:
  Next.js 단일 풀스택, Server Actions/Route Handlers, Prisma+Supabase, Vercel 무료 10s timeout, 1인 MVP, 수도권 한정

## 인터뷰 원칙 (원본 grill-me 정신)

- 이 태스크가 완전히 명확해질 때까지 끈질기게 인터뷰한다.
- 디자인 결정 트리의 각 분기를 따라가며, 결정 간 의존성을 하나씩 해소한다.
- 질문은 한 번에 하나씩.
- 각 질문마다 반드시 "내 추천 답변 + 근거"를 함께 제시한다.
- 코드베이스나 명세 파일을 보면 답할 수 있는 질문은, 사용자에게 묻지 말고 직접 확인한다.
- 질문 개수를 미리 정하지 않는다. 이 태스크에서 모호한 지점만큼 묻는다 (적으면 2~3개, 복잡하면 더).
- 단, OnDay 제약(특히 Vercel 10s timeout, Server Action vs Route Handler 선택, 선행 태스크 산출물 준비 여부)에서 리스크가 보이면 반드시 그 분기를 질문에 포함한다.

## 종료 조건 (엄수)

- 모든 분기가 해소되면, 합의된 작업 계획을 요약 제시한다.
- 사용자가 명시적으로 승인("작업 시작" 등)하기 전까지 어떤 코드도 작성하지 않고, 파일도 수정하지 않는다.
- 승인 후에만 착수한다.

## 사용 예시

`/grill-me 1`   → Issue #1 (INFRA-001) 착수 전 grill
