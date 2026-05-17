"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ChevronLeft,
  ChevronDown,
  Calendar,
  Clock,
  Target,
  Users,
  ListChecks,
  Sparkles,
  ExternalLink,
  BookOpen,
  Video,
  AlertCircle,
  Loader2,
  Route as RouteIcon,
  Lightbulb,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { studyPathsApi } from "@/lib/api";
import type { CuratedStudyPath, StudyPathWeekItem } from "@/types";
import { cn } from "@/lib/utils";

// 学科 id → 颜色 tone（与列表页一致）
type Tone = "red" | "blue" | "green" | "purple" | "slate";

const SUBJECT_TONE: Record<number, Tone> = {
  1: "red",
  2: "blue",
  3: "green",
  4: "purple",
};

const TONE_STYLES: Record<
  Tone,
  { dot: string; chip: string; text: string; soft: string; ring: string }
> = {
  red: {
    dot: "bg-red-500",
    chip: "bg-red-500/15 text-red-300 border-red-500/30",
    text: "text-red-300",
    soft: "from-red-500/10 to-transparent",
    ring: "ring-red-500/30",
  },
  blue: {
    dot: "bg-blue-500",
    chip: "bg-blue-500/15 text-blue-300 border-blue-500/30",
    text: "text-blue-300",
    soft: "from-blue-500/10 to-transparent",
    ring: "ring-blue-500/30",
  },
  green: {
    dot: "bg-green-500",
    chip: "bg-green-500/15 text-green-300 border-green-500/30",
    text: "text-green-300",
    soft: "from-green-500/10 to-transparent",
    ring: "ring-green-500/30",
  },
  purple: {
    dot: "bg-purple-500",
    chip: "bg-purple-500/15 text-purple-300 border-purple-500/30",
    text: "text-purple-300",
    soft: "from-purple-500/10 to-transparent",
    ring: "ring-purple-500/30",
  },
  slate: {
    dot: "bg-slate-500",
    chip: "bg-slate-500/15 text-slate-300 border-slate-500/30",
    text: "text-slate-300",
    soft: "from-slate-500/10 to-transparent",
    ring: "ring-slate-500/30",
  },
};

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

/**
 * 解析单条 resource hint：
 * - 形如 "B 站搜索: 王道 数据结构" / "B站搜索：xxx" → 渲染为可跳转的 bilibili 搜索链接
 * - 其它情况返回纯文本展示
 */
function parseResourceHint(hint: string): {
  type: "bilibili" | "url" | "text";
  label: string;
  url?: string;
} {
  const trimmed = hint.trim();

  // 直接是 URL
  if (/^https?:\/\//i.test(trimmed)) {
    return { type: "url", label: trimmed, url: trimmed };
  }

  // "B 站搜索:" / "B站搜索:" / 全角冒号变体
  const bilibiliPattern = /^B\s*站搜索\s*[：:]\s*(.+)$/i;
  const m = trimmed.match(bilibiliPattern);
  if (m) {
    const keyword = m[1].trim();
    if (keyword) {
      return {
        type: "bilibili",
        label: trimmed,
        url: `https://search.bilibili.com/all?keyword=${encodeURIComponent(
          keyword
        )}`,
      };
    }
  }

  return { type: "text", label: trimmed };
}

