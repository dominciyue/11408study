"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { GraduationCap, Eye, EyeOff } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth-store";

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, error, setError } = useAuthStore();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login({ username, password });
      router.push("/dashboard");
    } catch {
      // error is set in the store
    }
  };

  return (
    <div className="flex flex-col items-center gap-8 px-4">
      {/* Branding */}
      <div className="flex flex-col items-center gap-3">
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/25">
          <GraduationCap className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white">11408 考研学习平台</h1>
        <p className="text-gray-400 text-sm">交互式学习，高效备考</p>
      </div>

      {/* Login card */}
      <Card className="w-full max-w-md border-white/[0.08] bg-[#111118]/80 backdrop-blur-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">登录</CardTitle>
          <CardDescription>输入账号密码开始学习</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">用户名</label>
              <Input
                type="text"
                placeholder="请输入用户名"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">密码</label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="请输入密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "登录中..." : "登录"}
            </Button>
          </form>
          <div className="mt-6 text-center text-sm text-gray-400">
            还没有账号？{" "}
            <Link href="/register" className="text-blue-400 hover:text-blue-300 transition-colors">
              立即注册
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
