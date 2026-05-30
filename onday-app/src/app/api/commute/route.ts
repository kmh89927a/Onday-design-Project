import { NextResponse } from "next/server";
import { OdsayTransitClient } from "@/lib/external/odsay-transit";

// ★ B2 얇은 프록시 — 클라가 동네별로 Promise.all 로 호출. 함수당 ODsay 1회라
//   Vercel 10초 timeout 무관 (REQ-FUNC-003). ODsay Server key 는 서버에서만 사용.
// GET /api/commute?olat=&olng=&dlat=&dlng=  → { commute: CommuteInfo }
const ODSAY_API_KEY = process.env.ODSAY_API_KEY ?? "";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const olat = Number(searchParams.get("olat"));
  const olng = Number(searchParams.get("olng"));
  const dlat = Number(searchParams.get("dlat"));
  const dlng = Number(searchParams.get("dlng"));

  if ([olat, olng, dlat, dlng].some((n) => Number.isNaN(n))) {
    return NextResponse.json({ error: "좌표가 올바르지 않습니다" }, { status: 400 });
  }
  if (!ODSAY_API_KEY) {
    return NextResponse.json({ error: "ODSAY_API_KEY 미설정" }, { status: 503 });
  }

  try {
    const client = new OdsayTransitClient({ apiKey: ODSAY_API_KEY });
    const commute = await client.getTransitCommute(
      { lat: olat, lng: olng },
      { lat: dlat, lng: dlng },
    );
    return NextResponse.json({ commute });
  } catch (error) {
    // 경로 없음/ODsay 에러 → 클라가 해당 동네를 후보에서 제외하도록 404.
    console.error("[API] GET /api/commute error:", error);
    return NextResponse.json({ error: "대중교통 경로를 찾을 수 없습니다" }, { status: 404 });
  }
}
