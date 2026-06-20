# AGENT_ARBITRARY_DECISIONS.md

`DESIGN.md` 추출 과정에서 **코드만으로 판단이 갈리는 항목**의 결정·사유·근거를 기록한다.
원칙: **코드가 SSoT**. 추측·창작 금지, 드리프트/이원화는 "기록"만 하고 코드는 건드리지 않는다.

| # | 항목 | 결정 | 사유 | 근거(file:line) |
|---|---|---|---|---|
| 1 | **안전등급 색 이원화** | **용도별 2종 유지**: SafetyBar 등 = solid `--safety-a~d`, 뱃지 = 파스텔 `grade-a~d`. DESIGN.md에 "2종 병존"으로 명시, 통합 안 함. | 현 코드가 실제로 두 소스를 용도별로 사용 중. 단일화는 코드 변경 동반이라 문서 추출 범위 밖. | solid: `src/app/globals.css:52-55` / 파스텔: `src/components/ui/badge.tsx:36-39` |
| 2 | **hex vs hsl 표기** | **구현 hsl 을 정본**으로, 일부는 참고 hex 병기(원본 스펙 `design-input/design-tokens.md` 에 기재된 것만). | 코드(globals.css)는 hsl 만 보유. hex 는 원본 스펙에만 있어 "참고"로만 병기, 임의 변환값 창작 안 함. | hsl: `globals.css:8-110` / 참고 hex: `design-input/design-tokens.md §1.4` |
| 3 | **타이포 weight 드리프트** | **구현값 정본** (`title` = 600). 원본 스펙의 `title-md 800` 은 채택 안 함. | 코드가 SSoT. 스펙은 구현 이전(4월) 버전이라 드리프트. | 구현: `tailwind.config.ts:132` (`title 16px … 600`) / 스펙: `design-input/design-tokens.md §2.2` |
| 4 | **다크모드** | **"reserved(미사용, light-only)"** 로 명시. 토큰 표에는 light 값만, 다크는 부록에 reserved 표기. | `globals.css` 에 `.dark` 정의가 있으나 주석이 "light-only design" 이고 앱은 라이트 전용. | `globals.css:112-127` (`.dark` + "light-only design" 주석) |
| 5 | **인라인 색**(마커·버튼 disabled·badge grade) | **현황 기록만**. 토큰화(코드 변경) 미실시. DESIGN.md "흩어진 값" 절에 위치만 명시. | 문서 추출 범위 — 코드 무변경 원칙. 토큰화는 별도 리팩터 작업. | 마커 `src/components/map/map-canvas-kakao.tsx:43-47` / 버튼 disabled `src/components/ui/button.tsx:27` (`hsl(220 30% 84%)`) / badge grade `badge.tsx:36-39` |
| 6 | **레퍼런스 컴포넌트 범위** | **실제 구현된 핵심만** (Button·Badge·Card·Input·Sheet·CandidateCard·SafetyGradeBadge). 원본 스펙 31개 전부 아님. | 31개 스펙(`components-spec.md §01-31`)은 설계 의도. DESIGN.md 는 "재현 가능한 실구현"이 목적이라 구현체 기준. | 구현: `src/components/ui/*` + `src/components/{card,data}/*` / 스펙: `design-input/components-spec.md` |

> 위 결정들은 **코드 현황을 기록**한 것이며, 통합·토큰화·드리프트 해소가 필요하면 별도 코드 변경 PR로 다룬다(본 문서/PR 범위 밖).
