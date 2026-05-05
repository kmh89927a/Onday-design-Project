---
marp: true
theme: uncover
class: invert
paginate: true
header: '🏠 동네궁합진단기'
footer: '© 2026 동네궁합진단기 — Co-founder Recruiting Deck'
style: |
  :root {
    --color-bg: #0f172a;
    --color-fg: #e2e8f0;
    --color-accent: #38bdf8;
    --color-accent2: #a78bfa;
    --color-highlight: #fbbf24;
  }
  section {
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
    color: var(--color-fg);
    font-family: 'Pretendard', 'Apple SD Gothic Neo', sans-serif;
    font-size: 28px;
    padding: 60px 80px;
  }
  h1 {
    color: var(--color-accent);
    font-size: 2.2em;
    font-weight: 800;
    line-height: 1.3;
  }
  h2 {
    color: var(--color-accent2);
    font-size: 1.5em;
    font-weight: 700;
    border-bottom: 2px solid var(--color-accent2);
    padding-bottom: 8px;
  }
  h3 {
    color: var(--color-highlight);
    font-size: 1.1em;
  }
  strong {
    color: var(--color-highlight);
  }
  em {
    color: var(--color-accent);
    font-style: normal;
  }
  blockquote {
    border-left: 4px solid var(--color-accent);
    background: rgba(56, 189, 248, 0.08);
    padding: 16px 24px;
    border-radius: 8px;
    font-size: 0.95em;
  }
  table {
    font-size: 0.8em;
    width: 100%;
  }
  th {
    background: rgba(167, 139, 250, 0.2);
    color: var(--color-accent2);
  }
  td {
    border-bottom: 1px solid rgba(255,255,255,0.1);
  }
  code {
    background: rgba(56, 189, 248, 0.15);
    color: var(--color-accent);
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 0.9em;
  }
  a {
    color: var(--color-accent);
  }
  header {
    font-size: 0.7em;
    color: rgba(255,255,255,0.4);
  }
  footer {
    font-size: 0.55em;
    color: rgba(255,255,255,0.3);
  }
  section.lead h1 {
    font-size: 2.8em;
    text-align: center;
  }
  section.lead blockquote {
    text-align: center;
    font-size: 1.1em;
  }
  ul {
    line-height: 1.7;
  }
  .columns {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 32px;
  }
---

<!-- _class: lead -->
<!-- _paginate: false -->
<!-- _header: '' -->

# 🏠 동네궁합진단기

> **두 사람의 동선을 동시에 최적화하는**
> **데이터 기반 주거 의사결정 플랫폼**

<br>

### 🚀 Co-founder Recruiting Deck — 2026. Q2

---

## 01 — 우리가 풀려는 문제

> 이사를 앞둔 3040 부부는 **직장·학군·생활 동선**을 동시에 만족하는 동네를 찾을 도구가 없습니다.

<br>

### 🔥 3가지 구조적 문제

| # | 문제 | 현실 |
|---|---|---|
| 1 | **트레이드오프 마비** | 학군 좋은 곳은 직장에서 멀고, 직장 가까운 곳은 학교가 아쉬움 |
| 2 | **정보 과부하** | 학군카페 + 네이버 지도 + 부동산앱 + 통근앱… 평균 **2~3시간** 수동 조합 |
| 3 | **미래 시뮬레이션 불가** | 아이 입학 시점, 전세 만료 등 미래 변수를 직접 계산 불가 |

---

## 02 — 시장 기회: 왜 지금인가?

<div class="columns">
<div>

### 📊 시장 규모

| 레벨 | 규모 |
|---|---|
| **TAM** 글로벌 프롭테크 | ~**$470억** (CAGR 16%) |
| **SAM** 하이퍼로컬 추천 | ~$30-50억 |
| **SOM** 국내 Bottom-up | 연 **60~180억원** |

</div>
<div>

### 🎯 핵심 통계

