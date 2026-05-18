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
import type { WrongAnswerGroup, WrongAnswerItem } from "@/types";
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
export default function WrongAnswersPage() {
  const [groups, setGroups] = useState<WrongAnswerGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [collapsedNodes, setCollapsedNodes] = useState<Set<number>>(new Set());
  const [resolvingIds, setResolvingIds] = useState<Set<number>>(new Set());
  const [askingFor, setAskingFor] = useState<WrongAnswerItem | null>(null);
  const [similarFor, setSimilarFor] = useState<WrongAnswerItem | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    wrongAnswersApi
      .list()
      .then((res) => {
        if (!cancelled) setGroups(res.data ?? []);
      })
      .catch(() => {
        if (!cancelled) setGroups([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const totalItems = useMemo(
    () => groups.reduce((acc, g) => acc + (g.items?.length ?? 0), 0),
    [groups]
  );

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
      </div>

      {isLoading ? (
        <Card className="border-white/[0.06]">
          <CardContent className="p-6 text-gray-500">加载中…</CardContent>
        </Card>
      ) : groups.length === 0 ? (
        <Card className="border-white/[0.06]">
          <CardContent className="p-6 text-gray-500">暂无错题。</CardContent>
        </Card>
      ) : (
        groups.map((g) => {
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
