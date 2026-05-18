"use client";

import { Turnstile } from "@marsidev/react-turnstile";

interface Props {
  onToken: (token: string) => void;
  onExpire?: () => void;
}

export function TurnstileWidget({ onToken, onExpire }: Props) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  if (!siteKey) {
    // dev/未配置时不阻塞表单
    return null;
  }
  return (
    <Turnstile
      siteKey={siteKey}
      options={{ theme: "dark", size: "flexible" }}
      onSuccess={onToken}
      onExpire={() => {
        onToken("");
        onExpire?.();
      }}
      onError={() => onToken("")}
    />
  );
}
