"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  ClipboardCheck,
  Upload,
  Flame,
  TrendingUp,
  Clock,
  CheckCircle2,
  RotateCcw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuthStore } from "@/stores/auth-store";
import { statsApi } from "@/lib/api";
import type { StatsOverview } from "@/types";
import { BadgesCard } from "@/components/dashboard/badges-card";
import { DailyTasksCard } from "@/components/dashboard/daily-tasks-card";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

function minutesToHoursText(minutes: number) {
  if (!Number.isFinite(minutes)) return "0h";
  const h = minutes / 60;
  if (h < 1) return `${Math.max(0, Math.round(minutes))}m`;
  return `${h.toFixed(1)}h`;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [overview, setOverview] = useState<StatsOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    statsApi
      .overview()
      .then((res) => {
        if (!cancelled) setOverview(res.data);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const todayStats = useMemo(() => {
    const studiedToday = overview?.studiedToday ?? 0;
    const reviewedToday = overview?.reviewedToday ?? 0;
    const minutesToday = overview?.studyTimeTodayMinutes ?? 0;
    const streakDays = overview?.streakDays ?? 0;
    return [
      { label: "已学习", value: String(studiedToday), icon: CheckCircle2, color: "text-green-400" },
      { label: "待复习", value: String(reviewedToday), icon: RotateCcw, color: "text-orange-400" },
      { label: "学习时长", value: minutesToHoursText(minutesToday), icon: Clock, color: "text-blue-400" },
      { label: "连续天数", value: String(streakDays), icon: Flame, color: "text-red-400" },
    ];
  }, [overview]);

  const weeklyChartData = useMemo(() => {
    const arr = overview?.weeklyStudyTimeMinutes ?? [];
    return arr.map((m, idx) => ({ day: `D${idx + 1}`, minutes: m }));
  }, [overview]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            你好，{user?.nickname || user?.username || "同学"}
          </h1>
          <p className="text-gray-400 mt-1">今天也要加油学习哦！坚持就是胜利</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500/10 border border-orange-500/20">
            <Flame className="w-5 h-5 text-orange-400" />
            <span className="text-orange-400 font-bold text-lg">{overview?.streakDays ?? 0}</span>
            <span className="text-orange-400/70 text-sm">天连续</span>
          </div>
        </div>
      </div>

      {/* Today's stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {todayStats.map((stat) => (
          <Card key={stat.label} className="border-white/[0.06]">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-2.5 rounded-xl bg-white/5">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{isLoading ? "…" : stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Daily tasks + Badges (Feature 2 — 游戏化) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DailyTasksCard tasks={overview?.dailyTasks} />
        <BadgesCard badges={overview?.badges} />
      </div>

      {/* Subject progress cards */}
      <div>
        <h2 className="text-lg font-semibold text-gray-200 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-400" />
          学科进度
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(overview?.subjectProgress ?? []).map((subject) => (
            <Card
              key={subject.code}
              className="border border-white/[0.08] bg-gradient-to-br from-white/[0.06] to-white/[0.02] hover:border-white/[0.16] transition-all duration-300 cursor-pointer"
              onClick={() => router.push(`/subjects/${subject.code}`)}
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-100">{subject.name}</h3>
                  <span className="text-sm text-gray-400">
                    {subject.studiedNodes}/{subject.totalNodes}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">已掌握 {subject.masteredNodes} 个</span>
                    <span className="text-gray-200">{subject.progress}%</span>
                  </div>
                  <Progress
                    value={subject.progress}
                    className="h-2"
                    indicatorClassName="bg-blue-500"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-200 mb-4">快速操作</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Button
            variant="outline"
            className="h-auto py-6 flex flex-col items-center gap-3 border-white/[0.08] hover:border-blue-500/30 hover:bg-blue-500/5"
            onClick={() => router.push("/study")}
          >
            <BookOpen className="w-8 h-8 text-blue-400" />
            <div className="text-center">
              <p className="font-medium text-gray-200">开始学习</p>
              <p className="text-xs text-gray-500 mt-1">智能推荐学习内容</p>
            </div>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-6 flex flex-col items-center gap-3 border-white/[0.08] hover:border-green-500/30 hover:bg-green-500/5"
            onClick={() => router.push("/quiz")}
          >
            <ClipboardCheck className="w-8 h-8 text-green-400" />
            <div className="text-center">
              <p className="font-medium text-gray-200">快速测验</p>
              <p className="text-xs text-gray-500 mt-1">检验学习成果</p>
            </div>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-6 flex flex-col items-center gap-3 border-white/[0.08] hover:border-purple-500/30 hover:bg-purple-500/5"
            onClick={() => router.push("/materials")}
          >
            <Upload className="w-8 h-8 text-purple-400" />
            <div className="text-center">
              <p className="font-medium text-gray-200">上传资料</p>
              <p className="text-xs text-gray-500 mt-1">管理学习资料</p>
            </div>
          </Button>
        </div>
      </div>

      {/* Placeholder charts area */}
      <div>
        <h2 className="text-lg font-semibold text-gray-200 mb-4">学习趋势</h2>
        <Card className="border-white/[0.06]">
          <CardHeader>
            <CardTitle className="text-base text-gray-300">每周学习时长（分钟）</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyChartData}>
                  <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="day" tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 12 }} />
                  <YAxis tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(15, 23, 42, 0.9)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      color: "rgba(255,255,255,0.9)",
                    }}
                  />
                  <Bar dataKey="minutes" fill="rgba(59, 130, 246, 0.85)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
