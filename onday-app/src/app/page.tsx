import { redirect } from "next/navigation";

// 루트는 랜딩페이지로 즉시 이동.
// 랜딩페이지 CTA → /login → /diagnosis 흐름.
// 컴포넌트 시연 페이지는 /dev로 분리되어 있다.
// ★ utm 등 쿼리스트링 보존 — 마케팅 링크가 루트(/?utm_source=…)를 가리킬 때 유실 방지.
//   쿼리 없으면(직접 유입) /landing 으로만.
export default async function RootPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string") qs.set(key, value);
    else if (Array.isArray(value) && value[0] !== undefined) qs.set(key, value[0]);
  }
  const query = qs.toString();
  redirect(query ? `/landing?${query}` : "/landing");
}
