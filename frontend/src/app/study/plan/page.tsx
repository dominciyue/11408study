"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Loader2,
  CalendarRange,
  Target,
  ChevronLeft,
  CheckCircle2,
  RotateCcw,
  ListChecks,
  Trash2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { studyApi, subjectsApi } from "@/lib/api";
import type { Subject, WeekPlan } from "@/types";

const STORAGE_KEY = "study11408:ai-plan-v1";

interface SavedPlan {
  generatedAt: string;
  subjectId?: number;
  subjectName?: string;
  weeks: number;
  goal: string;
  summary?: string;
  plan: WeekPlan[];
}

function loadSavedPlan(): SavedPlan | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SavedPlan;
  } catch {
    return null;
  }
}

function saveSavedPlan(plan: SavedPlan): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(plan));
  } catch {
    // quota exceeded — silent
  }
}

function clearSavedPlan(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

function extractErrorMessage(err: unknown): string {
  if (typeof err === "string") return err;
  if (err && typeof err === "object") {
    const e = err as { message?: string; code?: number | string };
    if (e.message) return e.message;
    if (e.code !== undefined) return `错误码 ${e.code}`;
  }
  return "AI 调用失败，请稍后重试";
}

export default function StudyPlanPage() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectId, setSubjectId] = useState<number | undefined>(undefined);
  const [weeks, setWeeks] = useState<number>(12);
  const [goal, setGoal] = useState<string>("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<SavedPlan | null>(null);

  useEffect(() => {
    subjectsApi
      .list()
      .then((res) => setSubjects(res.data))
      .catch(() => {
        // 静默：表单仍可用
      });
    setSaved(loadSavedPlan());
  }, []);

  async function generate() {
    const trimmedGoal = goal.trim();
    if (!trimmedGoal) {
      setError("请填写学习目标");
      return;
    }
    if (weeks < 1 || weeks > 52) {
      setError("周数需在 1-52 之间");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const res = await studyApi.aiPlan({ subjectId, weeks, goal: trimmedGoal });
      const data = res.data || {};
      const planArr = Array.isArray(data.plan) ? (data.plan as WeekPlan[]) : null;
      if (!planArr || planArr.length === 0) {
        setError(data.error || "AI 未生成有效计划，请稍后重试");
        return;
      }
      const subjectName = subjects.find((s) => s.id === subjectId)?.name;
      const next: SavedPlan = {
        generatedAt: new Date().toISOString(),
        subjectId,
        subjectName,
        weeks,
        goal: trimmedGoal,
        summary: typeof data.summary === "string" ? data.summary : undefined,
        plan: planArr,
      };
      saveSavedPlan(next);
      setSaved(next);
    } catch (err: unknown) {
      setError(extractErrorMessage(err));
    } finally {
      setPending(false);
    }
  }

  function handleClear() {
    clearSavedPlan();
    setSaved(null);
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Sparkles className="w-7 h-7 text-purple-400" />
          <div>
            <h1 className="text-2xl font-bold text-white">AI 学习计划生成</h1>
            <p className="text-gray-400 text-sm mt-1">
              基于你的学科、目标和当前进度，DeepSeek 为你生成个性化周计划
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="border-white/[0.08] text-gray-300"
          onClick={() => router.push("/study")}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          返回学习模式
        </Button>
      </div>

      {/* 表单 */}
      <Card className="border-white/[0.06]">
        <CardHeader>
          <CardTitle className="text-base text-gray-200 flex items-center gap-2">
            <Target className="w-4 h-4 text-purple-400" />
            生成新计划
          </CardTitle>
          <CardDescription className="text-gray-500">
            填写学科、计划周数和目标，AI 会根据你已学进度与薄弱点生成
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 block mb-1.5">学科（可选）</label>
              <select
                value={subjectId ?? ""}
                onChange={(e) => setSubjectId(e.target.value ? Number(e.target.value) : undefined)}
                disabled={pending}
                className="w-full rounded-lg border border-white/[0.08] bg-white/5 px-3 py-2 text-sm text-gray-200 outline-none focus:border-purple-500/40 disabled:opacity-50"
              >
                <option value="">全部学科 / 综合</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1.5">周数（1-52）</label>
              <input
                type="number"
                min={1}
                max={52}
                value={weeks}
                onChange={(e) => setWeeks(Number(e.target.value) || 12)}
                disabled={pending}
                className="w-full rounded-lg border border-white/[0.08] bg-white/5 px-3 py-2 text-sm text-gray-200 outline-none focus:border-purple-500/40 disabled:opacity-50"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1.5">学习目标</label>
            <textarea
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="比如：考 408 计算机专业基础，目标 130 分；当前对数据结构掌握较好，操作系统较弱"
              rows={3}
              disabled={pending}
              className="w-full rounded-lg border border-white/[0.08] bg-white/5 px-3 py-2 text-sm text-gray-200 outline-none focus:border-purple-500/40 resize-none disabled:opacity-50"
            />
          </div>
          {error ? (
            <div className="text-sm text-red-400">{error}</div>
          ) : null}
          <div className="flex justify-between items-center">
            <div className="text-xs text-gray-500">
              {saved ? `上一份计划：${new Date(saved.generatedAt).toLocaleString()}` : "暂无历史计划"}
            </div>
            <Button
              onClick={generate}
              disabled={pending || !goal.trim()}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {pending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  生成中（20-60s）...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  生成 {weeks} 周计划
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 周计划展示 */}
      {saved ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-200 flex items-center gap-2">
                <CalendarRange className="w-5 h-5 text-blue-400" />
                {saved.weeks} 周计划
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                目标：{saved.goal}
                {saved.subjectName ? ` · 学科：${saved.subjectName}` : ""}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-red-500/20 text-red-300 hover:bg-red-500/10"
              onClick={handleClear}
            >
              <Trash2 className="w-4 h-4 mr-1" />
              清除
            </Button>
          </div>

          {saved.summary ? (
            <Card className="border-purple-500/20 bg-purple-500/5">
              <CardContent className="p-4">
                <p className="text-sm text-gray-200 whitespace-pre-wrap leading-relaxed">
                  {saved.summary}
                </p>
              </CardContent>
            </Card>
          ) : null}

          <div className="space-y-3">
            {saved.plan.map((w) => (
              <Card key={w.week} className="border-white/[0.06]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-gray-200 flex items-center gap-2">
                    <Badge className="bg-blue-500/20 text-blue-300">第 {w.week} 周</Badge>
                    <span className="font-medium">{w.title}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {Array.isArray(w.goals) && w.goals.length > 0 ? (
                    <div>
                      <p className="text-xs text-gray-400 mb-1.5 flex items-center gap-1">
                        <Target className="w-3.5 h-3.5" /> 本周目标
                      </p>
                      <ul className="space-y-1">
                        {w.goals.map((g, i) => (
                          <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-400 mt-0.5 shrink-0" />
                            <span>{g}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {Array.isArray(w.daily_tasks) && w.daily_tasks.length > 0 ? (
                    <div>
                      <p className="text-xs text-gray-400 mb-1.5 flex items-center gap-1">
                        <ListChecks className="w-3.5 h-3.5" /> 每日任务
                      </p>
                      <ul className="space-y-1">
                        {w.daily_tasks.map((t, i) => (
                          <li key={i} className="text-sm text-gray-300 pl-2 border-l-2 border-blue-500/30">
                            {t}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {Array.isArray(w.review_focus) && w.review_focus.length > 0 ? (
                    <div>
                      <p className="text-xs text-gray-400 mb-1.5 flex items-center gap-1">
                        <RotateCcw className="w-3.5 h-3.5" /> 重点复习
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {w.review_focus.map((r, i) => (
                          <Badge key={i} className="bg-orange-500/15 text-orange-300 text-xs">
                            {r}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
