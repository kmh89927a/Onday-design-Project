import Script from "next/script";

// GA4 gtag 마운트 (S2, T-APP-A) — 무의존 next/script(라이브러리 추가 0).
// ★ env-guarded: NEXT_PUBLIC_GA_MEASUREMENT_ID 미설정 시 렌더 0(= gtag 미로딩 → gaEvent noop → 회귀 0).
// ★ 가이드 §0 경고대로 — GA4 콘솔의 수동 설치 스니펫을 붙여넣지 않고 여기서 한 번만 로드(중복 로딩 0).
// ★ dev(비-production)에선 debug_mode ON → GA4 DebugView 에 실시간 도착 확인 가능.
// ★ 서버 컴포넌트(layout)에서 렌더 — map 의 useKakaoLoader 와 달리 dynamic ssr:false 가 아니라 next/script 정상 동작.

export function GoogleAnalytics() {
  const id = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  if (!id) return null; // 키 없으면 마운트 0 — 안전 기본값(GA4만 꺼짐)

  const debug = process.env.NODE_ENV !== "production";

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${id}`} strategy="afterInteractive" />
      <Script id="ga4-init" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${id}',{debug_mode:${debug}});`}
      </Script>
    </>
  );
}
