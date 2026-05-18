"use client";

import React, { useEffect, useMemo, useState } from "react";
import { BookOpenCheck, Eye, EyeOff, Loader2, Sparkles, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { wrongAnswersApi } from "@/lib/api";
import type { SimilarItem, SimilarQuestionsResponse } from "@/types";

interface SimilarQuestionsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 来源错题的 ID（注意是 wrong_answer.id，不是 question.id） */
  wrongAnswerId: number | null;
  /** 顶部预览：原错题题面，提示用户看的是哪条的"相似题" */
  sourceQuestionPreview?: string;
}

function parseOptions(options?: string): string[] {
  if (!options) return [];
  try {
    const parsed = JSON.parse(options);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

const SOURCE_LABEL: Record<string, string> = {
  DB_NODE: "同节点",
  DB_TOPIC: "同主题",
  DB_SUBJECT: "同学科",
  MIXED: "题库 + AI",
  AI_FALLBACK: "AI 兜底",
};

/**
 * 相似题抽屉 — 列出 5 道相似题（库内 + 可能的 AI 兜底）。
 * 自评模式：题面 + 选项默认可见，点"看答案"才展开正确答案 + 解析。
 *
 * <p>当 aiAvailable=false 时顶部条形警告"AI 生成失败，仅展示 X 道库内题"。
 */
export function SimilarQuestionsDrawer({
  open,
  onOpenChange,
  wrongAnswerId,
  sourceQuestionPreview,
}: SimilarQuestionsDrawerProps) {
  const [data, setData] = useState<SimilarQuestionsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!open || wrongAnswerId == null) return;
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    setData(null);
    setRevealed(new Set());
    wrongAnswersApi
      .similar(wrongAnswerId, 5)
      .then((res) => {
        if (!cancelled) setData(res.data);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const msg =
            err && typeof err === "object" && "message" in err && typeof (err as { message?: unknown }).message === "string"
              ? (err as { message: string }).message
              : "拉取相似题失败";
          setError(msg);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, wrongAnswerId]);

  const items: SimilarItem[] = useMemo(() => data?.items ?? [], [data]);
  const sourceLabel = data?.source ? SOURCE_LABEL[data.source] ?? data.source : null;

  function toggleReveal(i: number) {
    setRevealed((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl flex flex-col gap-3 max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-purple-300">
            <BookOpenCheck className="w-5 h-5" /> 相似题练习
          </DialogTitle>
          {sourceQuestionPreview ? (
            <DialogDescription className="line-clamp-2 text-gray-400">
              原题：{sourceQuestionPreview}
            </DialogDescription>
          ) : null}
        </DialogHeader>

        {/* 顶部状态条 */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {sourceLabel ? (
            <Badge className="bg-purple-500/15 text-purple-300 border border-purple-500/30">
              来源：{sourceLabel}
            </Badge>
          ) : null}
          {data ? (
            <span className="text-gray-500">
              题库 {data.totalFromDb} 道 · AI 生成 {data.totalGenerated} 道
            </span>
          ) : null}
        </div>

        {data && !data.aiAvailable ? (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs p-2.5 flex items-start gap-2">
            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span>
              AI 生成失败，仅展示 {data.totalFromDb} 道库内题。
            </span>
          </div>
        ) : null}

        <div className="flex-1 min-h-[200px] max-h-[60vh] overflow-y-auto rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 space-y-3">
          {isLoading ? (
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              正在挑选相似题…
            </div>
          ) : error ? (
            <div className="text-sm text-red-400 whitespace-pre-wrap">{error}</div>
          ) : items.length === 0 ? (
            <div className="text-sm text-gray-500">未找到相似题。</div>
          ) : (
            items.map((it, i) => {
              const options = parseOptions(it.options);
              const isRevealed = revealed.has(i);
              return (
                <div
                  key={`${it.id ?? "ai"}-${i}`}
                  className="rounded-xl border border-white/[0.06] bg-white/5 p-3 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-xs text-gray-500 flex items-center gap-1.5">
                      <span className="text-purple-300 font-mono">#{i + 1}</span>
                      <span>{it.questionType || "CHOICE"}</span>
                    </div>
                    {it.generated ? (
                      <Badge className="bg-blue-500/15 text-blue-300 border border-blue-500/30 text-[10px]">
                        <Sparkles className="w-3 h-3 mr-1" /> AI 生成
                      </Badge>
                    ) : null}
                  </div>

                  <div className="text-sm text-gray-200 whitespace-pre-wrap">{it.content}</div>

                  {options.length > 0 ? (
                    <div className="grid gap-1">
                      {options.map((opt) => (
                        <div
                          key={opt}
                          className="text-xs rounded-md border border-white/[0.06] bg-white/[0.02] px-2.5 py-1.5 text-gray-300"
                        >
                          {opt}
                        </div>
                      ))}
                    </div>
                  ) : null}

                  <Button
                    variant="outline"
                    size="sm"
                    className="border-purple-500/30 text-purple-300 hover:bg-purple-500/10 h-7 text-xs"
                    onClick={() => toggleReveal(i)}
                  >
                    {isRevealed ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5 mr-1" /> 收起答案
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5 mr-1" /> 看答案
                      </>
                    )}
                  </Button>

                  {isRevealed ? (
                    <div className="rounded-lg border border-white/[0.06] bg-black/30 p-2.5 space-y-1.5">
                      <div className="text-xs text-green-300">
                        正确答案：{it.answer || "—"}
                      </div>
                      {it.explanation ? (
                        <div className="text-xs text-gray-400 whitespace-pre-wrap">
                          {it.explanation}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default SimilarQuestionsDrawer;
