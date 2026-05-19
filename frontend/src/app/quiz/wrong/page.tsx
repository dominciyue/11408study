"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  BookX,
  Sparkles,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  BookOpenCheck,
  ListTree,
} from "lucide-react";
import { wrongAnswersApi } from "@/lib/api";
import type { WrongAnswerGroup, WrongAnswerItem, WrongAnswerCategory } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import AiExplainDialog from "@/components/quiz/ai-explain-dialog";
import { SimilarQuestionsDrawer } from "@/components/wrong/SimilarQuestionsDrawer";

/**
 * 错题本 V14 — 按 node 聚合 + 三大动作（看相似题 / 已掌握 / AI 讲解）。
 *
 * 数据源：GET /api/wrong-answers → WrongAnswerGroup[]
 * 旧的 GET /quiz/wrong-answers 仍保留，但不在这里使用。
 */
/** 病因配色 + 中文标签 — 与后端 5 类英文 key 对齐。 */
const CATEGORY_META: Record<WrongAnswerCategory, { label: string; chip: string }> = {
  CONCEPT_UNCLEAR: { label: "概念不清", chip: "bg-blue-500/15 text-blue-300 border border-blue-500/30" },
  CALCULATION_ERROR: { label: "计算失误", chip: "bg-red-500/15 text-red-300 border border-red-500/30" },
  MISREAD_QUESTION: { label: "审题偏差", chip: "bg-yellow-500/15 text-yellow-300 border border-yellow-500/30" },
  KNOWLEDGE_GAP: { label: "知识盲区", chip: "bg-gray-500/15 text-gray-300 border border-gray-500/30" },
  UNFAMILIAR_TYPE: { label: "题型陌生", chip: "bg-purple-500/15 text-purple-300 border border-purple-500/30" },
};

type Filter = WrongAnswerCategory | "ALL" | "UNCATEGORIZED";

