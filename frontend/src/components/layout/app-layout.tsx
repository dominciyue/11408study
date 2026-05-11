"use client";

import React from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { PomodoroFab } from "@/components/pomodoro/pomodoro-fab";

export function AppLayout({ children }: { children: React.ReactNode }) {
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
