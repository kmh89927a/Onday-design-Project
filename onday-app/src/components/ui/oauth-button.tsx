import * as React from "react";

import { Button } from "@/components/ui/button";

// components-spec §05 OAuthButton — login 전용
//   provider 'kakao' | 'naver'
//   라벨: kakao → "카카오로 1초 만에 시작" / naver → "네이버로 시작"
//   내부: <Button variant={provider} fullWidth leading={ProviderIcon}>{label}</Button>

const LABELS = {
  kakao: "카카오로 1초 만에 시작",
  naver: "네이버로 시작",
} as const;

interface OAuthButtonProps {
  provider: "kakao" | "naver";
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export function OAuthButton({
  provider,
  onClick,
  disabled,
  loading,
  className,
}: OAuthButtonProps) {
  return (
    <Button
      variant={provider}
      fullWidth
      onClick={onClick}
      disabled={disabled}
      loading={loading}
      aria-label={LABELS[provider]}
      leading={provider === "kakao" ? <KakaoIcon /> : <NaverIcon />}
      className={className}
    >
      {LABELS[provider]}
    </Button>
  );
}

function KakaoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden fill="currentColor">
      <path d="M12 3C6.48 3 2 6.58 2 11c0 2.85 1.86 5.34 4.66 6.78l-1.2 4.4c-.1.34.27.6.56.4l5.2-3.45c.25.02.5.03.78.03 5.52 0 10-3.58 10-8C22 6.58 17.52 3 12 3z" />
    </svg>
  );
}

function NaverIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden fill="currentColor">
      <path d="M16.273 12.845L7.376 0H0v24h7.726V11.156L16.624 24H24V0h-7.727z" />
    </svg>
  );
}
