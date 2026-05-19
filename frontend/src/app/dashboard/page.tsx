"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Upload,
  Flame,
  TrendingUp,
  Clock,
  CheckCircle2,
  RotateCcw,
  ChevronDown,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuthStore } from "@/stores/auth-store";
import { statsApi } from "@/lib/api";
import type { StatsOverview, WeeklyReport } from "@/types";
import { BadgesCard } from "@/components/dashboard/badges-card";
import { DailyTasksCard } from "@/components/dashboard/daily-tasks-card";
import { WeeklyReportCard } from "@/components/dashboard/weekly-report-card";
import { WeaknessRadarCard } from "@/components/dashboard/WeaknessRadarCard";
import { TodayTargetedCard } from "@/components/dashboard/TodayTargetedCard";
import { StudyHeatmapCard } from "@/components/dashboard/study-heatmap-card";

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
  const [weeklyReport, setWeeklyReport] = useState<WeeklyReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    Promise.allSettled([statsApi.overview(), statsApi.weeklyReport()])
      .then(([ov, wr]) => {
        if (cancelled) return;
        if (ov.status === "fulfilled") setOverview(ov.value.data);
        if (wr.status === "fulfilled") setWeeklyReport(wr.value.data);
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

  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            你好，{user?.nickname || user?.username || "同学"}
          </h1>
          <p className="text-muted-foreground mt-1">今天也要加油学习哦！坚持就是胜利</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex flex-col gap-1.5 px-4 py-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20 min-w-[200px]">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-400" />
              <span className="text-orange-400 font-bold text-lg">{overview?.streakDays ?? 0}</span>
              <span className="text-orange-400/70 text-sm">天连续</span>
              {typeof overview?.longestStreakDays === "number"
                && overview.longestStreakDays > (overview.streakDays ?? 0) ? (
                <span
                  className="ml-auto text-[10px] text-orange-300/60"
                  title="近 365 天内的最长连续学习天数"
                >
                  最长 {overview.longestStreakDays}
                </span>
              ) : null}
            </div>
            {/* 近 14 天 mini 火焰条 — oldest → newest */}
            {overview?.recentActivityDays && overview.recentActivityDays.length > 0 ? (
              <div className="flex items-center gap-0.5" title="最近 14 天学习活动 (← 旧 / 新 →)">
                {overview.recentActivityDays.map((active, i) => (
                  <span
                    key={i}
                    className={
                      active
                        ? "w-2 h-3 rounded-sm bg-orange-400/80"
                        : "w-2 h-3 rounded-sm bg-orange-400/15"
                    }
                  />
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Today's stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {todayStats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-2.5 rounded-xl bg-foreground/5">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{isLoading ? "…" : stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 学习热力图 (Feature — GitHub 风格 52 周热度) */}
      <StudyHeatmapCard minutesByDay={overview?.dailyStudyMinutes} />

      {/* 今日重点 — 弱点画像 + 今日靶向并列（V14 错题闭环） */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <WeaknessRadarCard />
        <TodayTargetedCard />
      </div>

      {/* Subject progress cards */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-500 dark:text-blue-400" />
          学科进度
        </h2>
        {(overview?.subjectProgress ?? []).length === 0 ? (
          <Card className="border-white/[0.06] bg-white/[0.02]">
            <CardContent className="flex flex-col items-center justify-center py-10 text-center">
              <BookOpen className="w-10 h-10 text-gray-600 mb-3" />
              <p className="text-sm text-gray-300">还没有学科进度</p>
              <p className="text-xs text-gray-500 mt-1">
                先上传教材或在知识图谱里学习,这里会显示各科的掌握情况
              </p>
              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/[0.08] text-gray-200 hover:bg-white/10"
                  onClick={() => router.push("/materials")}
                >
                  <Upload className="w-4 h-4 mr-1.5" />
                  上传资料
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/[0.08] text-gray-200 hover:bg-white/10"
                  onClick={() => router.push("/study")}
                >
                  <BookOpen className="w-4 h-4 mr-1.5" />
                  开始学习
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(overview?.subjectProgress ?? []).map((subject) => (
              <Card
                key={subject.code}
                className="border border-white/[0.08] bg-gradient-to-br from-white/[0.06] to-white/[0.02] hover:border-white/[0.16] transition-all duration-300 cursor-pointer"
                onClick={() => router.push(`/subjects/${subject.subjectId}`)}
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
        )}
      </div>

      {/* 成就与活动 — 默认折叠（每日任务 / 徽章 / 本周报告）*/}
      <Card className="border-white/[0.06] bg-white/[0.02]">
        <button
          onClick={() => setMoreOpen(!moreOpen)}
          className="w-full flex items-center justify-between p-4 hover:bg-white/[0.04] transition-colors"
        >
          <span className="text-sm font-medium text-gray-300 flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-400" />
            成就与活动
            <span className="text-xs text-gray-500 ml-2">每日任务·徽章·本周报告</span>
          </span>
          <ChevronDown
            className={`w-4 h-4 text-gray-500 transition-transform ${moreOpen ? "" : "-rotate-90"}`}
          />
        </button>
        {moreOpen ? (
          <CardContent className="p-4 pt-0 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DailyTasksCard tasks={overview?.dailyTasks} />
              <BadgesCard badges={overview?.badges} />
            </div>
            <WeeklyReportCard report={weeklyReport ?? undefined} />
          </CardContent>
        ) : null}
      </Card>
    </div>
  );
}
