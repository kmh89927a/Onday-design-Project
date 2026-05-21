// ──────────────────────────────────────────────
// MOCK-002 ShareLink 도메인 — 4 시나리오 (유효 / 만료 / 비밀번호 / 미리보기 소진).
//
// ★ MOCK-001과 다른 도메인 특성 = 가이드 § adaptive 입증:
//   - MOCK-001 (Diagnosis): POST CreateDiagnosisResponse 시나리오 4 + GET GetDiagnosisResponse 1 → POST/GET 분리 (get-diagnosis.ts 별도)
//   - ★ MOCK-002 (ShareLink): POST + GET + Meta 가 같은 시나리오 안에서 3 객체 통합 → 시나리오 기반 통합 + 에러 별도 (errors.ts)
//
// ★ 결정론적 가드 (AC-5): Math.random / Date.now / new Date 0건. 모든 id / expiresAt / uniqueUrl 고정값.
// ──────────────────────────────────────────────

import type {
  CreateShareLinkResponse,
  GetReportResponse,
  ShareLinkMetaDTO,
} from '@/lib/types/share-link';
import {
  MOCK_DATA_SOURCES,
  MOCK_REPORT_NORMAL,
  MOCK_REPORT_PREVIEW_USED,
} from './report-data';

// ──────────────────────────────────────────────
// 1. 시나리오: 유효 공유 링크 (비밀번호 없음) — REQ-FUNC-009/011 (UI-006/007 base)
// ──────────────────────────────────────────────

export const MOCK_CREATE_SHARE_LINK_VALID = {
  shareUrl: 'https://onday-prototype-claude-design.vercel.app/share/mock-token-001',
  expiresAt: '2026-06-20T10:00:00.000Z',
  hasPassword: false,
} satisfies CreateShareLinkResponse;

export const MOCK_SHARE_LINK_META_VALID = {
  id: 'mock-share-001',
  uniqueUrl: 'mock-token-001',
  viewCount: 3,
  expiresAt: '2026-06-20T10:00:00.000Z',
  isExpired: false,
  hasPassword: false,
  freePreviewUsed: false,
} satisfies ShareLinkMetaDTO;

export const MOCK_GET_REPORT_VALID = {
  report: MOCK_REPORT_NORMAL,
  sources: [...MOCK_DATA_SOURCES],
  shareLink: MOCK_SHARE_LINK_META_VALID,
} satisfies GetReportResponse;

// ──────────────────────────────────────────────
// 2. 시나리오: 만료 공유 링크 — REQ-FUNC-010 (1초 안내 + 재생성 푸시)
//    expiresAt 과거 고정 + isExpired: true (REQ-NF-021 개인정보 분리 = report null 결정은 CMD-SHARE-003 위임)
// ──────────────────────────────────────────────

export const MOCK_SHARE_LINK_META_EXPIRED = {
  id: 'mock-share-002',
  uniqueUrl: 'mock-token-expired-001',
  viewCount: 15,
  expiresAt: '2026-03-01T10:00:00.000Z',
  isExpired: true,
  hasPassword: false,
  freePreviewUsed: true,
} satisfies ShareLinkMetaDTO;

// ──────────────────────────────────────────────
// 3. 시나리오: 비밀번호 설정 공유 링크 — REQ-NF-020 (열람 비밀번호 옵션)
//    hasPassword: true + viewCount 0 (입장 전) + bcrypt 검증 = CMD-SHARE-004 위임
// ──────────────────────────────────────────────

export const MOCK_SHARE_LINK_META_PASSWORD = {
  id: 'mock-share-003',
  uniqueUrl: 'mock-token-pw-001',
  viewCount: 0,
  expiresAt: '2026-06-20T10:00:00.000Z',
  isExpired: false,
  hasPassword: true,
  freePreviewUsed: false,
} satisfies ShareLinkMetaDTO;

export const MOCK_CREATE_SHARE_LINK_PASSWORD = {
  shareUrl: 'https://onday-prototype-claude-design.vercel.app/share/mock-token-pw-001',
  expiresAt: '2026-06-20T10:00:00.000Z',
  hasPassword: true,
} satisfies CreateShareLinkResponse;

// ──────────────────────────────────────────────
// 4. 시나리오: 무료 미리보기 소진 — REQ-FUNC-014 (유료 전환 유도 모달, UI-008)
// ──────────────────────────────────────────────

export const MOCK_GET_REPORT_PREVIEW_EXHAUSTED = {
  report: MOCK_REPORT_PREVIEW_USED,
  sources: [...MOCK_DATA_SOURCES],
  shareLink: { ...MOCK_SHARE_LINK_META_VALID, freePreviewUsed: true },
} satisfies GetReportResponse;
