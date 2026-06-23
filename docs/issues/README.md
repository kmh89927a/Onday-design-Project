# 로깅 후속 작업 — GitHub 이슈 초안 (발행 대기)

> ★ 이 폴더의 `.md`는 **이슈 초안**입니다. **GitHub 발행은 사용자가 직접** 합니다(클로드코드 자동 발행 금지).
> 근거: `EVENT_LOGGER_UTM_PLAN.md` 로드맵 + `LOG_IMPLEMENTATION_OUTLINE.md §5 갭`.

| 초안 | 우선순위 | 발표 전/후 | 상태 |
|------|----------|-----------|------|
| [dashboard-insights.md](dashboard-insights.md) | 🟢 높음 | **발표 전** | Draft PR 구현됨(`/playboard/insights`) |
| [cron-aggregation.md](cron-aggregation.md) | 🟡 중 | 발표 후 | 미구현(설계만) |
| [share-link-signup.md](share-link-signup.md) | ⚪ 낮음 | 발표 후 | 미배선(attribution 갭) |
| [distinct-normalization.md](distinct-normalization.md) | ⚪ 낮음 | 발표 후 | 미구현 |

**발행 순서 제안:** dashboard(구현 완료→PR 연결) → cron → distinct → share_signup.
