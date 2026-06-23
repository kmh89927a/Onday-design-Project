import { NextResponse } from "next/server";
import { z } from "zod";
import { logEvent } from "@/lib/logging/log-event-server";

// POST /api/events — 상세 로그 수집기 (로거 1단계 토대).
// ★ best-effort 계약: 검증 실패·DB 실패 무관 항상 204(클라 logEvent 는 응답 안 봄).
// ★ PII 0 — 화이트리스트 enum + .strip() 으로 미정의 키 전부 drop(주소·토큰 들어와도 버림).
// ★ event_name 은 ✅완비 11종 enum 으로 강제(알 수 없는 이벤트·남용 차단).

const EVENT_NAMES = [
  "landing_viewed",
  "login_entered",
  "diagnosis_input_viewed",
  "address_verified",
  "diagnosis_submit_clicked",
  "diagnosis_started",
  "diagnosis_completed",
  "share_link_created",
  "share_link_clicked",
  "saved_search_loaded",
  "deadline_mode_activated",
] as const;

const eventSchema = z
  .object({
    eventName: z.enum(EVENT_NAMES),
    mode: z.enum(["couple", "single"]).optional(),
    method: z.enum(["kakao", "guest", "reviewer"]).optional(),
    count: z.union([z.literal(1), z.literal(2)]).optional(),
    daysLeft: z.number().int().optional(),
    diagnosisId: z.string().max(64).optional(),
    visitorId: z.string().max(64).optional(),
    props: z.string().max(500).optional(), // utm JSON (2단계) — 아래 sanitize 로 utm 5종만 통과
  })
  .strip();

// ★ PII 0 강제 — props 에서 utm 표준 5종만 남김(클라 무관하게 외부 POST 도 차단).
const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"] as const;
function sanitizeProps(props?: string): string | null {
  if (!props) return null;
  try {
    const obj = JSON.parse(props) as Record<string, unknown>;
    const clean: Record<string, string> = {};
    for (const k of UTM_KEYS) {
      if (typeof obj[k] === "string") clean[k] = (obj[k] as string).slice(0, 200);
    }
    return Object.keys(clean).length ? JSON.stringify(clean) : null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = eventSchema.safeParse(body);
    if (parsed.success) {
      await logEvent({ ...parsed.data, props: sanitizeProps(parsed.data.props) });
    }
  } catch {
    // best-effort — 파싱·검증·insert 실패 무관. 항상 204.
  }
  return new NextResponse(null, { status: 204 });
}
