"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { GraduationCap, Eye, EyeOff } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TurnstileWidget, TURNSTILE_ENABLED } from "@/components/TurnstileWidget";
import { EmailCodeInput } from "@/components/EmailCodeInput";
import { useAuthStore } from "@/stores/auth-store";

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading, error, setError } = useAuthStore();
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    nickname: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [emailCode, setEmailCode] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLocalError(null);

    if (form.password !== form.confirmPassword) {
      setLocalError("两次输入的密码不一致");
      return;
    }
    if (form.password.length < 6) {
      setLocalError("密码长度至少6位");
      return;
    }

    try {
      await register({
        username: form.username,
        email: form.email,
        password: form.password,
        nickname: form.nickname || undefined,
        emailCode,
        turnstileToken,
      });
      router.push("/dashboard");
    } catch {
      // error is set in the store
    }
  };

  const displayError = localError || error;

  return (
    <div className="flex flex-col items-center gap-8 px-4">
      {/* Branding */}
      <div className="flex flex-col items-center gap-3">
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/25">
          <GraduationCap className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white">11408 考研学习平台</h1>
        <p className="text-gray-400 text-sm">创建账号，开始备考之旅</p>
      </div>

      {/* Register card */}
      <Card className="w-full max-w-md border-white/[0.08] bg-[#111118]/80 backdrop-blur-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">注册</CardTitle>
          <CardDescription>填写信息创建新账号</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {displayError && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {displayError}
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">用户名</label>
              <Input
                type="text"
                placeholder="请输入用户名"
                value={form.username}
                onChange={(e) => updateField("username", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">邮箱</label>
              <Input
                type="email"
                placeholder="请输入邮箱"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                required
              />
            </div>
            <EmailCodeInput email={form.email} value={emailCode} onChange={setEmailCode} />
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">昵称（选填）</label>
              <Input
                type="text"
                placeholder="请输入昵称"
                value={form.nickname}
                onChange={(e) => updateField("nickname", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">密码</label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="请输入密码（至少6位）"
                  value={form.password}
                  onChange={(e) => updateField("password", e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">确认密码</label>
              <Input
                type="password"
                placeholder="请再次输入密码"
                value={form.confirmPassword}
                onChange={(e) => updateField("confirmPassword", e.target.value)}
                required
              />
            </div>
            <TurnstileWidget onToken={setTurnstileToken} />
            <Button
              type="submit"
              className="w-full"
              disabled={
                isLoading ||
                emailCode.length !== 6 ||
                (TURNSTILE_ENABLED && !turnstileToken)
              }
            >
              {isLoading ? "注册中..." : "注册"}
            </Button>
          </form>
          <div className="mt-6 text-center text-sm text-gray-400">
            已有账号？{" "}
            <Link href="/login" className="text-blue-400 hover:text-blue-300 transition-colors">
              立即登录
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
