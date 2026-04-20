"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Bell,
  BookOpen,
  ClipboardCheck,
  Moon,
  Sun,
  LogOut,
  User,
  Settings,
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

export function Header() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [darkMode, setDarkMode] = React.useState(true);

  return (
    <header className="flex items-center gap-4 h-16 px-6 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/[0.06] shrink-0 sticky top-0 z-40">
      {/* Search */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <Input
          placeholder="搜索知识点..."
          className="pl-10 bg-white/[0.03] border-white/[0.06] h-9"
        />
      </div>

      <div className="flex-1" />

      {/* Quick actions */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="text-gray-400 hover:text-blue-400"
          onClick={() => router.push("/study")}
        >
          <BookOpen className="w-4 h-4 mr-1.5" />
          开始学习
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-gray-400 hover:text-green-400"
          onClick={() => router.push("/quiz")}
        >
          <ClipboardCheck className="w-4 h-4 mr-1.5" />
          快速测验
        </Button>
      </div>

      {/* Notifications */}
      <Button variant="ghost" size="icon" className="relative text-gray-400 hover:text-gray-200">
        <Bell className="w-5 h-5" />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full" />
      </Button>

      {/* Theme toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="text-gray-400 hover:text-gray-200"
        onClick={() => setDarkMode(!darkMode)}
      >
        {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </Button>

      {/* User dropdown */}
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
              <p className="text-sm font-medium text-gray-200">
                {user?.nickname || user?.username || "用户"}
              </p>
              <p className="text-xs text-gray-500">{user?.email || ""}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => router.push("/profile")}>
            <User className="w-4 h-4 mr-2" />
            个人资料
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push("/settings")}>
            <Settings className="w-4 h-4 mr-2" />
            设置
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={logout} className="text-red-400 focus:text-red-400">
            <LogOut className="w-4 h-4 mr-2" />
            退出登录
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