- 연간 이사 가구: **~800만 건** (수도권 45%)
- 폐업 사유 1위: **입지 선정 실패 25%**
- 두 동선 동시 계산 도구: **전무**
- 정부 창업지원 예산: **3.5조원** (역대 최대)

</div>
</div>

<br>

> 💡 프롭테크 × 하이퍼로컬 × 라이프스타일의 **교차점** — 직접 경쟁자 0

---

## 03 — 솔루션: 동네궁합진단기

> **두 직장 주소만 입력하면, 10분 안에 최적 동네를 찾아주는 서비스**

### 🏗️ 5대 핵심 기능

| # | 기능 | 설명 | AOS 점수 |
|---|---|---|---|
| **F1** | 🗺️ 두 동선 교차 진단 | 양쪽 통근 교집합 최적 동네 산출 | **4.00** (1위) |
| **F2** | 🔗 배우자 공유 링크 | 비회원 열람 + WTP 설문 유도 (바이럴 루프) | 3.04 |
| **F3** | ⏰ 데드라인 모드 | 이사 마감일 역산 타임라인 + 매물 연결 | 3.80 |
| **F4** | 👤 싱글 모드 | 학군 숨김, 치안·편의시설 강조 | — |
| **F5** | 💾 간이 저장 | 입력값 자동 저장 + 불러오기 | — |

---

## 04 — 검증된 사용자 니즈 (JTBD)

### 🎙️ 핵심 Job Statement

> *"아이 학군과 부부 직장 사이에서 고민하는 3040 부부가, **두 사람의 동선을 동시에 최적화하는 동네를 10분 안에 찾아** 이사 스트레스를 해소하고 싶다."*

### 😰 Pain Point 심각도 TOP 5

| 순위 | Pain Point | 심각도 |
|---|---|---|
| 🥇 | 두 동선 동시 계산 도구 부재 | **5.0** |
| 🥈 | 긴급 이사 시 시간 부족 | **5.0** |
| 🥉 | 학원 셔틀 정보 부재 | **5.0** |
| 4 | 정보 분산 (학군/교통/매물 분리) | 4.2 |
| 5 | 배우자 설득 도구 부재 | 4.0 |

> 🔑 의사결정 단위가 **부부** → 한 사람의 납득만으로는 이사가 진행되지 않음

---

## 05 — 기술 아키텍처

### ⚡ "C-TEC" 원칙 — Consolidated Technology

| 레이어 | 기술 | 선택 이유 |
|---|---|---|
| **프레임워크** | Next.js 15 (App Router) | 단일 풀스택 코드베이스 |
| **인증** | Supabase Auth | 카카오/네이버 OAuth, 무료 |
| **DB** | Prisma → SQLite / Supabase PG | Dev/Prod 분리 |
| **UI** | Tailwind CSS v4 + shadcn/ui | 빠른 프로토타이핑 |
| **지도** | react-kakao-maps-sdk | 한국 지도 최적 |
| **교통 API** | 카카오 모빌리티 | 클라이언트 연산 (서버리스 한계 회피) |
| **AI** | Vercel AI SDK + Gemini | 선택적 AI 요약 |
| **배포** | Vercel (무료 티어) | 월 인프라 ≤ **10만원** |

---

## 06 — 사업 로드맵

### 📅 MVP 49일 스프린트 → 시장 검증

| Phase | 내용 | 기간 | 상태 |
|---|---|---|---|
| 0-1 | 환경 설정 + DB/Auth | Day 1~8 | 🔜 |
| 2 | **F1** 두 동선 교차 진단 | Day 9~18 | 🔜 |
| 3 | **F2** 배우자 공유 링크 | Day 19~24 | 🔜 |
| 4 | **F3** 데드라인 모드 | Day 25~30 | 🔜 |
| 5-6 | **F4** 싱글 모드 + **F5** 저장 | Day 31~37 | 🔜 |
| 7-8 | AI 레이어 + 배포 | Day 38~49 | 🔜 |

### 🎯 롤아웃 계획

