"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  BookOpen,
  ClipboardCheck,
  Moon,
  Sun,
  LogOut,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/stores/auth-store";
import { useThemeStore } from "@/stores/theme-store";

export function Header() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const theme = useThemeStore((s) => s.theme);
  const hydrated = useThemeStore((s) => s.hydrated);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  // Until the store has hydrated, render the dark icon (matches the SSR
  // assumption) to avoid a hydration mismatch warning.
  const isDark = hydrated ? theme === "dark" : true;

  const [searchQuery, setSearchQuery] = useState("");

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    // 跳转到知识图谱页（默认 408 学科），focusNodeId 暂不解析；
    // 后续若有 /knowledge/search 结果页可改成那里。
    router.push(`/graph?subjectId=4&q=${encodeURIComponent(q)}`);
  }

  return (
    <header className="flex items-center gap-4 h-16 px-6 bg-header backdrop-blur-xl border-b border-border shrink-0 sticky top-0 z-40">
      {/* Search */}
      <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="搜索知识点（回车跳图谱）..."
          className="pl-10 bg-foreground/[0.03] border-border h-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </form>

      <div className="flex-1" />

      {/* Quick actions */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-blue-500 dark:hover:text-blue-400"
          onClick={() => router.push("/study")}
        >
          <BookOpen className="w-4 h-4 mr-1.5" />
          开始学习
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-green-500 dark:hover:text-green-400"
          onClick={() => router.push("/quiz")}
        >
          <ClipboardCheck className="w-4 h-4 mr-1.5" />
          快速测验
        </Button>
      </div>

      {/* Theme toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="text-muted-foreground hover:text-foreground"
        onClick={toggleTheme}
        aria-label={isDark ? "切换到白天模式" : "切换到夜间模式"}
        title={isDark ? "切换到白天模式" : "切换到夜间模式"}
      >
        {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </Button>

      {/* User dropdown — profile/settings 未实现，先只保留退出 */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="cursor-pointer focus:outline-none">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="text-xs">
                {user?.nickname?.charAt(0) || user?.username?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium text-foreground">
                {user?.nickname || user?.username || "用户"}
              </p>
              <p className="text-xs text-muted-foreground">{user?.email || ""}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={logout} className="text-red-500 dark:text-red-400 focus:text-red-500 dark:focus:text-red-400">
            <LogOut className="w-4 h-4 mr-2" />
            退出登录
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
