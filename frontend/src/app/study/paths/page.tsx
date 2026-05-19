"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Route,
  Clock,
  Calendar,
  GraduationCap,
  ChevronRight,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { studyPathsApi, subjectsApi } from "@/lib/api";
import type { CuratedStudyPath, Subject } from "@/types";
import { cn } from "@/lib/utils";

// 学科 id → 颜色 tone（与既有 sidebar / resources 页保持一致）
type Tone = "red" | "blue" | "green" | "purple" | "slate";

const SUBJECT_TONE: Record<number, Tone> = {
  1: "red",
  2: "blue",
  3: "green",
  4: "purple",
};

const TONE_STYLES: Record<
  Tone,
  { dot: string; chip: string; text: string; border: string; soft: string }
> = {
  red: {
    dot: "bg-red-500",
    chip: "bg-red-500/15 text-red-300 border-red-500/30",
    text: "text-red-300",
    border: "border-red-500/30",
    soft: "from-red-500/10 to-transparent",
  },
  blue: {
    dot: "bg-blue-500",
    chip: "bg-blue-500/15 text-blue-300 border-blue-500/30",
    text: "text-blue-300",
    border: "border-blue-500/30",
    soft: "from-blue-500/10 to-transparent",
  },
  green: {
    dot: "bg-green-500",
    chip: "bg-green-500/15 text-green-300 border-green-500/30",
    text: "text-green-300",
    border: "border-green-500/30",
    soft: "from-green-500/10 to-transparent",
  },
  purple: {
    dot: "bg-purple-500",
    chip: "bg-purple-500/15 text-purple-300 border-purple-500/30",
    text: "text-purple-300",
    border: "border-purple-500/30",
    soft: "from-purple-500/10 to-transparent",
  },
  slate: {
    dot: "bg-slate-500",
    chip: "bg-slate-500/15 text-slate-300 border-slate-500/30",
    text: "text-slate-300",
    border: "border-slate-500/30",
    soft: "from-slate-500/10 to-transparent",
  },
};

// Tab key：null = 全部
type TabKey = number | null;

function toneForSubject(subjectId?: number): Tone {
  if (subjectId && SUBJECT_TONE[subjectId]) return SUBJECT_TONE[subjectId];
  return "slate";
}

function extractErrorMessage(err: unknown): string {
  if (typeof err === "string") return err;
  if (err && typeof err === "object") {
    const e = err as { message?: string; code?: number | string };
    if (e.message) return e.message;
    if (e.code !== undefined) return `错误码 ${e.code}`;
  }
  return "加载失败，请稍后重试";
}

