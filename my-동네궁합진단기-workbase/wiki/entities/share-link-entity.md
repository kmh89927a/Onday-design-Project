---
title: "ShareLink 엔터티"
category: entities
tags: [데이터, mvp]
sources: [src-srs]
created: 2026-04-23
updated: 2026-04-26
status: active
---

> **변경 이력:** 2026-04-26 — SRS v1.6 / TASK_LIST v1.3 반영. AES-256 암호화 필드/결제 관련 메타데이터 제거. ShareLink 모델 간소화: id, diagnosisId, uuid(UUID v4), passwordHash(bcrypt 12, optional), expiresAt(+30일), createdAt. 무료 미리보기 1곳 분리 로직(splitForPreview) 반영.

# ShareLink — 공유 링크 엔터티

## 정의

진단 결과를 배우자(비회원)에게 공유하기 위한 URL 토큰. UUID v4 기반이며, 30일 만료 정책을 가짐. 서비스의 바이럴 루프에서 핵심 역할.

## 속성 (Prisma Schema — DB-004)

| 필드 | 타입 | 설명 |
|---|---|---|
| `id` | UUID (PK) | 링크 고유 ID |
| `diagnosisId` | UUID (FK → Diagnosis) | 대상 진단 |
| `uuid` | String (unique) | UUID v4 토큰 (entropy ≥ 128bit) |
| `passwordHash` | String? | bcrypt 강도 12 해시 (optional) |
| `expiresAt` | DateTime | 만료 시간 (createdAt + 30일) |
| `viewCount` | Int | 열람 횟수 |
| `createdAt` | DateTime | 생성일 |

> ⚠️ v1.6에서 **제거된 필드**: AES-256 암호화 관련 필드, 결제 관련 메타데이터, `freePreviewUsed` (splitForPreview 로직으로 대체)

## 관계

```
Diagnosis 1 ──→ N ShareLink
```

## 비즈니스 규칙

1. **비회원 접근**: 앱 설치 없이 SSR 페이지로 리포트 열람 가능 (REQ-FUNC-011)
2. **무료 미리보기 1곳**: splitForPreview 로직으로 후보 배열에서 1곳 분리 ([[architecture-patterns]])
3. **잠금 후보 ≥2곳**: 비로그인 사용자가 잠금 후보 클릭 시 회원가입 유도 모달 (UI-008)
4. **30일 만료**: 만료 후 개인정보 노출 0건, 재생성 안내 (REQ-FUNC-010)
5. **비밀번호**: optional bcrypt 강도 12 해시 + DUMMY_HASH (Timing Attack 방지)
6. **OG 메타태그**: `generateMetadata()`로 카카오톡 리치 프리뷰 자동 생성

## 관련 태스크

- CMD-SHARE-001: 공유 링크 생성
- CMD-SHARE-002: viewCount 증가
- CMD-SHARE-003: 만료 링크 안내
- CMD-SHARE-004: 비밀번호 검증 (bcrypt)
- QRY-SHARE-001: SSR 공유 리포트 열람

## KPI 연동

- 공유 링크 클릭률 목표: ≥ 40%
- 공유 → 2nd 유저 전환율 목표: ≥ 15%

## 관련 페이지

- Entities: [[diagnosis]], [[user]], [[domain-sharelink]]
- Sources: [[src-srs]], [[src-prd]]
- Concepts: [[share-link]], [[architecture-patterns]], [[srs-v1.6-changes]]
