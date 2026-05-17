"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Network,
  BookOpen,
  ClipboardCheck,
  FolderOpen,
  StickyNote,
  Library,
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  GraduationCap,
  Route,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useAuthStore } from "@/stores/auth-store";

// V1 seed 顺序：政治=1, 英语一=2, 数学一=3, 408=4。
// 详情页 /subjects/[id] 接收数字 id，不识别 code 字符串。
const subjectItems = [
  { name: "政治", href: "/subjects/1", color: "bg-red-500", textColor: "text-red-400" },
  { name: "英语一", href: "/subjects/2", color: "bg-blue-500", textColor: "text-blue-400" },
  { name: "数学一", href: "/subjects/3", color: "bg-green-500", textColor: "text-green-400" },
  { name: "408计算机", href: "/subjects/4", color: "bg-purple-500", textColor: "text-purple-400" },
];

const navItems = [
  { name: "仪表盘", href: "/dashboard", icon: LayoutDashboard },
  { name: "知识图谱", href: "/graph", icon: Network },
];

const bottomNavItems = [
  { name: "学习模式", href: "/study", icon: BookOpen },
  { name: "专家路径", href: "/study/paths", icon: Route },
  { name: "测验", href: "/quiz", icon: ClipboardCheck },
  { name: "资料库", href: "/materials", icon: FolderOpen },
  { name: "笔记", href: "/notes", icon: StickyNote },
  { name: "学习资源", href: "/resources", icon: Library },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [subjectsOpen, setSubjectsOpen] = useState(true);
  const { user, logout } = useAuthStore();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <aside
      className={cn(
        "flex flex-col h-screen bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300 shrink-0",
        collapsed ? "w-[68px]" : "w-[260px]"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 shrink-0">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 shrink-0">
          <GraduationCap className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <span className="text-base font-bold text-foreground whitespace-nowrap">
            11408 学习平台
          </span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors cursor-pointer"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      <Separator />

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
              isActive(item.href)
                ? "bg-blue-600/15 text-blue-500 dark:text-blue-400"
                : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
            )}
          >
            <item.icon className="w-5 h-5 shrink-0" />
            {!collapsed && <span>{item.name}</span>}
          </Link>
        ))}

        {/* Subjects section */}
        <div className="pt-2">
          <button
            onClick={() => setSubjectsOpen(!subjectsOpen)}
            className={cn(
              "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-all duration-200 cursor-pointer",
              collapsed && "justify-center"
            )}
          >
            <BookOpen className="w-5 h-5 shrink-0" />
            {!collapsed && (
              <>
                <span>学科</span>
                <ChevronDown
                  className={cn(
                    "w-4 h-4 ml-auto transition-transform duration-200",
                    !subjectsOpen && "-rotate-90"
                  )}
                />
              </>
            )}
          </button>
          {subjectsOpen && !collapsed && (
            <div className="ml-4 mt-1 space-y-0.5 border-l border-sidebar-border pl-3">
              {subjectItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200",
                    isActive(item.href)
                      ? `${item.textColor} bg-foreground/5`
                      : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
                  )}
                >
                  <div className={cn("w-2 h-2 rounded-full shrink-0", item.color)} />
                  <span>{item.name}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <Separator className="!my-3" />

        {bottomNavItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
              isActive(item.href)
                ? "bg-blue-600/15 text-blue-500 dark:text-blue-400"
                : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
            )}
          >
            <item.icon className="w-5 h-5 shrink-0" />
            {!collapsed && <span>{item.name}</span>}
          </Link>
        ))}
      </nav>

      <Separator />

      {/* User section */}
      <div className="p-3">
        <div
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg",
            collapsed && "justify-center"
          )}
        >
          <Avatar className="w-8 h-8 shrink-0">
            <AvatarFallback className="text-xs">
              {user?.nickname?.charAt(0) || user?.username?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {user?.nickname || user?.username || "用户"}
              </p>
              <p className="text-xs text-muted-foreground truncate">{user?.email || ""}</p>
            </div>
          )}
          {!collapsed && (
            <div className="flex items-center gap-1">
              {/* Settings 入口暂未实现，已移除避免死按钮 */}
              <button
                onClick={logout}
                title="退出登录"
                className="p-1.5 rounded-md text-muted-foreground hover:text-red-500 dark:hover:text-red-400 hover:bg-foreground/5 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
