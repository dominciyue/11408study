"use client";

import React, { useEffect, useMemo, useState } from "react";
import { BookX, Sparkles, CheckCircle2, ChevronDown, ChevronRight } from "lucide-react";
import { quizApi } from "@/lib/api";
import type { WrongAnswer } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import AiExplainDialog from "@/components/quiz/ai-explain-dialog";

const UNGROUPED_LABEL = "未分类";

export default function WrongAnswersPage() {
  const [items, setItems] = useState<WrongAnswer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [askingFor, setAskingFor] = useState<WrongAnswer | null>(null);
  const [resolvingIds, setResolvingIds] = useState<Set<number>>(new Set());
  const [collapsedTopics, setCollapsedTopics] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    quizApi
      .getWrongAnswers()
      .then((res) => {
        if (!cancelled) setItems(res.data);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // 按 topic 分组
  const grouped = useMemo(() => {
    const m = new Map<string, WrongAnswer[]>();
    for (const w of items) {
      const key = w.topicName || UNGROUPED_LABEL;
      if (!m.has(key)) m.set(key, []);
      m.get(key)!.push(w);
    }
    return Array.from(m.entries()).sort((a, b) => b[1].length - a[1].length);
  }, [items]);

  function toggleTopic(name: string) {
    setCollapsedTopics((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  async function resolve(w: WrongAnswer) {
    if (resolvingIds.has(w.id)) return;
    setResolvingIds((s) => new Set(s).add(w.id));
    try {
      await quizApi.resolveWrongAnswer(w.id);
      // 后端把它标 resolved=true → 从未解决列表里移除
      setItems((prev) => prev.filter((x) => x.id !== w.id));
    } catch (_err) {
      // 静默：失败时按钮回到可点击状态
    } finally {
      setResolvingIds((s) => {
        const next = new Set(s);
        next.delete(w.id);
        return next;
      });
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3">
        <BookX className="w-6 h-6 text-orange-400" />
        <h1 className="text-2xl font-bold text-white">错题本</h1>
        <Badge className="bg-orange-500/20 text-orange-400">{items.length}</Badge>
        {items.length > 0 ? (
          <Badge variant="outline" className="border-white/[0.08] text-gray-400 text-xs ml-2">
            {grouped.length} 个主题
          </Badge>
        ) : null}
      </div>

      {isLoading ? (
        <Card className="border-white/[0.06]">
          <CardContent className="p-6 text-gray-500">加载中…</CardContent>
        </Card>
      ) : items.length === 0 ? (
        <Card className="border-white/[0.06]">
          <CardContent className="p-6 text-gray-500">暂无错题。</CardContent>
        </Card>
      ) : (
        grouped.map(([topicName, list]) => {
          const collapsed = collapsedTopics.has(topicName);
          return (
            <Card key={topicName} className="border-white/[0.06]">
              <CardHeader
                className="cursor-pointer select-none"
                onClick={() => toggleTopic(topicName)}
              >
                <CardTitle className="text-base text-gray-200 flex items-center gap-2">
                  {collapsed ? (
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  )}
                  {topicName}
                  <Badge className="bg-orange-500/15 text-orange-300 ml-1">{list.length}</Badge>
                </CardTitle>
              </CardHeader>
              {collapsed ? null : (
                <CardContent className="space-y-3">
                  {list.map((w) => (
                    <div key={w.id} className="p-4 rounded-xl border border-white/[0.06] bg-white/5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          {w.nodeTitle ? (
                            <p className="text-[11px] text-gray-500 mb-1">📌 {w.nodeTitle}</p>
                          ) : null}
                          <div className="text-sm text-gray-200 whitespace-pre-wrap">
                            {w.questionText}
                          </div>
                          <div className="text-xs text-gray-500 mt-2">
                            你的答案：<span className="text-red-300">{w.userAnswer}</span> · 正确答案：
                            <span className="text-green-300">{w.correctAnswer}</span>
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
                            className="border-blue-500/30 text-blue-300 hover:bg-blue-500/10"
                            onClick={() => setAskingFor(w)}
                          >
                            <Sparkles className="w-4 h-4 mr-1.5" />
                            AI 讲解
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-green-500/30 text-green-300 hover:bg-green-500/10"
                            disabled={resolvingIds.has(w.id)}
                            onClick={() => resolve(w)}
                            title="标记已解决（从错题本移除）"
                          >
                            <CheckCircle2 className="w-4 h-4 mr-1.5" />
                            {resolvingIds.has(w.id) ? "处理中..." : "已解决"}
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
    </div>
  );
}
