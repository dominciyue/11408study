"use client";

import React, { useEffect, useMemo, useState } from "react";
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
  History,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { studyApi, subjectsApi } from "@/lib/api";
import type { Subject, WeekPlan, StudyPlanRecord } from "@/types";

function extractErrorMessage(err: unknown): string {
  if (typeof err === "string") return err;
  if (err && typeof err === "object") {
    const e = err as { message?: string; code?: number | string };
    if (e.message) return e.message;
    if (e.code !== undefined) return `错误码 ${e.code}`;
  }
  return "AI 调用失败，请稍后重试";
}

/** 安全解析 plan_json → WeekPlan[]；解析失败返回空数组（避免页面崩溃）。 */
function parsePlanJson(json: string | undefined | null): WeekPlan[] {
  if (!json) return [];
  try {
    const arr = JSON.parse(json);
    return Array.isArray(arr) ? (arr as WeekPlan[]) : [];
  } catch {
    return [];
  }
}

export default function StudyPlanPage() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectId, setSubjectId] = useState<number | undefined>(undefined);
  const [weeks, setWeeks] = useState<number>(12);
  const [goal, setGoal] = useState<string>("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [plans, setPlans] = useState<StudyPlanRecord[]>([]);
  const [activePlanId, setActivePlanId] = useState<number | null>(null);
  const [listLoading, setListLoading] = useState(true);

  // —— 初始化：拉学科 + 用户历史计划 ——
  useEffect(() => {
    subjectsApi
      .list()
      .then((res) => setSubjects(res.data))
      .catch(() => {
        // 静默：表单仍可用
      });
    refreshPlans(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * 拉取用户历史计划。selectLatest=true 时把 activePlanId 切到最新一条
   * （首次进入页面 / 生成新计划后调用）。
   */
  async function refreshPlans(selectLatest: boolean) {
    setListLoading(true);
    try {
      const res = await studyApi.listPlans();
      const list = res.data || [];
      setPlans(list);
      if (selectLatest && list.length > 0) {
        setActivePlanId(list[0].id);
      } else if (list.length === 0) {
        setActivePlanId(null);
      }
    } catch {
      // 静默：表单仍可用，列表区会显示"暂无历史计划"
    } finally {
      setListLoading(false);
    }
  }

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
      // 优先用后端返回的 planId 选中；fallback 到 refresh 后取最新
      const newPlanId = typeof data.planId === "number" ? data.planId : null;
      await refreshPlans(newPlanId === null);
      if (newPlanId !== null) {
        setActivePlanId(newPlanId);
      }
    } catch (err: unknown) {
      setError(extractErrorMessage(err));
    } finally {
      setPending(false);
    }
  }

  async function handleDelete(planId: number, e: React.MouseEvent) {
    e.stopPropagation();
    if (!window.confirm("确认删除此份学习计划？")) return;
    try {
      await studyApi.deletePlan(planId);
      // 本地剔除 + 切换 active：若删的就是当前激活的，切到剩余的最新一条
      setPlans((prev) => {
        const next = prev.filter((p) => p.id !== planId);
        if (planId === activePlanId) {
          setActivePlanId(next.length > 0 ? next[0].id : null);
        }
        return next;
      });
    } catch (err: unknown) {
      setError(extractErrorMessage(err));
    }
  }

  // —— 当前展示的计划 + 解析 ——
  const activePlan = useMemo(
    () => plans.find((p) => p.id === activePlanId) || null,
    [plans, activePlanId]
  );
  const activeWeeks: WeekPlan[] = useMemo(
    () => parsePlanJson(activePlan?.planJson),
    [activePlan]
  );
  const activeSubjectName = useMemo(() => {
    if (!activePlan) return null;
    if (activePlan.subjectId == null) return "全部学科";
    return subjects.find((s) => s.id === activePlan.subjectId)?.name || null;
  }, [activePlan, subjects]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Sparkles className="w-7 h-7 text-purple-400" />
          <div>
            <h1 className="text-2xl font-bold text-white">AI 学习计划生成</h1>
            <p className="text-gray-400 text-sm mt-1">
              基于你的学科、目标和当前进度，DeepSeek 为你生成个性化周计划（已云端同步）
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

      {/* 历史计划横向滚动条 */}
      <Card className="border-white/[0.06]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-gray-300 flex items-center gap-2">
            <History className="w-4 h-4 text-blue-400" />
            历史计划
            <span className="text-xs text-gray-500 font-normal">
              （共 {plans.length} 份）
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {listLoading ? (
            <div className="text-xs text-gray-500 flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              加载中...
            </div>
          ) : plans.length === 0 ? (
            <div className="text-xs text-gray-500">暂无历史计划，先在下方生成一份吧</div>
          ) : (
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
              {plans.map((p, idx) => {
                const active = p.id === activePlanId;
                const label = `第 ${plans.length - idx} 份`;
                return (
                  <button
                    key={p.id}
                    onClick={() => setActivePlanId(p.id)}
                    className={`group flex items-center gap-2 shrink-0 rounded-lg border px-3 py-2 text-xs transition ${
                      active
                        ? "border-purple-500/60 bg-purple-500/15 text-purple-100"
                        : "border-white/[0.08] bg-white/[0.03] text-gray-300 hover:bg-white/[0.06]"
                    }`}
                  >
                    <Badge
                      className={
                        active
                          ? "bg-purple-500/30 text-purple-100"
                          : "bg-white/[0.06] text-gray-300"
                      }
                    >
                      {label}
                    </Badge>
                    <span className="font-medium">{p.weeks} 周</span>
                    <span className="text-gray-500 hidden sm:inline">
                      · {new Date(p.createdAt).toLocaleDateString()}
                    </span>
                    <span
                      role="button"
                      tabIndex={0}
                      aria-label="删除此计划"
                      onClick={(e) => handleDelete(p.id, e)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          handleDelete(
                            p.id,
                            e as unknown as React.MouseEvent<HTMLSpanElement>
                          );
                        }
                      }}
                      className="ml-1 rounded p-0.5 text-gray-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

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
          {error ? <div className="text-sm text-red-400">{error}</div> : null}
          <div className="flex justify-end items-center">
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
      {activePlan ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-200 flex items-center gap-2">
                <CalendarRange className="w-5 h-5 text-blue-400" />
                {activePlan.weeks} 周计划
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                目标：{activePlan.goal}
                {activeSubjectName ? ` · 学科：${activeSubjectName}` : ""}
                {` · 创建于 ${new Date(activePlan.createdAt).toLocaleString()}`}
              </p>
            </div>
          </div>

          {activePlan.summary ? (
            <Card className="border-purple-500/20 bg-purple-500/5">
              <CardContent className="p-4">
                <p className="text-sm text-gray-200 whitespace-pre-wrap leading-relaxed">
                  {activePlan.summary}
                </p>
              </CardContent>
            </Card>
          ) : null}

          <div className="space-y-3">
            {activeWeeks.map((w) => (
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