| 단계 | 시기 | 규모 | 채널 |
|---|---|---|---|
| Alpha | 2026-07 | 10명 | 내부 + 지인 |
| Closed Beta | 2026-08 | 30명 | 맘카페 선발 |
| Open Beta | 2026-09~10 | 300명 | 수도권 3040 |
| **GA** | **2026-11~** | **1,000명/월** | 전체 공개 |

---

## 07 — 찾고 있는 팀원

### 🤝 함께 만들어갈 Co-founder & 핵심 멤버

| 포지션 | 역할 | 우대 역량 |
|---|---|---|
| 🎨 **프론트엔드 개발자** | Next.js + 카카오 지도 UI | React, Tailwind, 지도 SDK 경험 |
| 🛠️ **풀스택 개발자** | Server Actions + Prisma + Supabase | TypeScript, DB 설계, API 연동 |
| 📊 **데이터/알고리즘** | 교통 교차 연산 + 스코어링 | 공간 데이터, 최적화 알고리즘 |
| 📣 **그로스/마케팅** | 맘카페 바이럴 + 커뮤니티 | 3040 타깃 마케팅, 커뮤니티 운영 |
| 🎯 **프로덕트 매니저** | 사용자 리서치 + KPI 관리 | 프롭테크/부동산 도메인 지식 |

<br>

> 💎 **공동 창업자 우대** — 스톡옵션 / 수익 배분 협의 가능

---

## 08 — 왜 지금 합류해야 하는가?

<div class="columns">
<div>

### 🌟 이 기회가 특별한 이유

- 🔵 **블루오션** — 두 동선 동시 계산 도구 전무
- 📈 **$470억 시장** — 프롭테크 CAGR 16%
- 🏛️ **정부 지원** — 창업지원 예산 3.5조
- 🤖 **AI 시대** — Gemini + 공공 데이터 융합

</div>
<div>

### 💪 합류 시 기대할 수 있는 것

- 🚀 **Day 0 팀원** — 초기 멤버로서의 임팩트
- 💰 **공동 창업자** 수준의 보상 구조
- 📚 **15개 기획 문서** 완비 — 즉시 개발 착수 가능
- 🎯 **49일 MVP** — 빠른 시장 검증
- 🌏 **글로벌 확장 가능** — 맞벌이 보편적 니즈

</div>
</div>

<br>

> 🔑 *"PRD, SRS, 태스크 리스트, 페르소나, JTBD — 모든 기획이 완료되었습니다. 이제 함께 만들 사람만 있으면 됩니다."*

---

## 09 — 북극성 KPI & 성공 지표

### 🌟 MVP 성공 = 시장 가설 검증

| KPI | 목표 | 측정 |
|---|---|---|
| 🌟 **진단 완료 수/주** | 50 → **200건/주** | 서버 로그 |
| 📊 WTP 설문 응답률 | ≥ **30%** | Mixpanel |
| 🔗 배우자 공유 링크 클릭률 | ≥ **40%** | ShareLink.viewCount |
| 👥 공유 → 2nd 유저 전환율 | ≥ **15%** | Amplitude |
| ⭐ NPS | ≥ **50** | 설문 |

### ✅ 핵심 성공 요인 (KSF)

1. 🎯 교통 API 정확도 — 통근 시간 예측이 서비스 신뢰의 기반
2. ⚡ 10분 내 결과 도출 — 2~3시간 → 10분 압축
3. 💑 배우자 설득 도구 — 부부 의사결정 단위 돌파
4. 📣 맘카페 바이럴 — 자연스러운 입소문 초기 채널
5. 💵 월 인프라 ≤ 10만원 — 지속 가능한 린 운영

---

<!-- _class: lead -->

# 🤝 함께 만들어요

<br>

> **"800만 가구의 이사 결정을 바꾸는 서비스"**
> **지금 시작합니다.**

<br>

### 📬 연락처

✉️ **이메일**: [your-email@example.com]
💬 **카카오톡**: [오픈채팅 링크]
🔗 **GitHub**: [github.com/your-repo]

<br>

### 🗓️ *커피챗 환영합니다!*
