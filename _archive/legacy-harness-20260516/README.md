# Legacy Harness Archive — 2026-05-16

## 보존 사유

이 디렉토리는 OnDay (동네궁합진단기) 프로젝트와 **무관한 이전 강의 자료·다른 프로젝트의 잔재**를 보존한다.

`docs/HARNESS_AUDIT_v1.0.md` (2026-05-16) 의 결과에 따라 **Phase 2-A SSoT 정립 작업** 진행 시 원본 위치(`AGENTS.md`, `CLAUDE.md`, `.agents/rules/`, `.cursor/rules/`)의 콘텐츠를 OnDay 정합 콘텐츠로 전면 교체하면서, 학습 흔적 보존을 위해 archive 처리되었다.

## ⚠️ AI 에이전트 참조 금지

본 디렉토리의 모든 파일은 **AI 에이전트(Claude Code, Cursor, Gemini CLI, Antigravity 등)가 컨텍스트로 로드해서는 안 된다.** 본 콘텐츠를 참조하여 코드를 생성할 경우 OnDay 프로젝트의 PRD/SRS 와 정반대 방향의 결과물이 나온다.

본 폴더는 `_archive/` prefix 로 시작하므로 일반적인 harness 자동 로드 대상에서 제외되지만, 보안을 위해 다음 사항을 추가로 확인할 것:

- `.gitignore` 또는 harness 별 설정에 `_archive/` 제외 규칙 명시
- AI 도구의 컨텍스트 디렉토리 설정에서 본 폴더가 포함되지 않았는지 확인

## 내용물

본 archive 에는 다음 3가지 서로 다른 이전 프로젝트의 콘텐츠가 혼재되어 있다:

| 잔재 흔적 | 추정 원본 프로젝트 |
| --- | --- |
| "Submission Wizard", "Financial Auto-Engine", "PMF Diagnostic", "HWP/PDF Export", "BusinessPlan" 엔터티 | AI Co-Pilot for First-time Founders (사업계획서 작성 서비스) |
| `group = 'com.pollosseum'` 등 | "Pollosseum" 프로젝트 (강의용 가칭) |
| Thymeleaf + Redis + Kafka + Hugging Face/OpenAI 스택 | "Spring 전통 풀스택" (가칭) |

### 파일 구조

```
_archive/legacy-harness-20260516/
├── README.md                          # 본 파일
├── AGENTS.md                          # 구 AGENTS.md (Founders Co-Pilot 콘텐츠)
├── CLAUDE.md                          # 구 CLAUDE.md (Spring+Thymeleaf+Redis+Kafka)
├── .agents-rules/                     # 구 .agents/rules/ 백업 (prefix dot 제거)
│   ├── 001-project-overview.md        # 비어있던 템플릿 ([PROJECT NAME] 미치환)
│   ├── 002-tech-stack.md              # Spring Boot 4.0.0 + Java 21 + Python FastAPI
│   └── 003-development-guidelines.md  # AI Co-Pilot 개발 가이드
└── .cursor-rules/                     # 구 .cursor/rules/ 백업 (prefix dot 제거)
    ├── 001-project-overview.mdc       # 비어있던 템플릿
    ├── 002-tech-stack.mdc             # Spring + Thymeleaf + Redis + Kafka
    └── 003-development-guidelines.mdc # 짧은 일반 가이드
```

> archive 내부에서 `.agents-rules/` / `.cursor-rules/` 폴더명은 leading dot 를 제거했다 (가시성 + tar/zip 호환). 원본 위치는 여전히 `.agents/rules/` / `.cursor/rules/` 이며, Phase 2-A 에서 그 자리에 신규 OnDay 정합 콘텐츠가 작성된다.

## 후속 작업

- 본 archive 의 콘텐츠는 강의 자료로 재활용될 수 있으나, OnDay 프로젝트 내부에서 직접 참조하지 않는다.
- 본 콘텐츠를 새 프로젝트로 옮겨 재활용하려면, 본 폴더 전체를 다른 저장소로 export 한 뒤 거기서 `[PROJECT NAME]` placeholder 치환부터 시작할 것.
- 본 archive 는 git 추적에 포함시킬 수 있으나, AI 도구의 자동 컨텍스트 로드 범위에서는 명시적으로 제외해야 한다.

## 관련 문서

- 본 archive 결정의 근거: `docs/HARNESS_AUDIT_v1.0.md` §5 Top 10 보강 항목 #1~#4, §6-3 의사결정 포인트 "잘못된 자산 처리"
- OnDay 프로젝트의 SSoT (Single Source of Truth):
  - `docs/00_PRD_v1.1-rev.4.md` (제품 요구사항)
  - `docs/05_SRS_v1.6.md` (소프트웨어 요구사항 명세)
  - 본 archive 처리 이후의 `AGENTS.md` (cross-tool 글로벌 규칙)
