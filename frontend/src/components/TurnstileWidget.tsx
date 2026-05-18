"use client";

import { Turnstile } from "@marsidev/react-turnstile";

// 单一来源:父组件 disabled 守卫直接复用,避免三处重复 env 读取。
export const TURNSTILE_ENABLED = !!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

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
