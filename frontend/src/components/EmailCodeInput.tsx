"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { authApi } from "@/lib/api";

interface Props {
  email: string;
  value: string;
  onChange: (v: string) => void;
}

const COOLDOWN_SECONDS = 60;

export function EmailCodeInput({ email, value, onChange }: Props) {
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (tickRef.current) clearInterval(tickRef.current); }, []);

  const send = async () => {
    setError(null);
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setError("请先填写正确的邮箱");
      return;
    }
    setSending(true);
    try {
      await authApi.sendEmailCode(email);
      setCooldown(COOLDOWN_SECONDS);
      tickRef.current = setInterval(() => {
        setCooldown((c) => {
          if (c <= 1 && tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
          return c - 1;
        });
      }, 1000);
    } catch (e: unknown) {
      setError((e as { message?: string })?.message || "发送失败,请稍后重试");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-300">邮箱验证码</label>
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="6 位验证码"
          inputMode="numeric"
          maxLength={6}
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))}
          required
        />
        <Button
          type="button"
          variant="outline"
          disabled={sending || cooldown > 0}
          onClick={send}
          className="shrink-0"
        >
          {cooldown > 0 ? `${cooldown}s` : sending ? "发送中..." : "发送验证码"}
        </Button>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
