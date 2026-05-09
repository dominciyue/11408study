"use client";

import React, { useMemo } from "react";
import { CalendarRange, Flame, Trophy, BookOpen, RotateCcw } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { WeeklyReport } from "@/types";

interface WeeklyReportCardProps {
  report: WeeklyReport | undefined;
}

function minutesToHoursText(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes <= 0) return "0m";
  if (minutes < 60) return `${Math.round(minutes)}m`;
  return `${(minutes / 60).toFixed(1)}h`;
}

function shortDate(iso: string): string {
  // expect "yyyy-MM-dd"
  return iso ? iso.slice(5) : iso;
}

export function WeeklyReportCard({ report }: WeeklyReportCardProps) {
  const chartData = useMemo(() => {
    if (!report) return [];
    return report.dailyMinutes.map((m, i) => ({
      day: `D${i + 1}`,
      minutes: m ?? 0,
    }));
  }, [report]);

  if (!report) {
    return (
      <Card className="border-white/[0.06]">
        <CardHeader>
          <CardTitle className="text-base text-gray-200 flex items-center gap-2">
            <CalendarRange className="w-4 h-4 text-blue-400" />
            本周总结
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">暂无数据。</p>
        </CardContent>
      </Card>
    );
  }

  const range = `${shortDate(report.weekStart)} → ${shortDate(report.weekEnd)}`;

  return (
    <Card className="border-white/[0.06]">
      <CardHeader>
        <CardTitle className="text-base text-gray-200 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CalendarRange className="w-4 h-4 text-blue-400" />
            本周总结
          </span>
          <span className="text-xs text-gray-500 font-normal">{range}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 指标行 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <CalendarRange className="w-3 h-3" /> 总时长
            </p>
            <p className="text-xl font-semibold text-blue-300 mt-1">
              {minutesToHoursText(report.totalMinutes)}
            </p>
          </div>
          <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <Flame className="w-3 h-3" /> 活跃天数
            </p>
            <p className="text-xl font-semibold text-orange-300 mt-1">
              {report.daysActive} <span className="text-xs text-gray-500 font-normal">/ 7</span>
            </p>
          </div>
          <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <BookOpen className="w-3 h-3" /> 新学
            </p>
            <p className="text-xl font-semibold text-green-300 mt-1">
              {report.studiedNodesThisWeek}
            </p>
          </div>
          <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <RotateCcw className="w-3 h-3" /> 复习
            </p>
            <p className="text-xl font-semibold text-yellow-300 mt-1">
              {report.reviewedNodesThisWeek}
            </p>
          </div>
        </div>

        {/* 7 天柱图 */}
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }} />
              <YAxis tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  background: "rgba(15, 23, 42, 0.92)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "rgba(255,255,255,0.9)",
                }}
                formatter={(v) => [`${v ?? 0} 分钟`, "学习时长"]}
              />
              <Bar dataKey="minutes" fill="rgba(96, 165, 250, 0.85)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 弱主题 + 徽章 */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-gray-500 mr-1">薄弱主题：</span>
          {report.topWeakTopics.length === 0 ? (
            <span className="text-xs text-gray-600">暂未识别</span>
          ) : (
            report.topWeakTopics.slice(0, 5).map((t) => (
              <Badge key={t} className="bg-orange-500/15 text-orange-300 text-[11px]">
                {t}
              </Badge>
            ))
          )}
          <div className="flex-1" />
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <Trophy className="w-3.5 h-3.5 text-yellow-400" />
            徽章 {report.earnedBadges} 枚
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
