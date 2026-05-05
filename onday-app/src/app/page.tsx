import { redirect } from "next/navigation";

// 루트는 랜딩페이지로 즉시 이동.
// 랜딩페이지 CTA → /login → /diagnosis 흐름.
// 컴포넌트 시연 페이지는 /dev로 분리되어 있다.
export default function RootPage() {
  redirect("/landing");
}