export default function WrongAnswersPage() {
  const [groups, setGroups] = useState<WrongAnswerGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryNonce, setRetryNonce] = useState(0);
  const [collapsedNodes, setCollapsedNodes] = useState<Set<number>>(new Set());
  const [resolvingIds, setResolvingIds] = useState<Set<number>>(new Set());
  const [askingFor, setAskingFor] = useState<WrongAnswerItem | null>(null);
  const [similarFor, setSimilarFor] = useState<WrongAnswerItem | null>(null);
  const [filter, setFilter] = useState<Filter>("ALL");
  const [isClassifying, setIsClassifying] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setLoadError(null);
    wrongAnswersApi
      .list()
      .then((res) => {
        if (!cancelled) setGroups(res.data ?? []);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setGroups([]);
        const msg =
          (err && typeof err === "object" && "message" in err && typeof err.message === "string"
            ? err.message
            : "") || "加载错题本失败,请检查网络";
        setLoadError(msg);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [retryNonce]);

  // 列表加载完后,如果还有未归类条目,后台 best-effort 触发 AI 归类。
  // 完成后 bump retryNonce 让列表刷新拿到新 errorCategory。失败静默。
  useEffect(() => {
    if (isLoading) return;
    const hasUnclassified = groups.some((g) =>
      (g.items ?? []).some((it) => !it.errorCategory),
    );
    if (!hasUnclassified || isClassifying) return;
    let cancelled = false;
    setIsClassifying(true);
    wrongAnswersApi
      .classifyPending()
      .then((res) => {
        if (cancelled) return;
        if ((res.data?.classified ?? 0) > 0) {
          setRetryNonce((n) => n + 1); // 触发列表重拉,拿到 errorCategory
        }
      })
      .catch(() => {
        // 静默 — AI 失败不影响错题展示,下次访问还会重试
      })
      .finally(() => {
        if (!cancelled) setIsClassifying(false);
      });
    return () => {
      cancelled = true;
    };
    // 列表内容变化时(retryNonce/isLoading)重新评估是否需要归类
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, retryNonce]);

  const totalItems = useMemo(
    () => groups.reduce((acc, g) => acc + (g.items?.length ?? 0), 0),
    [groups]
  );

  // 病因维度计数,用于过滤 chips 显示数字。
  const categoryCounts = useMemo(() => {
    const counts: Record<Filter, number> = {
      ALL: 0,
      CONCEPT_UNCLEAR: 0,
      CALCULATION_ERROR: 0,
      MISREAD_QUESTION: 0,
      KNOWLEDGE_GAP: 0,
      UNFAMILIAR_TYPE: 0,
      UNCATEGORIZED: 0,
    };
    for (const g of groups) {
      for (const it of g.items ?? []) {
        counts.ALL += 1;
        if (it.errorCategory) counts[it.errorCategory] += 1;
        else counts.UNCATEGORIZED += 1;
      }
    }
    return counts;
  }, [groups]);

  // 按 filter 过滤 groups(过滤逐 item 后空 group 自动 dropdown)
  const filteredGroups = useMemo(() => {
    if (filter === "ALL") return groups;
    return groups
      .map((g) => {
        const items = (g.items ?? []).filter((it) =>
          filter === "UNCATEGORIZED" ? !it.errorCategory : it.errorCategory === filter,
        );
        return { ...g, items, wrongCount: items.length };
      })
      .filter((g) => (g.items?.length ?? 0) > 0);
  }, [groups, filter]);

  function toggleNode(nodeId: number) {
    setCollapsedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  }

  async function resolve(item: WrongAnswerItem) {
    if (resolvingIds.has(item.id)) return;
    setResolvingIds((s) => new Set(s).add(item.id));
    try {
      await wrongAnswersApi.resolve(item.id);
      // 把这条从 group.items 里移除；如果 group 空了则整组移除
      setGroups((prev) =>
        prev
          .map((g) => {
            if (!g.items?.some((it) => it.id === item.id)) return g;
            const nextItems = g.items.filter((it) => it.id !== item.id);
            return {
              ...g,
              items: nextItems,
              wrongCount: Math.max(0, g.wrongCount - 1),
            };
          })
          .filter((g) => (g.items?.length ?? 0) > 0)
      );
    } catch (_err) {
      // 静默；按钮会回到可点状态
    } finally {
      setResolvingIds((s) => {
        const next = new Set(s);
        next.delete(item.id);
        return next;
      });
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 flex-wrap">
        <BookX className="w-6 h-6 text-orange-400" />
        <h1 className="text-2xl font-bold text-white">错题本</h1>
        <Badge className="bg-orange-500/20 text-orange-400">{totalItems} 道</Badge>
        {groups.length > 0 ? (
          <Badge variant="outline" className="border-white/[0.08] text-gray-400 text-xs">
            <ListTree className="w-3 h-3 mr-1" />
            {groups.length} 个节点
          </Badge>
        ) : null}
        {isClassifying ? (
          <span className="text-xs text-gray-500 ml-auto flex items-center gap-1">
            <Sparkles className="w-3 h-3 animate-pulse" />
            AI 正在分析错因…
          </span>
        ) : null}
      </div>

      {/* 病因过滤 chips — 只在有数据时显示 */}
      {totalItems > 0 ? (
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <button
            onClick={() => setFilter("ALL")}
            className={
              "px-2.5 py-1 rounded-full border transition-colors " +
              (filter === "ALL"
                ? "bg-white/15 border-white/30 text-gray-100"
                : "bg-white/[0.04] border-white/[0.08] text-gray-400 hover:bg-white/10")
            }
          >
            全部 ({categoryCounts.ALL})
          </button>
          {(["CONCEPT_UNCLEAR", "CALCULATION_ERROR", "MISREAD_QUESTION", "KNOWLEDGE_GAP", "UNFAMILIAR_TYPE"] as WrongAnswerCategory[]).map((cat) => {
            const meta = CATEGORY_META[cat];
            const count = categoryCounts[cat];
            const active = filter === cat;
            return (
              <button
                key={cat}
                onClick={() => setFilter(active ? "ALL" : cat)}
                disabled={count === 0}
                className={
                  "px-2.5 py-1 rounded-full transition-opacity " +
                  meta.chip +
                  (active ? " ring-2 ring-white/30" : "") +
                  (count === 0 ? " opacity-40 cursor-not-allowed" : " cursor-pointer hover:opacity-90")
                }
                title={count === 0 ? "暂无此类错题" : `筛选 ${meta.label}`}
              >
                {meta.label} ({count})
              </button>
            );
          })}
          {categoryCounts.UNCATEGORIZED > 0 ? (
            <button
              onClick={() => setFilter(filter === "UNCATEGORIZED" ? "ALL" : "UNCATEGORIZED")}
              className={
                "px-2.5 py-1 rounded-full border border-dashed border-white/[0.12] text-gray-500 hover:bg-white/[0.05] " +
                (filter === "UNCATEGORIZED" ? "ring-2 ring-white/30" : "")
              }
              title="尚未归类(AI 处理中或失败,刷新页面会重试)"
            >
              未归类 ({categoryCounts.UNCATEGORIZED})
            </button>
          ) : null}
        </div>
      ) : null}

      {isLoading ? (
        <Card className="border-white/[0.06]">
          <CardContent className="p-6 text-gray-500">加载中…</CardContent>
        </Card>
      ) : loadError ? (
        <Card className="border-red-500/30 bg-red-500/5">
          <CardContent className="flex flex-col gap-3 p-6">
            <div className="text-sm text-red-300">
              <p className="font-medium">加载错题本失败</p>
              <p className="mt-1 text-xs text-red-400/80">{loadError}</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="self-start border-red-500/30 text-red-300 hover:bg-red-500/10"
              onClick={() => setRetryNonce((n) => n + 1)}
            >
              重试
            </Button>
          </CardContent>
        </Card>
      ) : groups.length === 0 ? (
        <Card className="border-white/[0.06]">
          <CardContent className="p-6 text-center space-y-2">
            <p className="text-sm text-gray-300">暂无错题</p>
            <p className="text-xs text-gray-500">坚持答题,做错的题会自动进入这里复习</p>
          </CardContent>
        </Card>
      ) : filteredGroups.length === 0 ? (
        <Card className="border-white/[0.06]">
          <CardContent className="p-6 text-center space-y-2">
            <p className="text-sm text-gray-300">当前筛选下没有错题</p>
            <p className="text-xs text-gray-500">试试切换其他病因 chip 或回到"全部"</p>
          </CardContent>
        </Card>
      ) : (
        filteredGroups.map((g) => {
          const collapsed = collapsedNodes.has(g.nodeId);
          return (
            <Card key={g.nodeId} className="border-white/[0.06]">
              <CardHeader
                className="cursor-pointer select-none"
                onClick={() => toggleNode(g.nodeId)}
              >
                <CardTitle className="text-base text-gray-200 flex items-center gap-2 flex-wrap">
                  {collapsed ? (
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  )}
                  <span className="truncate">
                    {g.nodeTitle || `节点 #${g.nodeId}`}
                  </span>
                  <Badge className="bg-orange-500/15 text-orange-300">
                    错 {g.wrongCount} 次
                  </Badge>
                  {g.enqueued ? (
                    <Badge className="bg-purple-500/15 text-purple-300 border border-purple-500/30">
                      已入队
                    </Badge>
                  ) : null}
                  {g.topicName ? (
                    <span className="text-xs text-gray-500 font-normal ml-1">
                      · {g.topicName}
                      {g.subjectName ? ` / ${g.subjectName}` : ""}
                    </span>
                  ) : null}
                </CardTitle>
              </CardHeader>
              {collapsed ? null : (
                <CardContent className="space-y-3">
                  {(g.items ?? []).map((w) => (
                    <div
                      key={w.id}
                      className="p-4 rounded-xl border border-white/[0.06] bg-white/5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          {w.errorCategory ? (
                            <span
                              className={
                                "inline-block mb-2 px-2 py-0.5 text-[10px] rounded-full " +
                                CATEGORY_META[w.errorCategory].chip
                              }
                              title="AI 自动归因"
                            >
                              {CATEGORY_META[w.errorCategory].label}
                            </span>
                          ) : null}
                          <div className="text-sm text-gray-200 whitespace-pre-wrap">
                            {w.questionText || `题目 #${w.questionId}`}
                          </div>
                          <div className="text-xs text-gray-500 mt-2">
                            你的答案：
                            <span className="text-red-300">{w.userAnswer || "(空)"}</span>
                            {" · "}
                            正确答案：
                            <span className="text-green-300">{w.correctAnswer || "—"}</span>
                          </div>
                          {w.explanation ? (
                            <div className="text-xs text-gray-400 mt-2 whitespace-pre-wrap">
                              {w.explanation}
                            </div>
                          ) : null}
                        </div>
                        <div className="flex flex-col gap-2 shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-purple-500/30 text-purple-300 hover:bg-purple-500/10"
                            onClick={() => setSimilarFor(w)}
                          >
                            <BookOpenCheck className="w-4 h-4 mr-1.5" />
                            看相似题
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-green-500/30 text-green-300 hover:bg-green-500/10"
                            disabled={resolvingIds.has(w.id)}
                            onClick={() => resolve(w)}
                            title="标记已掌握（从错题本移除并出复习队列）"
                          >
                            <CheckCircle2 className="w-4 h-4 mr-1.5" />
                            {resolvingIds.has(w.id) ? "处理中..." : "我已掌握"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-blue-500/30 text-blue-300 hover:bg-blue-500/10"
                            onClick={() => setAskingFor(w)}
                          >
                            <Sparkles className="w-4 h-4 mr-1.5" />
                            AI 讲解
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              )}
            </Card>
          );
        })
      )}

      {askingFor ? (
        <AiExplainDialog
          open={!!askingFor}
          onOpenChange={(open) => {
            if (!open) setAskingFor(null);
          }}
          questionId={askingFor.questionId}
          userAnswer={askingFor.userAnswer}
          questionPreview={askingFor.questionText}
        />
      ) : null}

      <SimilarQuestionsDrawer
        open={!!similarFor}
        onOpenChange={(open) => {
          if (!open) setSimilarFor(null);
        }}
        wrongAnswerId={similarFor?.id ?? null}
        sourceQuestionPreview={similarFor?.questionText}
      />
    </div>
  );
}
