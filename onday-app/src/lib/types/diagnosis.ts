// schema.prisma 의 status 는 SQLite enum 미지원으로 String 타입 (// processing | completed | expired 주석으로 가능값 명시).
// 본 파일은 TS union 으로 좁혀 타입 안전성 제공. 실 Prisma enum 강제는 INFRA-002 시점 (Postgres swap).
// 본 파일은 DIAGNOSIS 도메인 단일 진입점 — 후속 API-002 가 DiagnosisDTO / CandidateAreaDTO / CommuteInfoDTO 등 DTO 를 본 파일에 append 예정.
// mode 는 user.ts 의 ServiceModeType 재사용 — diagnosis.ts 에서 재정의 금지. API-002 가 DTO 정의 시 `import { ServiceModeType } from './user'` 패턴 사용.

export type DiagnosisStatusType = 'processing' | 'completed' | 'expired';
