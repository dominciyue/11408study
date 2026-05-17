"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { PomodoroFab } from "@/components/pomodoro/pomodoro-fab";
import { useAuthStore } from "@/stores/auth-store";
import { isAuthenticated } from "@/lib/auth";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const loadUser = useAuthStore((s) => s.loadUser);
  const user = useAuthStore((s) => s.user);

  // C2: 路由守卫 — 未登录直接踢回 /login，并把目的地写 redirect 参数让登录后回来
  useEffect(() => {
    if (!isAuthenticated()) {
      const target = encodeURIComponent(pathname || "/dashboard");
      router.replace(`/login?redirect=${target}`);
    }
  }, [pathname, router]);

  // C1: token 在 localStorage 但 store user 为空时（硬刷新场景）拉一次 /auth/me
  // 让 Header/Sidebar 头像、dashboard "你好，X" 等正确显示用户名。
  useEffect(() => {
    if (!user && isAuthenticated()) {
      void loadUser();
    }
  }, [user, loadUser]);

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
      <PomodoroFab />
    </div>
  );
}
