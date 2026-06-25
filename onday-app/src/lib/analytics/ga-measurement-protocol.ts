// GA4 Measurement Protocol 서버 전송 util (S3, T-APP-B). ★ 서버 전용(GA4_API_SECRET 사용 — 클라 import 금지).
//
// ★★ 격리·미와이어 — 본 util 은 어디서도 호출되지 않는다(라이브 경로 미연결).
//    라이브 이벤트는 여전히 클라 gtag(S2)만 GA4 로 보낸다 → 이중집계 0.
//    이 util 의 용도는 S4(preview 더미 로그 백필) 전용. 향후 진짜 서버 전용 이벤트가 생기면 그때 와이어.
// ★ env-guarded no-op — NEXT_PUBLIC_GA_MEASUREMENT_ID 또는 GA4_API_SECRET 미설정 시 전송 0(회귀 0).
// ★ best-effort — 네트워크/HTTP 실패해도 throw 0(결과 객체로만 보고). PII 0 — 호출부가 비식별 속성 + 익명 client_id 만 전달.

const MP_ENDPOINT = "https://www.google-analytics.com/mp/collect";
const MP_DEBUG_ENDPOINT = "https://www.google-analytics.com/debug/mp/collect"; // 검증 메시지 응답(실 적재 안 함)

type GaParams = Record<string, string | number | boolean>;

export interface SendGa4Options {
  // 과거 이벤트 백필용(S4). ★ MP 는 보통 최근 ~72시간 내 timestamp 만 인정 — 그보다 오래된 더미는 누락될 수 있음(S4에서 감안).
  timestampMicros?: number;
  // /debug/mp/collect 로 전송 — 실 적재 대신 검증 메시지(validationMessages)만 응답. 형식 점검용.
  debug?: boolean;
}

export interface SendGa4Result {
  ok: boolean;
  skipped?: "no_measurement_id" | "no_api_secret" | "no_client_id"; // env/입력 미충족 → no-op 사유
  status?: number;
  validationMessages?: unknown; // debug 모드 응답
  error?: string;
}

/**
 * GA4 Measurement Protocol 로 이벤트 1건 전송(서버). env/입력 미충족 시 no-op, 실패해도 throw 0.
 * @param clientId 익명 식별자(예: visitorId 재사용 — PII 0)
 */
export async function sendGa4Event(
  clientId: string,
  name: string,
  params: GaParams = {},
  opts: SendGa4Options = {},
): Promise<SendGa4Result> {
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const apiSecret = process.env.GA4_API_SECRET;
  if (!measurementId) return { ok: false, skipped: "no_measurement_id" };
  if (!apiSecret) return { ok: false, skipped: "no_api_secret" };
  if (!clientId) return { ok: false, skipped: "no_client_id" };

  const endpoint = opts.debug ? MP_DEBUG_ENDPOINT : MP_ENDPOINT;
  const url = `${endpoint}?measurement_id=${encodeURIComponent(measurementId)}&api_secret=${encodeURIComponent(apiSecret)}`;

  const body: Record<string, unknown> = { client_id: clientId, events: [{ name, params }] };
  if (opts.timestampMicros !== undefined) body.timestamp_micros = opts.timestampMicros;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    // 비-debug: 성공 시 204(본문 없음). debug: 200 + 검증 메시지 JSON.
    if (opts.debug) {
      const json = await res.json().catch(() => undefined);
      return { ok: res.ok, status: res.status, validationMessages: json };
    }
    return { ok: res.ok, status: res.status };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