export default function StudyPathsListPage() {
  const router = useRouter();
  const [paths, setPaths] = useState<CuratedStudyPath[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryNonce, setRetryNonce] = useState(0);

  // 拉学科列表（用于 Tab 名称兜底）
  useEffect(() => {
    let cancelled = false;
    subjectsApi
      .list()
      .then((res) => {
        if (!cancelled) setSubjects(res.data || []);
      })
      .catch(() => {
        // 静默：Tab 仍可用默认名
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // 拉路径列表（随 activeTab 变化）
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    studyPathsApi
      .list(activeTab ?? undefined)
      .then((res) => {
        if (!cancelled) setPaths(res.data || []);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(extractErrorMessage(err));
          setPaths([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeTab, retryNonce]);

  // 默认 Tab 顺序：全部 / 政治 / 英语一 / 数学一 / 408
  const tabs = useMemo<{ key: TabKey; label: string; tone: Tone }[]>(() => {
    const fallback = [
      { id: 1, name: "政治", tone: "red" as Tone },
      { id: 2, name: "英语一", tone: "blue" as Tone },
      { id: 3, name: "数学一", tone: "green" as Tone },
      { id: 4, name: "408", tone: "purple" as Tone },
    ];
    return [
      { key: null as TabKey, label: "全部", tone: "slate" as Tone },
      ...fallback.map((f) => {
        const real = subjects.find((s) => s.id === f.id);
        return {
          key: f.id as TabKey,
          label: real?.name ?? f.name,
          tone: f.tone,
        };
      }),
    ];
  }, [subjects]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* 页头 */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600">
            <Route className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              专家学习路径
              <Sparkles className="w-4 h-4 text-purple-400" />
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              预置 · 分周 · 覆盖政治 / 英语 / 数学 / 408
            </p>
          </div>
        </div>
      </div>

      {/* 学科 Tab */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const active = tab.key === activeTab;
          const t = TONE_STYLES[tab.tone];
          return (
            <button
              key={String(tab.key)}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-all cursor-pointer",
                active
                  ? cn(t.chip, t.border)
                  : "bg-white/[0.03] border-white/[0.08] text-gray-300 hover:bg-white/[0.06] hover:text-white"
              )}
            >
              <span
                className={cn(
                  "w-2 h-2 rounded-full",
                  active ? t.dot : "bg-gray-500"
                )}
                aria-hidden
              />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 主体 */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-[220px] rounded-xl bg-white/[0.04] border border-white/[0.06] animate-pulse"
            />
          ))}
        </div>
      ) : error ? (
        <Card className="border-red-500/30 bg-red-500/5">
          <CardContent className="flex items-start gap-3 p-5">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="text-sm text-red-300">
              <p className="font-medium">加载学习路径失败</p>
              <p className="mt-1 text-xs text-red-400/80">{error}</p>
              <Button
                size="sm"
                variant="outline"
                className="mt-3 border-red-500/30 text-red-300 hover:bg-red-500/10"
                onClick={() => setRetryNonce((n) => n + 1)}
              >
                重试
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : paths.length === 0 ? (
        <Card className="border-white/[0.06] bg-white/[0.02]">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <GraduationCap className="w-10 h-10 text-gray-600 mb-3" />
            <p className="text-sm text-gray-400">
              当前学科暂无预置学习路径
            </p>
            <p className="text-xs text-gray-500 mt-1">
              可切换其他学科 Tab 查看，或先试试「AI 学习计划」生成个性化方案
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4 border-white/[0.08] text-gray-200 hover:bg-white/10"
              onClick={() => router.push("/study/plan")}
            >
              <Sparkles className="w-4 h-4 mr-1.5" />
              去试试 AI 计划
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {paths.map((path) => (
            <PathCard
              key={path.id}
              path={path}
              subjectName={
                subjects.find((s) => s.id === path.subjectId)?.name ?? null
              }
              onOpen={() => router.push(`/study/paths/${path.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// 子组件：单张路径卡片
// ──────────────────────────────────────────────────────────
function PathCard({
  path,
  subjectName,
  onOpen,
}: {
  path: CuratedStudyPath;
  subjectName: string | null;
  onOpen: () => void;
}) {
  const tone = toneForSubject(path.subjectId);
  const t = TONE_STYLES[tone];

  return (
    <Card
      className={cn(
        "border-white/[0.06] bg-gradient-to-br to-[#0a0a0f] hover:border-white/[0.14] transition-all cursor-pointer group",
        t.soft
      )}
      onClick={onOpen}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            {subjectName && (
              <Badge variant="outline" className={cn("text-[10px]", t.chip)}>
                <span
                  className={cn("w-1.5 h-1.5 rounded-full mr-1.5", t.dot)}
                  aria-hidden
                />
                {subjectName}
              </Badge>
            )}
            {path.difficulty && (
              <Badge
                variant="outline"
                className="text-[10px] bg-white/[0.04] text-gray-300 border-white/[0.08]"
              >
                {path.difficulty}
              </Badge>
            )}
          </div>
        </div>
        <CardTitle className="text-base font-semibold text-gray-100 leading-snug mt-2">
          {path.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {path.description && (
          <p className="text-sm text-gray-400 leading-relaxed line-clamp-3">
            {path.description}
          </p>
        )}

        <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {path.durationWeeks} 周
          </span>
          {typeof path.totalHours === "number" && path.totalHours > 0 && (
            <>
              <span className="text-gray-700">·</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                约 {path.totalHours} 小时
              </span>
            </>
          )}
        </div>

        <div className="flex justify-end pt-1">
          <Button
            size="sm"
            variant="outline"
            className="h-8 px-3 text-xs gap-1.5 border-white/[0.08] bg-white/[0.03] text-gray-200 hover:bg-white/10 group-hover:text-white"
            onClick={(e) => {
              e.stopPropagation();
              onOpen();
            }}
          >
            查看分周计划
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