export default function StudyPathDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const pathId = useMemo(() => {
    const raw = params?.id;
    if (typeof raw !== "string") return NaN;
    return Number.parseInt(raw, 10);
  }, [params]);

  const [path, setPath] = useState<CuratedStudyPath | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openWeeks, setOpenWeeks] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!Number.isFinite(pathId)) {
      setError("invalid id");
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    studyPathsApi
      .get(pathId)
      .then((res) => {
        if (cancelled) return;
        setPath(res.data || null);
        // 默认展开第 1 周（如果有）
        if (res.data?.weeks && res.data.weeks.length > 0) {
          setOpenWeeks(new Set([res.data.weeks[0].id]));
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(extractErrorMessage(err));
          setPath(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [pathId]);

  const tone = useMemo(() => toneForSubject(path?.subjectId), [path]);
  const t = TONE_STYLES[tone];

  function toggleWeek(weekId: number) {
    setOpenWeeks((prev) => {
      const next = new Set(prev);
      if (next.has(weekId)) {
        next.delete(weekId);
      } else {
        next.add(weekId);
      }
      return next;
    });
  }

  function expandAll() {
    if (!path?.weeks) return;
    setOpenWeeks(new Set(path.weeks.map((w) => w.id)));
  }

  function collapseAll() {
    setOpenWeeks(new Set());
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* 返回按钮 */}
      <div>
        <Button
          variant="outline"
          size="sm"
          className="border-white/[0.08] text-gray-300 hover:bg-white/10"
          onClick={() => router.push("/study/paths")}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          返回路径列表
        </Button>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="h-[100px] rounded-xl bg-white/[0.04] border border-white/[0.06] animate-pulse" />
          <div className="h-[200px] rounded-xl bg-white/[0.04] border border-white/[0.06] animate-pulse" />
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            加载中…
          </div>
        </div>
      ) : !path || error ? (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="w-10 h-10 text-amber-400 mb-3" />
            <p className="text-sm text-amber-200 font-medium">
              未找到该学习路径，可能已下架。
            </p>
            {error && error !== "invalid id" && (
              <p className="text-xs text-amber-400/70 mt-1">{error}</p>
            )}
            <Button
              variant="outline"
              size="sm"
              className="mt-4 border-amber-500/30 text-amber-200 hover:bg-amber-500/10"
              onClick={() => router.push("/study/paths")}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              返回路径列表
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* 头部信息卡 */}
          <Card
            className={cn(
              "border-white/[0.06] bg-gradient-to-br to-[#0a0a0f]",
              t.soft
            )}
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div
                  className={cn(
                    "flex items-center justify-center w-12 h-12 rounded-xl ring-1 bg-white/[0.04] shrink-0",
                    t.ring
                  )}
                >
                  <RouteIcon className={cn("w-6 h-6", t.text)} />
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl font-bold text-white leading-tight">
                    {path.title}
                  </h1>
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    <Badge
                      variant="outline"
                      className={cn("text-xs", t.chip)}
                    >
                      <Calendar className="w-3 h-3 mr-1" />
                      {path.durationWeeks} 周
                    </Badge>
                    {path.difficulty && (
                      <Badge
                        variant="outline"
                        className="text-xs bg-white/[0.04] text-gray-300 border-white/[0.08]"
                      >
                        <Sparkles className="w-3 h-3 mr-1" />
                        {path.difficulty}
                      </Badge>
                    )}
                    {typeof path.totalHours === "number" &&
                      path.totalHours > 0 && (
                        <Badge
                          variant="outline"
                          className="text-xs bg-white/[0.04] text-gray-300 border-white/[0.08]"
                        >
                          <Clock className="w-3 h-3 mr-1" />
                          约 {path.totalHours} 小时
                        </Badge>
                      )}
                    {path.targetAudience && (
                      <Badge
                        variant="outline"
                        className="text-xs bg-white/[0.04] text-gray-300 border-white/[0.08]"
                      >
                        <Users className="w-3 h-3 mr-1" />
                        {path.targetAudience}
                      </Badge>
                    )}
                  </div>
                  {path.description && (
                    <p className="mt-4 text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                      {path.description}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 周计划列表 */}
          {Array.isArray(path.weeks) && path.weeks.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-200 flex items-center gap-2">
                  <ListChecks className={cn("w-5 h-5", t.text)} />
                  分周计划
                  <span className="text-xs text-gray-500 font-normal">
                    （共 {path.weeks.length} 周）
                  </span>
                </h2>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 px-2.5 text-xs border-white/[0.08] text-gray-300 hover:bg-white/10"
                    onClick={expandAll}
                  >
                    展开全部
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 px-2.5 text-xs border-white/[0.08] text-gray-300 hover:bg-white/10"
                    onClick={collapseAll}
                  >
                    收起全部
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                {path.weeks.map((week) => (
                  <WeekAccordionItem
                    key={week.id}
                    week={week}
                    tone={tone}
                    open={openWeeks.has(week.id)}
                    onToggle={() => toggleWeek(week.id)}
                  />
                ))}
              </div>
            </div>
          ) : (
            <Card className="border-white/[0.06] bg-white/[0.02]">
              <CardContent className="py-8 text-center text-sm text-gray-500">
                此路径暂无分周详情。
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// 子组件：单周 Accordion 项
// ──────────────────────────────────────────────────────────
function WeekAccordionItem({
  week,
  tone,
  open,
  onToggle,
}: {
  week: StudyPathWeekItem;
  tone: Tone;
  open: boolean;
  onToggle: () => void;
}) {
  const t = TONE_STYLES[tone];

  return (
    <Card
      className={cn(
        "border-white/[0.06] transition-colors",
        open ? "bg-white/[0.03]" : "bg-white/[0.015] hover:bg-white/[0.025]"
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-5 py-4 text-left cursor-pointer"
        aria-expanded={open}
      >
        <Badge
          variant="outline"
          className={cn("shrink-0 text-xs font-semibold", t.chip)}
        >
          第 {week.weekNo} 周
        </Badge>
        <span className="flex-1 text-sm font-medium text-gray-100 leading-snug">
          {week.title}
        </span>
        <ChevronDown
          className={cn(
            "w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <CardContent className="pt-0 pb-5 px-5 space-y-5">
          <div className="border-t border-white/[0.06] -mx-5 mb-2" />

          {/* 本周目标（大字体） */}
          {week.goal && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <Target className={cn("w-3.5 h-3.5", t.text)} />
                <span className="font-medium tracking-wide">本周目标</span>
              </div>
              <p className="text-base text-gray-100 leading-relaxed font-medium">
                {week.goal}
              </p>
            </div>
          )}

          {/* 重点主题 chips */}
          {Array.isArray(week.focusTopics) && week.focusTopics.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <Lightbulb className={cn("w-3.5 h-3.5", t.text)} />
                <span className="font-medium tracking-wide">重点主题</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {week.focusTopics.map((topic, i) => (
                  <Badge
                    key={`${week.id}-focus-${i}`}
                    variant="outline"
                    className={cn("text-xs", t.chip)}
                  >
                    {topic}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* 每日任务 checklist */}
          {Array.isArray(week.dailyTasks) && week.dailyTasks.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <ListChecks className={cn("w-3.5 h-3.5", t.text)} />
                <span className="font-medium tracking-wide">每日任务</span>
              </div>
              <ul className="space-y-1.5">
                {week.dailyTasks.map((task, i) => (
                  <li
                    key={`${week.id}-task-${i}`}
                    className="flex items-start gap-2.5 text-sm text-gray-200"
                  >
                    <span
                      className={cn(
                        "mt-1 w-3.5 h-3.5 rounded border shrink-0",
                        "border-white/[0.15] bg-white/[0.03]"
                      )}
                      aria-hidden
                    />
                    <span className="leading-relaxed">{task}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 资源建议 */}
          {Array.isArray(week.resourceHints) &&
            week.resourceHints.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <BookOpen className={cn("w-3.5 h-3.5", t.text)} />
                  <span className="font-medium tracking-wide">资源建议</span>
                </div>
                <ul className="space-y-1.5">
                  {week.resourceHints.map((hint, i) => (
                    <ResourceHintItem
                      key={`${week.id}-hint-${i}`}
                      hint={hint}
                    />
                  ))}
                </ul>
              </div>
            )}
        </CardContent>
      )}
    </Card>
  );
}

// 单条资源建议（自动识别 B 站搜索 / URL / 纯文本）
function ResourceHintItem({ hint }: { hint: string }) {
  const parsed = parseResourceHint(hint);

  if (parsed.type === "bilibili" && parsed.url) {
    return (
      <li className="flex items-start gap-2 text-sm">
        <Video className="w-3.5 h-3.5 text-pink-400 shrink-0 mt-0.5" />
        <a
          href={parsed.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-pink-300 hover:text-pink-200 underline decoration-pink-400/30 hover:decoration-pink-400/60 underline-offset-2 leading-relaxed inline-flex items-center gap-1"
        >
          {parsed.label}
          <ExternalLink className="w-3 h-3 opacity-70" />
        </a>
      </li>
    );
  }

  if (parsed.type === "url" && parsed.url) {
    return (
      <li className="flex items-start gap-2 text-sm">
        <ExternalLink className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
        <a
          href={parsed.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-300 hover:text-blue-200 underline decoration-blue-400/30 hover:decoration-blue-400/60 underline-offset-2 leading-relaxed break-all"
        >
          {parsed.label}
        </a>
      </li>
    );
  }

  return (
    <li className="flex items-start gap-2 text-sm text-gray-300">
      <BookOpen className="w-3.5 h-3.5 text-gray-500 shrink-0 mt-0.5" />
      <span className="leading-relaxed">{parsed.label}</span>
    </li>
  );
}
