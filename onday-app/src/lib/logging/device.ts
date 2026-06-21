// 디바이스/OS 대분류 (11주차 로깅 토대).
// ★ 프라이버시: 모바일/데스크톱 + OS 대분류만. 상세 모델·버전·해상도·fingerprint 미수집.
//   navigator.userAgent 한 줄에서 대분류만 도출(개인 식별 불가 수준).

export type DeviceKind = "mobile" | "desktop";
export type OsKind = "ios" | "android" | "windows" | "mac" | "other";

const MOBILE_UA = /iphone|ipad|ipod|android|mobile/i;

export function detectDevice(ua: string): DeviceKind {
  return MOBILE_UA.test(ua) ? "mobile" : "desktop";
}

export function detectOs(ua: string): OsKind {
  if (/iphone|ipad|ipod/i.test(ua)) return "ios";
  if (/android/i.test(ua)) return "android";
  if (/windows/i.test(ua)) return "windows";
  if (/macintosh|mac os x/i.test(ua)) return "mac";
  return "other";
}

/** 브라우저 환경에서 device/os 대분류 도출. 서버/UA 부재 시 null(앱 안 깸). */
export function getDeviceInfo(): { device: DeviceKind | null; os: OsKind | null } {
  try {
    if (typeof navigator === "undefined" || !navigator.userAgent) {
      return { device: null, os: null };
    }
    const ua = navigator.userAgent;
    return { device: detectDevice(ua), os: detectOs(ua) };
  } catch {
    return { device: null, os: null };
  }
}
