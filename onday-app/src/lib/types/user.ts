// schema.prisma 의 authProvider / mode 는 SQLite enum 미지원으로 String 타입.
// TS 레벨 union 으로 좁혀 타입 안전성 제공. 실 Prisma enum = INFRA-002 시점.

export type AuthProviderType = 'kakao' | 'naver';
export type ServiceModeType = 'couple' | 'single';

export interface UserDTO {
  id: string;
  email: string;
  authProvider: AuthProviderType;
  mode: ServiceModeType;
  createdAt: Date;
  updatedAt: Date;
}
